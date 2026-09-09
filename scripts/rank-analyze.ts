/**
 * ANALYSIS: what the collected rankings show.
 *
 * Pure function over a committed file. No network, deterministic — re-running
 * on the same input always produces the same output, so a finding can be
 * checked without re-querying a live index that has since moved.
 *
 * Four experiments:
 *
 *   E1  Rank vs. signals   Which observable feature predicts final rank on CDP,
 *                          whose formula is unpublished. Spearman correlation
 *                          between rank and each candidate signal.
 *
 *   E2  Reachability       How much of the catalog any query surfaces at all,
 *                          given a hard top-20 cap and no pagination.
 *
 *   E3  Cross-index        Same query, two indices. Overlap and rank agreement.
 *                          Disagreement means discoverability is a property of
 *                          the index, not of the merchant.
 *
 *   E4  Relevance vs usage AgentCash publishes both the pure-semantic rank and
 *                          the final reranked position. The displacement between
 *                          them is the incumbency premium, measured directly
 *                          rather than inferred.
 *
 * Usage:  npm run rank:analyze -- data/rank-experiment-<date>.json
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";

import { CATEGORIES, registerPairs, type Category } from "./queries.js";

function log(msg = ""): void {
  console.log(msg);
}

// ── input shapes ───────────────────────────────────────────────────

interface RankedResult {
  position: number;
  resource: string;
  serviceName: string | null;
  payTo: string | null;
  calls30d: number | null;
  payers30d: number | null;
  lastCalledAt: string | null;
  priceUsd: number | null;
  descriptionLength: number;
  tagCount: number;
  hasServiceName: boolean;
  hasIcon: boolean;
  hasInputSchema: boolean;
  hasOutputExample: boolean;
  curated: boolean;
}

interface QueryRun {
  queryId: string;
  queryText: string;
  pairId: string;
  category: Category;
  register: "technical" | "casual";
  searchMethod: string | null;
  resultCount: number;
  results: RankedResult[];
  stableAcrossRepeats: boolean;
  error?: string;
}

interface CollectedFile {
  collectedAt: string;
  index: string;
  searchLimit: number;
  catalogTotal: number | null;
  runs: QueryRun[];
}

/** AgentCash sidecar. Written by the MCP-driven collection step. */
interface AgentCashResult {
  position: number;
  resource: string;
  score: number | null;
  vectorSimilarityScore: number | null;
  vectorSimilarityRank: number | null;
  originTransactionCount: number | null;
  originUniqueUsers: number | null;
  originVolumeUsd: number | null;
  trustedUserUsageRatio: number | null;
}

interface AgentCashRun {
  queryId: string;
  queryText: string;
  resultCount: number;
  results: AgentCashResult[];
}

interface AgentCashFile {
  collectedAt: string;
  index: string;
  runs: AgentCashRun[];
}

// ── statistics ─────────────────────────────────────────────────────

/**
 * Spearman rank correlation. Ties get average ranks, so repeated values (very
 * common here — dozens of merchants sit at exactly 1 call) do not distort it.
 * Returns null when fewer than 3 usable pairs or when either side is constant.
 */
function spearman(xs: number[], ys: number[]): number | null {
  if (xs.length !== ys.length || xs.length < 3) return null;

  const rank = (values: number[]): number[] => {
    const indexed = values.map((v, i) => ({ v, i }));
    indexed.sort((a, b) => a.v - b.v);
    const ranks = new Array<number>(values.length);
    let i = 0;
    while (i < indexed.length) {
      let j = i;
      while (j + 1 < indexed.length && indexed[j + 1]!.v === indexed[i]!.v) j++;
      const avg = (i + j) / 2 + 1;
      for (let k = i; k <= j; k++) ranks[indexed[k]!.i] = avg;
      i = j + 1;
    }
    return ranks;
  };

  const rx = rank(xs);
  const ry = rank(ys);
  const n = xs.length;
  const mean = (a: number[]): number => a.reduce((s, v) => s + v, 0) / a.length;
  const mx = mean(rx);
  const my = mean(ry);

  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const a = rx[i]! - mx;
    const b = ry[i]! - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  if (dx === 0 || dy === 0) return null;
  return num / Math.sqrt(dx * dy);
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? ((s[mid - 1]! + s[mid]!) / 2) : s[mid]!;
}

function jaccard(a: Set<string>, b: Set<string>): number | null {
  if (a.size === 0 && b.size === 0) return null;
  let inter = 0;
  for (const v of a) if (b.has(v)) inter++;
  return inter / (a.size + b.size - inter);
}

function fmt(n: number | null, digits = 4): string {
  return n === null || !Number.isFinite(n) ? "—" : n.toFixed(digits);
}

/** Normalises trailing-slash and case differences across indices. */
function normalizeUrl(u: string): string {
  return u.trim().replace(/\/+$/, "").toLowerCase();
}

/** Cross-index comparison is by host: the two indices key on different paths. */
function hostOf(u: string): string | null {
  try {
    return new URL(u).host.toLowerCase();
  } catch {
    return null;
  }
}

function daysSince(iso: string | null, from: Date): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return (from.getTime() - t) / 86_400_000;
}

// ── E1: rank vs signals ────────────────────────────────────────────

/**
 * Correlates final rank against each observable signal, pooled across queries.
 *
 * Rank is inverted (position 1 -> highest value) so a POSITIVE correlation
 * always means "more of this signal, better placement", whatever the signal.
 */
interface SignalCorrelation {
  signal: string;
  spearman: number | null;
  n: number;
}

function experiment1(runs: QueryRun[], collectedAt: Date): {
  pooled: SignalCorrelation[];
  perQuery: Array<{ queryId: string; calls: number | null; payers: number | null }>;
  topVsBottom: Record<string, { top: number | null; bottom: number | null }>;
} {
  const usable = runs.filter((r) => !r.error && r.results.length >= 3);

  // Pool by normalising rank within each query, so a 20-result query and a
  // 4-result query contribute comparable observations.
  const pooled: Array<{ invRank: number; r: RankedResult }> = [];
  for (const run of usable) {
    const n = run.results.length;
    for (const r of run.results) {
      pooled.push({ invRank: (n - r.position + 1) / n, r });
    }
  }

  const signals: Array<{ name: string; get: (r: RankedResult) => number | null }> = [
    { name: "calls30d", get: (r) => r.calls30d },
    { name: "payers30d", get: (r) => r.payers30d },
    { name: "recency (−days since last call)", get: (r) => {
      const d = daysSince(r.lastCalledAt, collectedAt);
      return d === null ? null : -d;
    } },
    { name: "descriptionLength", get: (r) => r.descriptionLength },
    { name: "tagCount", get: (r) => r.tagCount },
    { name: "hasInputSchema", get: (r) => (r.hasInputSchema ? 1 : 0) },
    { name: "hasOutputExample", get: (r) => (r.hasOutputExample ? 1 : 0) },
    { name: "hasIcon", get: (r) => (r.hasIcon ? 1 : 0) },
    { name: "hasServiceName", get: (r) => (r.hasServiceName ? 1 : 0) },
    { name: "priceUsd", get: (r) => r.priceUsd },
  ];

  const correlations: SignalCorrelation[] = [];
  for (const s of signals) {
    const xs: number[] = [];
    const ys: number[] = [];
    for (const p of pooled) {
      const v = s.get(p.r);
      if (v === null || !Number.isFinite(v)) continue;
      xs.push(v);
      ys.push(p.invRank);
    }
    correlations.push({ signal: s.name, spearman: spearman(xs, ys), n: xs.length });
  }
  correlations.sort((a, b) => Math.abs(b.spearman ?? 0) - Math.abs(a.spearman ?? 0));

  // Per-query, so a single dominant query cannot manufacture the pooled result.
  const perQuery = usable.map((run) => {
    const inv = run.results.map((r) => run.results.length - r.position + 1);
    const callPairs = run.results.map((r) => r.calls30d);
    const payerPairs = run.results.map((r) => r.payers30d);
    const keep = (vals: Array<number | null>): { xs: number[]; ys: number[] } => {
      const xs: number[] = [];
      const ys: number[] = [];
      vals.forEach((v, i) => {
        if (v !== null && Number.isFinite(v)) {
          xs.push(v);
          ys.push(inv[i]!);
        }
      });
      return { xs, ys };
    };
    const c = keep(callPairs);
    const p = keep(payerPairs);
    return {
      queryId: run.queryId,
      calls: spearman(c.xs, c.ys),
      payers: spearman(p.xs, p.ys),
    };
  });

  // Top-5 vs bottom-5 medians: the same question without assuming monotonicity.
  const topRows: RankedResult[] = [];
  const bottomRows: RankedResult[] = [];
  for (const run of usable) {
    if (run.results.length < 6) continue;
    topRows.push(...run.results.filter((r) => r.position <= 5));
    bottomRows.push(...run.results.slice(-5));
  }
  const medianOf = (rows: RankedResult[], get: (r: RankedResult) => number | null) =>
    median(rows.map(get).filter((v): v is number => v !== null && Number.isFinite(v)));

  const topVsBottom: Record<string, { top: number | null; bottom: number | null }> = {
    calls30d: { top: medianOf(topRows, (r) => r.calls30d), bottom: medianOf(bottomRows, (r) => r.calls30d) },
    payers30d: { top: medianOf(topRows, (r) => r.payers30d), bottom: medianOf(bottomRows, (r) => r.payers30d) },
    descriptionLength: {
      top: medianOf(topRows, (r) => r.descriptionLength),
      bottom: medianOf(bottomRows, (r) => r.descriptionLength),
    },
    tagCount: { top: medianOf(topRows, (r) => r.tagCount), bottom: medianOf(bottomRows, (r) => r.tagCount) },
  };

  return { pooled: correlations, perQuery, topVsBottom };
}

// ── E2: reachability ───────────────────────────────────────────────

function experiment2(file: CollectedFile): {
  uniqueSurfaced: number;
  catalogTotal: number | null;
  coveragePct: number | null;
  medianResults: number | null;
  queriesAtCap: number;
  zeroTxSurfaced: number;
  surfacedWithTx: number;
  uniquePayees: number;
  repeatPayees: Array<{ payTo: string; queries: number }>;
} {
  const usable = file.runs.filter((r) => !r.error);
  const urls = new Set<string>();
  const payeeQueries = new Map<string, Set<string>>();
  let zeroTx = 0;
  let withTx = 0;

  for (const run of usable) {
    for (const r of run.results) {
      if (r.resource) urls.add(normalizeUrl(r.resource));
      if (r.payTo) {
        const set = payeeQueries.get(r.payTo) ?? new Set<string>();
        set.add(run.queryId);
        payeeQueries.set(r.payTo, set);
      }
    }
  }

  // Count zero-transaction listings once per unique resource, not per appearance.
  const seen = new Set<string>();
  for (const run of usable) {
    for (const r of run.results) {
      const key = normalizeUrl(r.resource);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      if ((r.calls30d ?? 0) === 0) zeroTx++;
      else withTx++;
    }
  }

  const repeats = [...payeeQueries.entries()]
    .map(([payTo, qs]) => ({ payTo, queries: qs.size }))
    .filter((e) => e.queries > 1)
    .sort((a, b) => b.queries - a.queries)
    .slice(0, 10);

  return {
    uniqueSurfaced: urls.size,
    catalogTotal: file.catalogTotal,
    coveragePct: file.catalogTotal ? (urls.size / file.catalogTotal) * 100 : null,
    medianResults: median(usable.map((r) => r.resultCount)),
    queriesAtCap: usable.filter((r) => r.resultCount >= file.searchLimit).length,
    zeroTxSurfaced: zeroTx,
    surfacedWithTx: withTx,
    uniquePayees: payeeQueries.size,
    repeatPayees: repeats,
  };
}

// ── C: register sensitivity (the v2 centrepiece) ───────────────────

interface RegisterPairResult {
  pairId: string;
  category: Category;
  technicalText: string;
  casualText: string;
  technicalCount: number;
  casualCount: number;
  /** Casual results as a fraction of technical. Null when technical is empty. */
  retentionRatio: number | null;
  jaccard: number | null;
  sharedCount: number;
  topOneSame: boolean;
  /** Casual returned nothing at all — the intent is unreachable in plain words. */
  casualZero: boolean;
}

/**
 * The same buyer need, asked technically and casually. If a merchant's
 * visibility survives only the vocabulary its own listing uses, discoverability
 * is a property of the sentence rather than of the service.
 */
function experimentRegister(runs: QueryRun[]): RegisterPairResult[] {
  const byId = new Map(runs.map((r) => [r.queryId, r]));
  const out: RegisterPairResult[] = [];

  for (const [pairId, pair] of registerPairs()) {
    const tech = byId.get(pair.technical.id);
    const cas = byId.get(pair.casual.id);
    if (!tech || !cas || tech.error || cas.error) continue;

    const st = new Set(tech.results.map((r) => normalizeUrl(r.resource)));
    const sc = new Set(cas.results.map((r) => normalizeUrl(r.resource)));
    let shared = 0;
    for (const v of st) if (sc.has(v)) shared++;

    out.push({
      pairId,
      category: pair.technical.category,
      technicalText: pair.technical.text,
      casualText: pair.casual.text,
      technicalCount: tech.results.length,
      casualCount: cas.results.length,
      retentionRatio:
        tech.results.length === 0 ? null : cas.results.length / tech.results.length,
      jaccard: jaccard(st, sc),
      sharedCount: shared,
      topOneSame:
        tech.results[0] !== undefined &&
        cas.results[0] !== undefined &&
        normalizeUrl(tech.results[0].resource) === normalizeUrl(cas.results[0].resource),
      casualZero: cas.results.length === 0,
    });
  }
  return out;
}

// ── F: per-category comparison (new in v2) ─────────────────────────

interface CategoryStats {
  category: Category;
  queries: number;
  technicalResults: number;
  casualResults: number;
  meanTechnical: number | null;
  meanCasual: number | null;
  uniqueResources: number;
  uniquePayees: number;
  /** Share of all results held by the single most-surfaced payee. */
  topPayeeShare: number | null;
  topPayee: string | null;
  medianJaccard: number | null;
  callsVsRank: number | null;
}

/**
 * Every analysis, cut by category. Lets the report's own concentration figures
 * (HHI 6,798 for Data & Enrichment vs 1,700 for Finance & Markets) be tested
 * against live ranking behaviour rather than assumed to transmit.
 */
function experimentByCategory(
  runs: QueryRun[],
  pairs: RegisterPairResult[],
): CategoryStats[] {
  const out: CategoryStats[] = [];

  for (const cat of CATEGORIES) {
    const catRuns = runs.filter((r) => r.category === cat && !r.error);
    if (catRuns.length === 0) continue;

    const tech = catRuns.filter((r) => r.register === "technical");
    const cas = catRuns.filter((r) => r.register === "casual");

    const urls = new Set<string>();
    const payeeCounts = new Map<string, number>();
    let total = 0;
    for (const run of catRuns) {
      for (const r of run.results) {
        total++;
        if (r.resource) urls.add(normalizeUrl(r.resource));
        if (r.payTo) payeeCounts.set(r.payTo, (payeeCounts.get(r.payTo) ?? 0) + 1);
      }
    }

    let topPayee: string | null = null;
    let topCount = 0;
    for (const [payee, n] of payeeCounts) {
      if (n > topCount) {
        topCount = n;
        topPayee = payee;
      }
    }

    // Pooled calls-vs-rank within this category only.
    const xs: number[] = [];
    const ys: number[] = [];
    for (const run of catRuns) {
      const n = run.results.length;
      if (n < 3) continue;
      for (const r of run.results) {
        if (r.calls30d === null || !Number.isFinite(r.calls30d)) continue;
        xs.push(r.calls30d);
        ys.push((n - r.position + 1) / n);
      }
    }

    const catJaccards = pairs
      .filter((p) => p.category === cat)
      .map((p) => p.jaccard)
      .filter((v): v is number => v !== null);

    const sum = (a: number[]) => a.reduce((s, v) => s + v, 0);
    const techResults = sum(tech.map((r) => r.results.length));
    const casResults = sum(cas.map((r) => r.results.length));

    out.push({
      category: cat,
      queries: catRuns.length,
      technicalResults: techResults,
      casualResults: casResults,
      meanTechnical: tech.length ? techResults / tech.length : null,
      meanCasual: cas.length ? casResults / cas.length : null,
      uniqueResources: urls.size,
      uniquePayees: payeeCounts.size,
      topPayeeShare: total > 0 ? topCount / total : null,
      topPayee,
      medianJaccard: median(catJaccards),
      callsVsRank: spearman(xs, ys),
    });
  }
  return out;
}

// ── E3: cross-index disagreement ───────────────────────────────────

function experiment3(cdp: CollectedFile, ac: AgentCashFile): Array<{
  queryId: string;
  cdpCount: number;
  acCount: number;
  hostJaccard: number | null;
  sharedHosts: number;
  topOneSameHost: boolean;
  rankAgreement: number | null;
}> {
  const acById = new Map(ac.runs.map((r) => [r.queryId, r]));
  const out: Array<{
    queryId: string;
    cdpCount: number;
    acCount: number;
    hostJaccard: number | null;
    sharedHosts: number;
    topOneSameHost: boolean;
    rankAgreement: number | null;
  }> = [];

  for (const run of cdp.runs) {
    if (run.error) continue;
    const acRun = acById.get(run.queryId);
    if (!acRun) continue;

    // Compare by host: the indices key on different path granularity, so a URL
    // match would understate agreement between the same two services.
    const cdpHosts: string[] = [];
    for (const r of run.results) {
      const h = hostOf(r.resource);
      if (h && !cdpHosts.includes(h)) cdpHosts.push(h);
    }
    const acHosts: string[] = [];
    for (const r of acRun.results) {
      const h = hostOf(r.resource);
      if (h && !acHosts.includes(h)) acHosts.push(h);
    }

    const setC = new Set(cdpHosts);
    const setA = new Set(acHosts);
    const shared = cdpHosts.filter((h) => setA.has(h));

    // Rank agreement over the hosts both indices returned.
    const xs: number[] = [];
    const ys: number[] = [];
    for (const h of shared) {
      xs.push(cdpHosts.indexOf(h) + 1);
      ys.push(acHosts.indexOf(h) + 1);
    }

    out.push({
      queryId: run.queryId,
      cdpCount: run.results.length,
      acCount: acRun.results.length,
      hostJaccard: jaccard(setC, setA),
      sharedHosts: shared.length,
      topOneSameHost: cdpHosts[0] !== undefined && cdpHosts[0] === acHosts[0],
      rankAgreement: spearman(xs, ys),
    });
  }
  return out;
}

// ── E4: relevance vs usage (AgentCash) ─────────────────────────────

/**
 * AgentCash publishes the pure-semantic rank alongside the final rank, so the
 * reranking is directly observable.
 *
 * `vectorSimilarityRank` indexes the FULL candidate pool while `position`
 * indexes only the returned page, so their raw difference is dominated by that
 * offset and would score almost every result as "promoted". The honest measure
 * is relative: re-rank the returned set by its own vector ranks, and compare
 * that ordering to the one the agent actually receives. Displacement is then
 * how many places usage moved a result RELATIVE TO ITS PEERS.
 */
function experiment4(ac: AgentCashFile): {
  rows: Array<{
    queryId: string;
    resource: string;
    finalRank: number;
    vectorRank: number | null;
    relevanceOnlyRank: number | null;
    displacement: number | null;
    originTx: number | null;
  }>;
  medianAbsDisplacement: number | null;
  promotedByUsage: number;
  demotedByUsage: number;
  unmoved: number;
  maxPromotion: { resource: string; queryId: string; places: number } | null;
  usageVsDisplacement: number | null;
  vectorVsFinal: number | null;
} {
  const rows: Array<{
    queryId: string;
    resource: string;
    finalRank: number;
    vectorRank: number | null;
    relevanceOnlyRank: number | null;
    displacement: number | null;
    originTx: number | null;
  }> = [];

  for (const run of ac.runs) {
    // Rank the returned set by vector similarity alone — the counterfactual
    // ordering an agent would see if usage signals carried no weight.
    const ordered = run.results
      .filter((r) => r.vectorSimilarityRank !== null)
      .slice()
      .sort((a, b) => a.vectorSimilarityRank! - b.vectorSimilarityRank!);
    const relevanceOnly = new Map<string, number>();
    ordered.forEach((r, i) => relevanceOnly.set(r.resource, i + 1));

    for (const r of run.results) {
      const rel = relevanceOnly.get(r.resource) ?? null;
      rows.push({
        queryId: run.queryId,
        resource: r.resource,
        finalRank: r.position,
        vectorRank: r.vectorSimilarityRank,
        relevanceOnlyRank: rel,
        // Positive = usage promoted it above where relevance alone put it.
        displacement: rel === null ? null : rel - r.position,
        originTx: r.originTransactionCount,
      });
    }
  }

  const withDisp = rows.filter((r) => r.displacement !== null);
  const dispVals = withDisp.map((r) => Math.abs(r.displacement!));

  const txs: number[] = [];
  const disps: number[] = [];
  for (const r of withDisp) {
    if (r.originTx === null || !Number.isFinite(r.originTx)) continue;
    txs.push(r.originTx);
    disps.push(r.displacement!);
  }

  const vr: number[] = [];
  const fr: number[] = [];
  for (const r of withDisp) {
    vr.push(r.relevanceOnlyRank!);
    fr.push(r.finalRank);
  }

  let best: { resource: string; queryId: string; places: number } | null = null;
  for (const r of withDisp) {
    if (best === null || r.displacement! > best.places) {
      best = { resource: r.resource, queryId: r.queryId, places: r.displacement! };
    }
  }

  return {
    rows,
    medianAbsDisplacement: median(dispVals),
    promotedByUsage: withDisp.filter((r) => r.displacement! > 0).length,
    demotedByUsage: withDisp.filter((r) => r.displacement! < 0).length,
    unmoved: withDisp.filter((r) => r.displacement! === 0).length,
    maxPromotion: best,
    usageVsDisplacement: spearman(txs, disps),
    vectorVsFinal: spearman(vr, fr),
  };
}

// ── reporting ──────────────────────────────────────────────────────

function reportE1(e1: ReturnType<typeof experiment1>): void {
  log("\n═══ E1 · What predicts rank on CDP ═══");
  log("Spearman vs placement, pooled across queries. Positive = more of this");
  log("signal means better placement. CDP's formula is unpublished; this infers it.\n");
  log("    signal                              spearman      n");
  for (const c of e1.pooled) {
    log(`    ${c.signal.padEnd(34)} ${fmt(c.spearman).padStart(8)}   ${String(c.n).padStart(4)}`);
  }

  log("\n  Median top-5 vs bottom-5 of each result page:");
  log("    feature                    top-5     bottom-5");
  for (const [k, v] of Object.entries(e1.topVsBottom)) {
    log(`    ${k.padEnd(24)} ${fmt(v.top, 1).padStart(8)}   ${fmt(v.bottom, 1).padStart(10)}`);
  }

  log("\n  Per-query (guards against one query driving the pooled figure):");
  log("    query                    calls~rank   payers~rank");
  for (const q of e1.perQuery) {
    log(`    ${q.queryId.padEnd(24)} ${fmt(q.calls).padStart(9)}   ${fmt(q.payers).padStart(11)}`);
  }
}

function reportE2(e2: ReturnType<typeof experiment2>, limit: number): void {
  log("\n═══ E2 · Reachability ═══");
  log(`Search returns at most ${limit} results and exposes no offset. There is no page 2.\n`);
  log(`    Catalog size                  ${e2.catalogTotal ?? "unknown"}`);
  log(`    Unique resources surfaced     ${e2.uniqueSurfaced}`);
  log(
    `    Share of catalog reached      ${e2.coveragePct === null ? "—" : `${e2.coveragePct.toFixed(3)}%`}`,
  );
  log(`    Median results per query      ${fmt(e2.medianResults, 1)}`);
  log(`    Queries hitting the cap       ${e2.queriesAtCap}`);
  log(`    Unique payee addresses        ${e2.uniquePayees}`);
  log(`    Surfaced with 0 calls in 30d  ${e2.zeroTxSurfaced}`);
  log(`    Surfaced with >0 calls        ${e2.surfacedWithTx}`);

  if (e2.repeatPayees.length > 0) {
    log("\n  Payees surfacing across multiple queries:");
    for (const p of e2.repeatPayees) {
      log(`    ${p.payTo}  ${p.queries} queries`);
    }
  }
}

function reportRegister(pairs: RegisterPairResult[]): void {
  log("\n═══ C · Register sensitivity ═══");
  log("Same buyer need, asked technically then casually. Low overlap means");
  log("discoverability tracks the buyer's vocabulary, not the merchant.\n");
  log("    pair    tech  casual  retain   jaccard  shared  sameTop1");
  for (const p of pairs) {
    const retain = p.retentionRatio === null ? "—" : `${(p.retentionRatio * 100).toFixed(0)}%`;
    log(
      `    ${p.pairId.padEnd(6)} ${String(p.technicalCount).padStart(4)}  ${String(p.casualCount).padStart(6)}  ` +
        `${retain.padStart(6)}   ${fmt(p.jaccard, 3).padStart(7)}  ${String(p.sharedCount).padStart(6)}  ${String(p.topOneSame).padStart(8)}`,
    );
  }

  const js = pairs.map((p) => p.jaccard).filter((v): v is number => v !== null);
  const zeroOverlap = pairs.filter((p) => p.jaccard === 0).length;
  const techTotal = pairs.reduce((s, p) => s + p.technicalCount, 0);
  const casTotal = pairs.reduce((s, p) => s + p.casualCount, 0);

  log(`\n    Pairs compared                ${pairs.length}`);
  log(`    Technical results total       ${techTotal}  (mean ${(techTotal / pairs.length).toFixed(1)})`);
  log(`    Casual results total          ${casTotal}  (mean ${(casTotal / pairs.length).toFixed(1)})`);
  log(`    Casual retention overall      ${techTotal ? ((casTotal / techTotal) * 100).toFixed(1) : "—"}%`);
  log(`    Median Jaccard                ${fmt(median(js), 3)}`);
  log(`    Pairs with ZERO overlap       ${zeroOverlap} of ${pairs.length}`);
  log(`    Pairs where casual returned 0 ${pairs.filter((p) => p.casualZero).length}`);
  log(`    Pairs sharing the top result  ${pairs.filter((p) => p.topOneSame).length}`);
}

function reportCategory(stats: CategoryStats[]): void {
  log("\n═══ F · Per-category comparison ═══");
  log("The report's concentration figures, tested against live behaviour.\n");
  log("    category             q   meanTech  meanCas   uniq  payees  topShare  medJacc  calls~rank");
  for (const s of stats) {
    log(
      `    ${s.category.padEnd(20)} ${String(s.queries).padStart(2)}   ` +
        `${fmt(s.meanTechnical, 1).padStart(7)}  ${fmt(s.meanCasual, 1).padStart(7)}   ` +
        `${String(s.uniqueResources).padStart(4)}  ${String(s.uniquePayees).padStart(6)}  ` +
        `${(s.topPayeeShare === null ? "—" : `${(s.topPayeeShare * 100).toFixed(1)}%`).padStart(8)}  ` +
        `${fmt(s.medianJaccard, 3).padStart(7)}  ${fmt(s.callsVsRank, 3).padStart(10)}`,
    );
  }
  log("\n    Most-surfaced payee per category:");
  for (const s of stats) {
    log(`    ${s.category.padEnd(20)} ${s.topPayee ?? "—"}`);
  }
}

function reportE3(e3: ReturnType<typeof experiment3>): void {
  log("\n═══ E3 · CDP vs AgentCash on identical queries ═══");
  log("Compared by host. Low overlap means discoverability is a property of the");
  log("index a buyer happens to use, not of the merchant.\n");
  log("    query                    cdp   ac   jaccard   shared   sameTop1   rankAgree");
  for (const r of e3) {
    log(
      `    ${r.queryId.padEnd(24)} ${String(r.cdpCount).padStart(3)}  ${String(r.acCount).padStart(3)}   ` +
        `${fmt(r.hostJaccard, 3).padStart(7)}   ${String(r.sharedHosts).padStart(6)}   ` +
        `${String(r.topOneSameHost).padStart(8)}   ${fmt(r.rankAgreement, 3).padStart(9)}`,
    );
  }
  const js = e3.map((r) => r.hostJaccard).filter((v): v is number => v !== null);
  if (js.length > 0) log(`\n    Median overlap across queries: ${fmt(median(js), 3)}`);
}

function reportE4(e4: ReturnType<typeof experiment4>): void {
  log("\n═══ E4 · Relevance vs usage (AgentCash) ═══");
  log("AgentCash publishes the pure-semantic rank and the final rank, so the");
  log("reranking is measured, not inferred. Each returned set is re-ranked by");
  log("vector similarity alone; displacement is the move against those peers.");
  log("Positive = usage promoted it above where relevance alone placed it.\n");
  log(`    Results compared               ${e4.rows.filter((r) => r.displacement !== null).length}`);
  log(`    Median |displacement|          ${fmt(e4.medianAbsDisplacement, 1)} places`);
  log(`    Promoted by usage              ${e4.promotedByUsage}`);
  log(`    Demoted by usage               ${e4.demotedByUsage}`);
  log(`    Unmoved                        ${e4.unmoved}`);
  log(`    Origin txs ~ displacement      ${fmt(e4.usageVsDisplacement)}`);
  log(`    Relevance rank ~ final rank    ${fmt(e4.vectorVsFinal)}`);
  if (e4.maxPromotion) {
    log(`\n    Largest single promotion: +${e4.maxPromotion.places} places`);
    log(`      ${e4.maxPromotion.resource}`);
    log(`      on query "${e4.maxPromotion.queryId}"`);
  }
  log("\n    A relevance~final correlation below 1.0 means semantic relevance");
  log("    is not what decides the order the agent sees.");
}

// ── main ───────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const input = process.argv[2];
  if (!input) {
    console.error("Usage: npm run rank:analyze -- data/rank-experiment-<date>.json");
    process.exit(1);
  }

  const cdp: CollectedFile = JSON.parse(await fs.readFile(input, "utf-8"));
  const collectedAt = new Date(cdp.collectedAt);

  log("═".repeat(72));
  log("  x402 DISCOVERY RANKING — EXPERIMENT RESULTS");
  log("═".repeat(72));
  log(`  Source     ${input}`);
  log(`  Collected  ${cdp.collectedAt}`);
  log(`  Index      ${cdp.index}`);
  log(`  Queries    ${cdp.runs.length}`);

  const failed = cdp.runs.filter((r) => r.error);
  const unstable = cdp.runs.filter((r) => !r.error && !r.stableAcrossRepeats);
  if (failed.length > 0) log(`  Failed     ${failed.length} (excluded)`);
  log(
    `  Stability  ${cdp.runs.length - failed.length - unstable.length}/${cdp.runs.length - failed.length} queries returned identical order on repeat`,
  );

  const e1 = experiment1(cdp.runs, collectedAt);
  const e2 = experiment2(cdp);
  const reg = experimentRegister(cdp.runs);
  const cats = experimentByCategory(cdp.runs, reg);

  reportE1(e1);
  reportE2(e2, cdp.searchLimit);
  reportRegister(reg);
  reportCategory(cats);

  // AgentCash sidecar is optional — E3 and E4 run only when it is present.
  const sidecar = path.join(
    path.dirname(input),
    path.basename(input).replace("rank-experiment-", "agentcash-"),
  );
  let ac: AgentCashFile | null = null;
  try {
    ac = JSON.parse(await fs.readFile(sidecar, "utf-8"));
  } catch {
    log(`\n═══ E3 / E4 skipped ═══`);
    log(`No AgentCash sidecar at ${sidecar}.`);
    log("See docs/RANKING-EXPERIMENT.md for how to produce it.");
  }

  if (ac) {
    log(`\n  AgentCash sidecar: ${sidecar} (${ac.runs.length} queries)`);
    reportE3(experiment3(cdp, ac));
    reportE4(experiment4(ac));
  }

  const outFile = input.replace("rank-experiment-", "rank-findings-");
  await fs.writeFile(
    outFile,
    JSON.stringify(
      {
        source: input,
        collectedAt: cdp.collectedAt,
        analyzedFrom: { index: cdp.index, queries: cdp.runs.length },
        e1_rankVsSignals: e1,
        e2_reachability: e2,
        c_registerSensitivity: reg,
        f_perCategory: cats,
        e3_crossIndex: ac ? experiment3(cdp, ac) : null,
        e4_relevanceVsUsage: ac ? experiment4(ac) : null,
      },
      null,
      2,
    ),
  );
  log(`\nWrote ${outFile}`);
}

main().catch((err) => {
  console.error("[rank-analyze] FAILED:", err);
  process.exit(1);
});
