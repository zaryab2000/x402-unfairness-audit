/**
 * Pass 2 re-cut: raw listing fields by rank quartile.
 *
 * Pass 1 (analyze.ts) decomposes the score into its own components, so it can
 * only speak in the formula's terms. Pass 2 asks a formula-independent
 * question: sort merchants by where the index actually put them, then look at
 * four raw fields nobody scored. If the top quartile were winning on
 * documentation quality, it would show up here without any weights involved.
 *
 * Quartile boundaries are READ from `data/analysis-results.json` rather than
 * recomputed, so the cut aligns with Pass 1 by construction.
 *
 * Three aggregation rules are emitted, because "one merchant, one listing" is a
 * choice and the choice could flatter the result:
 *   - primary   — the merchant's first resource (the figures cited in the report)
 *   - pooled    — every resource the merchant lists, pooled
 *   - max       — the merchant's best value on each field
 * The direction of each axis should hold under all three. Magnitudes shift.
 *
 * Usage:  npm run recut
 */

import * as fs from "node:fs/promises";
import {
  ANALYZED_CATEGORIES,
  loadSnapshot,
  type RawMerchant,
  type RawResource,
} from "./snapshot.ts";

const ANALYSIS_FILE = "data/analysis-results.json";
const OUTPUT_FILE = "data/recut-results.json";

function log(msg: string): void {
  console.log(`[recut] ${msg}`);
}

function round(x: number, decimals: number): number {
  const f = Math.pow(10, decimals);
  return Math.round(x * f) / f;
}

type AggregationRule = "primary" | "pooled" | "max";

interface QuartileFields {
  label: string;
  rankRange: string;
  merchantCount: number;
  /** Sample size actually measured: merchants for primary/max, resources for pooled. */
  sampleSize: number;
  inputSchemaPct: number;
  outputExamplePct: number;
  meanDescriptionLength: number;
  meanTagCount: number;
}

/** Parse "1–9" (en dash, as emitted by analyze.ts) into [1, 9]. */
function parseRankRange(range: string): [number, number] {
  const [lo, hi] = range.split("–").map((s) => Number(s.trim()));
  if (lo === undefined || hi === undefined || Number.isNaN(lo) || Number.isNaN(hi)) {
    throw new Error(`Unparseable rank range: "${range}"`);
  }
  return [lo, hi];
}

/**
 * Reduce a merchant to the resources that represent it under a given rule.
 * Merchants with no resources contribute nothing.
 */
function resourcesFor(m: RawMerchant, rule: AggregationRule): RawResource[] {
  if (m.resources.length === 0) return [];
  if (rule === "pooled") return m.resources;
  const first = m.resources[0];
  return first ? [first] : [];
}

function measureQuartile(
  label: string,
  rankRange: string,
  quartileMerchants: RawMerchant[],
  rule: AggregationRule,
): QuartileFields {
  if (rule === "max") {
    // One row per merchant, taking the merchant's best value on each field
    // independently — a merchant counts as documented if ANY listing is.
    const rows = quartileMerchants
      .filter((m) => m.resources.length > 0)
      .map((m) => ({
        hasInputSchema: m.resources.some((r) => r.hasInputSchema),
        hasOutputExample: m.resources.some((r) => r.hasOutputExample),
        descriptionLength: Math.max(...m.resources.map((r) => r.descriptionLength)),
        tagCount: Math.max(...m.resources.map((r) => r.tagCount)),
      }));
    const n = rows.length;
    return {
      label,
      rankRange,
      merchantCount: quartileMerchants.length,
      sampleSize: n,
      inputSchemaPct: n === 0 ? 0 : round((100 * rows.filter((r) => r.hasInputSchema).length) / n, 1),
      outputExamplePct: n === 0 ? 0 : round((100 * rows.filter((r) => r.hasOutputExample).length) / n, 1),
      meanDescriptionLength: n === 0 ? 0 : round(rows.reduce((a, r) => a + r.descriptionLength, 0) / n, 1),
      meanTagCount: n === 0 ? 0 : round(rows.reduce((a, r) => a + r.tagCount, 0) / n, 2),
    };
  }

  const rows = quartileMerchants.flatMap((m) => resourcesFor(m, rule));
  const n = rows.length;
  return {
    label,
    rankRange,
    merchantCount: quartileMerchants.length,
    sampleSize: n,
    inputSchemaPct: n === 0 ? 0 : round((100 * rows.filter((r) => r.hasInputSchema).length) / n, 1),
    outputExamplePct: n === 0 ? 0 : round((100 * rows.filter((r) => r.hasOutputExample).length) / n, 1),
    meanDescriptionLength: n === 0 ? 0 : round(rows.reduce((a, r) => a + r.descriptionLength, 0) / n, 1),
    meanTagCount: n === 0 ? 0 : round(rows.reduce((a, r) => a + r.tagCount, 0) / n, 2),
  };
}

async function main(): Promise<void> {
  const snapshot = await loadSnapshot();
  const analysis = JSON.parse(await fs.readFile(ANALYSIS_FILE, "utf-8")) as {
    categories: Array<{
      categoryName: string;
      quartiles: Record<string, { label: string; rankRange: string }>;
    }>;
  };

  log(`Snapshot ${snapshot.collectedAt}`);
  log(`Quartile boundaries read from ${ANALYSIS_FILE}`);

  const rules: AggregationRule[] = ["primary", "pooled", "max"];
  const out: Record<string, Record<string, QuartileFields[]>> = {
    primary: {},
    pooled: {},
    max: {},
  };

  for (const categoryName of ANALYZED_CATEGORIES) {
    const catMerchants = snapshot.merchants.filter(
      (m) => m.categoryName === categoryName,
    );
    // Same ordering as Pass 1: by the rank the index actually assigned.
    const sortedByRank = [...catMerchants].sort(
      (a, b) => (a.rankPosition ?? 999999) - (b.rankPosition ?? 999999),
    );

    const analysisCat = analysis.categories.find(
      (c) => c.categoryName === categoryName,
    );
    if (!analysisCat) {
      throw new Error(
        `No Pass 1 analysis for "${categoryName}" — run \`npm run analyze\` first.`,
      );
    }

    for (const rule of rules) {
      const quartiles: QuartileFields[] = [];
      for (const key of ["q1", "q2", "q3", "q4"]) {
        const q = analysisCat.quartiles[key];
        if (!q) throw new Error(`Missing quartile ${key} for ${categoryName}`);
        const [lo, hi] = parseRankRange(q.rankRange);
        // Boundaries are 1-indexed rank positions, inclusive.
        const slice = sortedByRank.slice(lo - 1, hi);
        quartiles.push(measureQuartile(q.label, q.rankRange, slice, rule));
      }
      out[rule]![categoryName] = quartiles;
    }
  }

  const results = {
    snapshotCollectedAt: snapshot.collectedAt,
    quartileBoundariesFrom: ANALYSIS_FILE,
    analyzedCategories: ANALYZED_CATEGORIES,
    aggregationRules: {
      primary: "First resource per merchant. The figures cited in the report.",
      pooled: "Every resource per merchant, pooled. Multi-listing merchants weigh more.",
      max: "One row per merchant, best value per field. A merchant counts as documented if any listing is.",
    },
    fields: {
      inputSchemaPct: "% of sampled listings publishing an input schema",
      outputExamplePct: "% of sampled listings publishing an output example",
      meanDescriptionLength: "mean description length in characters",
      meanTagCount: "mean number of tags",
    },
    byRule: out,
  };

  await fs.writeFile(OUTPUT_FILE, JSON.stringify(results, null, 2));
  log(`Wrote ${OUTPUT_FILE}`);

  // Print the report's headline table for eyeball comparison.
  log("");
  log("Data & Enrichment — primary-resource rule (the table in the report):");
  const de = out["primary"]!["Data & Enrichment"]!;
  log(`  quartile:          ${de.map((q) => q.label.padStart(7)).join("")}`);
  log(`  input schema %:    ${de.map((q) => String(q.inputSchemaPct).padStart(7)).join("")}`);
  log(`  output example %:  ${de.map((q) => String(q.outputExamplePct).padStart(7)).join("")}`);
  log(`  mean desc length:  ${de.map((q) => String(q.meanDescriptionLength).padStart(7)).join("")}`);
  log(`  mean tag count:    ${de.map((q) => String(q.meanTagCount).padStart(7)).join("")}`);
  log("Done.");
}

main().catch((err) => {
  console.error("[recut] FAILED:", err);
  process.exit(1);
});
