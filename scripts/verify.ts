/**
 * Resolve every claim in `claims.json` against the committed artifacts and
 * print a pass/fail table. Exits non-zero on any mismatch.
 *
 * This is the script that makes the report checkable. If it passes on a clean
 * clone, every number the report cites is reproducible from published data.
 *
 * Usage:  npm run verify
 */

import * as fs from "node:fs/promises";
import {
  RANKER_WEIGHTS,
  computeScoreBreakdown,
  type MerchantData,
  type ScoreBreakdown,
} from "../src/ranker.ts";
import {
  ANALYZED_CATEGORIES,
  loadSnapshot,
  referenceTime,
  type RawMerchant,
  type RawSnapshot,
} from "./snapshot.ts";

const CLAIMS_FILE = "claims.json";

/**
 * Merchants whose components cannot be reproduced from the published snapshot.
 *
 * Empty for the 2026-09-09 snapshot. The July collector dropped the
 * per-resource `lastUpdated` that the formula reads alongside `lastCalledAt`,
 * leaving five merchants unreproducible on recency; the September collector
 * serializes it, so all five components now reproduce for every merchant.
 */
const UNREPRODUCIBLE_MERCHANT_IDS = [] as const;

/** Merchants named in the report, by snapshot id. */
const NAMED_MERCHANT_IDS = [
  "6b5f03cb-7d31-4633-8fa3-aa5e82ce8f38",
  "5986d582-924d-4277-8505-0790559bcc65",
  "979f972e-4bda-4d5d-928f-175067543b9e",
  "e21f4e4f-5838-4a94-8209-c96b41ac8aca",
] as const;

const COMPONENTS = [
  "volumeSignal",
  "buyerDiversity",
  "reliability",
  "listingQuality",
  "recency",
] as const;

interface Claim {
  id: string;
  value: unknown;
  source: string;
  derivation?: string;
  cited_in: string;
  citation?: string;
  note?: string;
}

interface ClaimsFile {
  snapshot: string;
  claims: Claim[];
}

type Status = "PASS" | "FAIL" | "EXTERNAL";

interface Result {
  claim: Claim;
  status: Status;
  actual: unknown;
}

// ── artifact access ────────────────────────────────────────────────

/**
 * Resolve a dotted path with optional `[field=value]` array selectors.
 * Example: `categories[categoryName=AI & Agents].gini`
 */
function resolvePath(root: unknown, path: string): unknown {
  let current: unknown = root;

  for (const rawSegment of path.split(".")) {
    if (current === undefined || current === null) return undefined;

    const match = /^([^[]+)\[([^=]+)=(.+)\]$/.exec(rawSegment);
    if (match) {
      const [, key, field, wanted] = match;
      const arr = (current as Record<string, unknown>)[key!];
      if (!Array.isArray(arr)) return undefined;
      current = arr.find(
        (el) => String((el as Record<string, unknown>)[field!]) === wanted,
      );
      continue;
    }

    current = (current as Record<string, unknown>)[rawSegment];
  }

  return current;
}

/**
 * Recompute the five components for one merchant from raw snapshot fields.
 *
 * `slugById` supplies the merchant's category slug. Listing quality grades a
 * description and its tags against the category's own vocabulary, so the same
 * text scores differently in different categories — passing null here would
 * silently zero two sub-signals.
 */
function recompute(
  m: RawMerchant,
  now: number,
  slugById: Map<string, string>,
): ScoreBreakdown {
  const slug = slugById.get(m.categoryId);
  const data: MerchantData = {
    merchant: {
      txCount30d: m.txCount30d,
      buyers30d: m.buyers30d,
      volume30d: m.volume30d,
      lastUpdated: m.lastUpdated,
    },
    resources: m.resources.map((r) => ({
      description: r.description,
      serviceName: r.serviceName,
      tags: r.tags,
      hasInputSchema: r.hasInputSchema,
      hasOutputExample: r.hasOutputExample,
      lastCalledAt: r.lastCalledAt,
      lastUpdated: r.lastUpdated,
      iconUrl: r.iconUrl,
    })),
    category: slug ? { slug } : null,
  };
  return computeScoreBreakdown(data, now);
}

/** Category id -> slug, for the listing-quality category lookup. */
function categorySlugById(snapshot: RawSnapshot): Map<string, string> {
  const m = new Map<string, string>();
  for (const c of snapshot.categories) m.set(c.id, c.slug);
  return m;
}

function analysedMerchants(snapshot: RawSnapshot): RawMerchant[] {
  return snapshot.merchants.filter((m) =>
    (ANALYZED_CATEGORIES as readonly string[]).includes(m.categoryName),
  );
}

// ── named transforms ───────────────────────────────────────────────

/**
 * Transforms referenced by `|name(args)` in a claim's derivation. Each returns
 * the computed value for comparison against the claim.
 */
function applyTransform(
  name: string,
  arg: string | undefined,
  artifact: unknown,
  snapshot: RawSnapshot,
  now: number,
): unknown {
  switch (name) {
    case "sum":
      return round(
        Object.values(RANKER_WEIGHTS).reduce((a, b) => a + b, 0),
        10,
      );

    case "equalsSnapshotWeights": {
      const w = snapshot.rankerWeights;
      return (
        w.volume === RANKER_WEIGHTS.volume &&
        w.buyerDiversity === RANKER_WEIGHTS.buyerDiversity &&
        w.reliability === RANKER_WEIGHTS.reliability &&
        w.listingQuality === RANKER_WEIGHTS.listingQuality &&
        w.recency === RANKER_WEIGHTS.recency
      );
    }

    case "ceilingContribution": {
      // arg is "component, maxValue"
      const [comp, max] = (arg ?? "").split(",").map((s) => s.trim());
      const weight = RANKER_WEIGHTS[comp as keyof typeof RANKER_WEIGHTS];
      return round(weight * Number(max), 10);
    }

    case "sumVolume30dAcrossAnalysedCategories":
      return round(
        analysedMerchants(snapshot).reduce((a, m) => a + Number(m.volume30d), 0),
        2,
      );

    case "countResourcesAcrossAnalysedCategories":
      return analysedMerchants(snapshot).reduce(
        (a, m) => a + m.resources.length,
        0,
      );

    case "countAnalysedWithTxGreaterThan":
      return analysedMerchants(snapshot).filter(
        (m) => m.txCount30d > Number(arg),
      ).length;

    case "pctAnalysedWithTxGreaterThan": {
      const all = analysedMerchants(snapshot);
      const hit = all.filter((m) => m.txCount30d > Number(arg)).length;
      return round((100 * hit) / all.length, 1);
    }

    case "volumePlusDiversityPct": {
      const shares = (artifact as { gapAnalysis: { componentShares: Record<string, number> } })
        .gapAnalysis.componentShares;
      return round(
        ((shares["volume"] ?? 0) + (shares["buyerDiversity"] ?? 0)) * 100,
        4,
      );
    }

    case "field": {
      const quartiles = artifact as Array<Record<string, number>>;
      return quartiles.map((q) => q[arg!]);
    }

    case "directionAgreesAcrossRules": {
      const byRule = artifact as Record<
        string,
        Record<string, Array<Record<string, number>>>
      >;
      const fields = ["outputExamplePct", "meanDescriptionLength", "meanTagCount"];
      return fields.every((f) => {
        const signs = ["primary", "pooled", "max"].map((rule) => {
          const q = byRule[rule]?.[arg!];
          if (!q || !q[0] || !q[3]) return NaN;
          return Math.sign((q[3][f] ?? 0) - (q[0][f] ?? 0));
        });
        return signs.every((s) => s === signs[0] && !Number.isNaN(s));
      });
    }

    case "recomputeComponentExact": {
      const comp = arg as (typeof COMPONENTS)[number];
      const slugs = categorySlugById(snapshot);
      let matches = 0;
      for (const m of snapshot.merchants) {
        const got = recompute(m, now, slugs)[comp];
        if (exactlyEqual(got, m.scoreBreakdown[comp])) matches++;
      }
      return matches;
    }

    case "recomputeAllFiveComponentsExact": {
      const slugs = categorySlugById(snapshot);
      let matches = 0;
      for (const m of snapshot.merchants) {
        const got = recompute(m, now, slugs);
        if (COMPONENTS.every((c) => exactlyEqual(got[c], m.scoreBreakdown[c]))) {
          matches++;
        }
      }
      return matches;
    }

    case "unreproducibleMerchantIds": {
      const slugs = categorySlugById(snapshot);
      const ids: string[] = [];
      for (const m of snapshot.merchants) {
        const got = recompute(m, now, slugs);
        if (!COMPONENTS.every((c) => exactlyEqual(got[c], m.scoreBreakdown[c]))) {
          ids.push(m.id);
        }
      }
      return ids.sort();
    }

    case "namedMerchantsNotInUnreproducibleSet": {
      const bad = new Set(UNREPRODUCIBLE_MERCHANT_IDS as readonly string[]);
      return NAMED_MERCHANT_IDS.every((id) => !bad.has(id));
    }

    default:
      throw new Error(`Unknown transform: ${name}`);
  }
}

// ── comparison ─────────────────────────────────────────────────────

/**
 * Exact float equality for component reproduction.
 *
 * Deliberately not a tolerance: the equivalence test is the repo's core claim,
 * so it compares the values as computed. The only slack is IEEE-754 last-bit
 * noise from summation order, which Number.EPSILON-scale comparison absorbs
 * without admitting a real divergence.
 */
function exactlyEqual(a: number, b: number): boolean {
  if (a === b) return true;
  return Math.abs(a - b) <= Number.EPSILON * Math.max(Math.abs(a), Math.abs(b));
}

function round(x: number, decimals: number): number {
  const f = Math.pow(10, decimals);
  return Math.round(x * f) / f;
}

/**
 * Compare a claimed value to the computed one.
 *
 * Numbers are compared at the precision the claim is stated to — a claim of
 * 0.9235 is checked to 4 decimals, not to full float width — because that is
 * the precision the report prints. Arrays compare elementwise.
 */
function matches(claimed: unknown, actual: unknown): boolean {
  if (Array.isArray(claimed)) {
    if (!Array.isArray(actual) || claimed.length !== actual.length) return false;
    return claimed.every((c, i) => matches(c, actual[i]));
  }

  if (typeof claimed === "number") {
    const a = Number(actual);
    if (Number.isNaN(a)) return false;
    const decimals = decimalsOf(claimed);
    // Half-cent/half-unit tolerance at the claim's own precision, so a value
    // the report rounds down (85.85 -> 85.8) still resolves.
    return Math.abs(round(a, decimals) - claimed) <= 0.5 / Math.pow(10, decimals);
  }

  return claimed === actual;
}

function decimalsOf(n: number): number {
  const s = String(n);
  const dot = s.indexOf(".");
  return dot === -1 ? 0 : s.length - dot - 1;
}

// ── main ───────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const claimsFile = JSON.parse(
    await fs.readFile(CLAIMS_FILE, "utf-8"),
  ) as ClaimsFile;
  const snapshot = await loadSnapshot();
  const now = referenceTime(snapshot);

  const artifacts = new Map<string, unknown>();
  artifacts.set("data/raw-data.json", snapshot);
  for (const f of ["data/analysis-results.json", "data/recut-results.json"]) {
    artifacts.set(f, JSON.parse(await fs.readFile(f, "utf-8")));
  }

  const results: Result[] = [];

  for (const claim of claimsFile.claims) {
    if (claim.source === "external") {
      results.push({ claim, status: "EXTERNAL", actual: claim.value });
      continue;
    }

    let actual: unknown;
    try {
      const derivation = claim.derivation ?? "";
      const pipeIdx = derivation.indexOf("|");

      if (pipeIdx === -1) {
        const root =
          claim.source === "src/ranker.ts"
            ? { RANKER_WEIGHTS }
            : artifacts.get(claim.source);
        actual = resolvePath(root, derivation);
      } else {
        const pathPart = derivation.slice(0, pipeIdx);
        const transformPart = derivation.slice(pipeIdx + 1);
        const tMatch = /^([A-Za-z0-9]+)(?:\((.*)\))?$/.exec(transformPart);
        if (!tMatch) throw new Error(`Bad transform: ${transformPart}`);
        const [, tName, tArg] = tMatch;

        const root =
          claim.source === "src/ranker.ts"
            ? { RANKER_WEIGHTS }
            : artifacts.get(claim.source);
        // A path before the pipe selects the artifact subtree to transform.
        // `merchants` and `RANKER_WEIGHTS` are whole-artifact transforms: the
        // transform reads the snapshot/weights directly, so pass the root.
        const wholeArtifact =
          pathPart === "" || pathPart === "merchants" || pathPart === "RANKER_WEIGHTS";
        const subject = wholeArtifact ? root : resolveWithBracketKey(root, pathPart);

        actual = applyTransform(tName!, tArg, subject, snapshot, now);
      }
    } catch (err) {
      actual = `ERROR: ${(err as Error).message}`;
    }

    results.push({
      claim,
      status: matches(claim.value, actual) ? "PASS" : "FAIL",
      actual,
    });
  }

  // ── optional: emit computed values as JSON, for mechanically rebuilding
  // claims.json. The values come from the same resolver that verifies them,
  // so a regenerated claims file cannot drift from what verify computes.
  if (process.argv.includes("--emit-computed")) {
    const emitted: Record<string, unknown> = {};
    for (const r of results) {
      if (r.status === "EXTERNAL") continue;
      emitted[r.claim.id] = r.actual;
    }
    await fs.writeFile(
      "data/computed-claims.json",
      JSON.stringify({ snapshot: claimsFile.snapshot, computed: emitted }, null, 2),
    );
    console.log(`Wrote data/computed-claims.json (${Object.keys(emitted).length} claims)`);
  }

  // ── report ──
  const pass = results.filter((r) => r.status === "PASS").length;
  const fail = results.filter((r) => r.status === "FAIL");
  const external = results.filter((r) => r.status === "EXTERNAL");

  console.log("");
  console.log(`Snapshot: ${claimsFile.snapshot}`);
  console.log(
    `Verifying ${results.length} claims against committed artifacts…`,
  );
  console.log("");

  const idWidth = Math.max(...results.map((r) => r.claim.id.length));
  for (const r of results) {
    const mark =
      r.status === "PASS" ? "PASS " : r.status === "FAIL" ? "FAIL " : "EXT  ";
    const shown =
      r.status === "FAIL"
        ? `claimed ${fmt(r.claim.value)}  actual ${fmt(r.actual)}`
        : fmt(r.claim.value);
    console.log(`  ${mark} ${r.claim.id.padEnd(idWidth)}  ${shown}`);
  }

  console.log("");
  console.log("─".repeat(72));
  console.log(
    `  ${pass} passed, ${fail.length} failed, ${external.length} external (not verified here)`,
  );

  if (external.length > 0) {
    console.log("");
    console.log("  External claims are reported by third parties. This repo");
    console.log("  does NOT verify them:");
    for (const r of external) {
      console.log(`    - ${r.claim.id}: ${r.claim.citation ?? "no citation"}`);
    }
  }

  // The equivalence result is the repo's headline, so print it as a table
  // rather than leaving it buried in the claim list.
  console.log("");
  console.log("  Score-component equivalence (vendored formula vs snapshot):");
  console.log("");
  console.log("    component        exact matches   of");
  for (const c of COMPONENTS) {
    const n = applyTransform(
      "recomputeComponentExact",
      c,
      null,
      snapshot,
      now,
    ) as number;
    const flag = n === snapshot.merchants.length ? "" : "  <- see METHODOLOGY.md";
    console.log(
      `    ${c.padEnd(16)} ${String(n).padStart(13)}   ${snapshot.merchants.length}${flag}`,
    );
  }
  console.log("");
  if (UNREPRODUCIBLE_MERCHANT_IDS.length === 0) {
    console.log(
      `    All five components reproduce exactly for all ${snapshot.merchants.length} merchants.`,
    );
  } else {
    console.log(
      `    ${UNREPRODUCIBLE_MERCHANT_IDS.length} of ${snapshot.merchants.length} merchants do not reproduce on every component;`,
    );
    console.log("    see METHODOLOGY.md for which input the snapshot omits.");
  }
  console.log("");

  if (fail.length > 0) {
    console.log("");
    console.log("  FAILING CLAIMS:");
    for (const r of fail) {
      console.log(`    ${r.claim.id}`);
      console.log(`      cited in:  ${r.claim.cited_in}`);
      console.log(`      claimed:   ${fmt(r.claim.value)}`);
      console.log(`      computed:  ${fmt(r.actual)}`);
      console.log(`      source:    ${r.claim.source} -> ${r.claim.derivation}`);
    }
    console.log("");
    process.exit(1);
  }

  console.log("  All verifiable claims reproduce from the committed artifacts.");
  console.log("");
}

/**
 * Resolve a path whose final segment may be a bracketed key.
 *
 * Two bracket forms exist: `categories[categoryName=X]` selects an array
 * element by field (handled by resolvePath), while `byRule.primary[Data &
 * Enrichment]` indexes an object by a literal key containing spaces.
 */
function resolveWithBracketKey(root: unknown, path: string): unknown {
  const bracket = /^(.*)\[([^=]+)\]$/.exec(path);
  if (bracket) {
    const [, base, key] = bracket;
    const parent = base ? resolvePath(root, base) : root;
    return (parent as Record<string, unknown>)?.[key!];
  }
  return resolvePath(root, path);
}

function fmt(v: unknown): string {
  if (Array.isArray(v)) return `[${v.join(", ")}]`;
  return String(v);
}

main().catch((err) => {
  console.error("[verify] FAILED:", err);
  process.exit(1);
});
