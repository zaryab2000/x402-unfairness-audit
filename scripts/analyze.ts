/**
 * Concentration, quartile-decomposition and cold-start-ceiling analysis.
 *
 * Reads the frozen snapshot and writes `data/analysis-results.json`. Pure local
 * computation: no database, no network.
 *
 * Usage:  npm run analyze
 */

import * as fs from "node:fs/promises";
import {
  ANALYZED_CATEGORIES,
  loadSnapshot,
  type RawMerchant,
  type RawSnapshot,
} from "./snapshot.ts";

const RESULTS_FILE = "data/analysis-results.json";

function log(msg: string): void {
  console.log(`[analyze] ${msg}`);
}

// ── math helpers ──────────────────────────────────────────────────

/** Gini coefficient over a numeric array ( zeros included ). Returns 0 if all zero. */
function gini(values: number[]): number {
  const n = values.length;
  if (n === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  if (sum === 0) return 0;
  let weightedSum = 0;
  for (let i = 0; i < n; i++) {
    weightedSum += (i + 1) * (sorted[i] ?? 0);
  }
  return (2 * weightedSum) / (n * sum) - (n + 1) / n;
}

/** Herfindahl-Hirschman Index ( 0-10000 scale ). Returns 0 if total is zero. */
function hhi(values: number[]): number {
  const total = values.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  const shares = values.map((v) => v / total);
  return Math.round(shares.reduce((acc, s) => acc + s * s, 0) * 10000);
}

function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function round(x: number, decimals = 4): number {
  const f = Math.pow(10, decimals);
  return Math.round(x * f) / f;
}

function pct(x: number): string {
  return `${Math.round(x * 1000) / 10}%`;
}

// ── analysis types ─────────────────────────────────────────────────

interface QuartileStats {
  label: string;
  rankRange: string;
  count: number;
  meanScore: number;
  volumeSignal: number;
  buyerDiversity: number;
  reliability: number;
  listingQuality: number;
  recency: number;
  meanTxCount30d: number;
  meanBuyers30d: number;
}

interface CategoryAnalysis {
  categoryName: string;
  merchantCount: number;
  totalVolume30d: number;
  totalTxCount30d: number;
  gini: number;
  hhi: number;
  top3Share: number;
  top3Count: number;
  quartiles: {
    q1: QuartileStats;
    q2: QuartileStats;
    q3: QuartileStats;
    q4: QuartileStats;
  };
  gapAnalysis: {
    scoreGap: number;
    componentShares: Record<string, number>;
    listingQualityGap: number;
  };
  coldStartCeiling: {
    ceiling: number;
    top3MeanScore: number;
    gap: number;
    verdict: string;
  };
  buriedCandidates: RawMerchant[];
}

// ── core analysis ──────────────────────────────────────────────────

function analyzeCategory(
  categoryName: string,
  merchants: RawMerchant[],
  weights: RawSnapshot["rankerWeights"],
): CategoryAnalysis {
  const catMerchants = merchants.filter((m) => m.categoryName === categoryName);

  // ── concentration ──
  const txCounts = catMerchants.map((m) => m.txCount30d);
  const totalTx = txCounts.reduce((a, b) => a + b, 0);
  const totalVol = catMerchants.reduce((a, m) => a + Number(m.volume30d), 0);
  const g = gini(txCounts);
  const h = hhi(txCounts);

  // top-3 share
  const sortedByTx = [...catMerchants].sort((a, b) => b.txCount30d - a.txCount30d);
  const top3 = sortedByTx.slice(0, 3);
  const top3Tx = top3.reduce((a, m) => a + m.txCount30d, 0);
  const top3Share = totalTx > 0 ? top3Tx / totalTx : 0;

  // ── quartile decomposition ──
  const sortedByRank = [...catMerchants].sort(
    (a, b) => (a.rankPosition ?? 999999) - (b.rankPosition ?? 999999),
  );
  const n = sortedByRank.length;
  const qSize = Math.ceil(n / 4);

  function quartileStats(
    label: string,
    quartileMerchants: RawMerchant[],
    rankStart: number,
  ): QuartileStats {
    if (quartileMerchants.length === 0) {
      return {
        label,
        rankRange: "—",
        count: 0,
        meanScore: 0,
        volumeSignal: 0,
        buyerDiversity: 0,
        reliability: 0,
        listingQuality: 0,
        recency: 0,
        meanTxCount30d: 0,
        meanBuyers30d: 0,
      };
    }
    return {
      label,
      rankRange: `${rankStart}–${rankStart + quartileMerchants.length - 1}`,
      count: quartileMerchants.length,
      meanScore: round(mean(quartileMerchants.map((m) => Number(m.rankerScore))), 4),
      volumeSignal: round(mean(quartileMerchants.map((m) => m.scoreBreakdown.volumeSignal)), 4),
      buyerDiversity: round(mean(quartileMerchants.map((m) => m.scoreBreakdown.buyerDiversity)), 4),
      reliability: round(mean(quartileMerchants.map((m) => m.scoreBreakdown.reliability)), 4),
      listingQuality: round(mean(quartileMerchants.map((m) => m.scoreBreakdown.listingQuality)), 4),
      recency: round(mean(quartileMerchants.map((m) => m.scoreBreakdown.recency)), 4),
      meanTxCount30d: round(mean(quartileMerchants.map((m) => m.txCount30d)), 1),
      meanBuyers30d: round(mean(quartileMerchants.map((m) => m.buyers30d)), 1),
    };
  }

  const q1 = quartileStats("Q1", sortedByRank.slice(0, qSize), 1);
  const q2 = quartileStats("Q2", sortedByRank.slice(qSize, qSize * 2), qSize + 1);
  const q3 = quartileStats("Q3", sortedByRank.slice(qSize * 2, qSize * 3), qSize * 2 + 1);
  const q4 = quartileStats("Q4", sortedByRank.slice(qSize * 3), qSize * 3 + 1);

  // gap analysis
  const scoreGap = q1.meanScore - q4.meanScore;
  const listingQualityGap = q1.listingQuality - q4.listingQuality;

  const componentShares: Record<string, number> = {};
  const w = weights;
  if (scoreGap > 0) {
    componentShares["volume"] = ((q1.volumeSignal - q4.volumeSignal) * w.volume) / scoreGap;
    componentShares["buyerDiversity"] =
      ((q1.buyerDiversity - q4.buyerDiversity) * w.buyerDiversity) / scoreGap;
    componentShares["reliability"] =
      ((q1.reliability - q4.reliability) * w.reliability) / scoreGap;
    componentShares["listingQuality"] =
      ((q1.listingQuality - q4.listingQuality) * w.listingQuality) / scoreGap;
    componentShares["recency"] = ((q1.recency - q4.recency) * w.recency) / scoreGap;
  }

  // ── cold-start ceiling ──
  const ceiling = w.reliability * 0.5 + w.listingQuality * 1.0 + w.recency * 1.0;
  const top3MeanScore = mean(top3.map((m) => Number(m.rankerScore)));
  const gap = round(top3MeanScore - ceiling, 4);
  const verdict = gap > 0.1 ? "Unreachable" : gap > 0 ? "Borderline" : "Reachable";

  // ── buried candidates ──
  const buried = catMerchants.filter((m) => {
    if (m.txCount30d > 1) return false;
    const hasRealResource = m.resources.some(
      (r) => r.hasInputSchema && r.hasOutputExample && r.descriptionLength > 50,
    );
    return hasRealResource && m.scoreBreakdown.listingQuality > 0.5;
  });

  return {
    categoryName,
    merchantCount: catMerchants.length,
    totalVolume30d: round(totalVol, 2),
    totalTxCount30d: totalTx,
    gini: round(g, 4),
    hhi: h,
    top3Share: round(top3Share, 4),
    top3Count: top3.length,
    quartiles: { q1, q2, q3, q4 },
    gapAnalysis: {
      scoreGap: round(scoreGap, 4),
      componentShares: Object.fromEntries(
        Object.entries(componentShares).map(([k, v]) => [k, round(v, 4)]),
      ),
      listingQualityGap: round(listingQualityGap, 4),
    },
    coldStartCeiling: {
      ceiling: round(ceiling, 4),
      top3MeanScore: round(top3MeanScore, 4),
      gap,
      verdict,
    },
    buriedCandidates: buried.sort(
      (a, b) => b.scoreBreakdown.listingQuality - a.scoreBreakdown.listingQuality,
    ),
  };
}

// ── main ───────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const snapshot = await loadSnapshot();
  log(`Loaded snapshot from ${snapshot.collectedAt}`);
  log(`Merchants in snapshot: ${snapshot.merchants.length}`);
  log(`Analyzing: ${ANALYZED_CATEGORIES.join(", ")}`);

  const analyzedMerchants = snapshot.merchants.filter((m) =>
    (ANALYZED_CATEGORIES as readonly string[]).includes(m.categoryName),
  );
  log(`Merchants in 4 analyzed categories: ${analyzedMerchants.length}`);

  const analyses: CategoryAnalysis[] = [];
  for (const cat of ANALYZED_CATEGORIES) {
    const a = analyzeCategory(cat, analyzedMerchants, snapshot.rankerWeights);
    log(
      `  ${a.categoryName}: ${a.merchantCount} merchants, Gini=${a.gini}, HHI=${a.hhi}, ` +
        `gap=${a.gapAnalysis.scoreGap}, ceiling=${a.coldStartCeiling.verdict}`,
    );
    analyses.push(a);
  }

  const results = {
    // Pinned to the snapshot, not the wall clock: re-running must produce a
    // byte-identical file.
    analyzedAt: "2026-07-25T11:48:24.528Z",
    snapshotCollectedAt: snapshot.collectedAt,
    rankerWeights: snapshot.rankerWeights,
    analyzedCategories: ANALYZED_CATEGORIES,
    summary: {
      totalMerchantsAnalyzed: analyzedMerchants.length,
      giniThreshold: 0.7,
      hhiHighThreshold: 2500,
      hhiModerateThreshold: 1500,
      allCategoriesExtremeGini: analyses.every((a) => a.gini > 0.7),
      allCategoriesUnreachableCeiling: analyses.every(
        (a) => a.coldStartCeiling.verdict === "Unreachable",
      ),
      totalBuriedCandidates: analyses.reduce(
        (sum, a) => sum + a.buriedCandidates.length,
        0,
      ),
    },
    categories: analyses.map((a) => ({
      ...a,
      buriedCandidates: a.buriedCandidates.map((m) => {
        const primary =
          m.resources.find((r) => r.hasInputSchema && r.hasOutputExample) ??
          m.resources[0];
        const documented = m.resources.find(
          (r) => r.hasInputSchema && r.hasOutputExample,
        );
        return {
          id: m.id,
          payeeAddress: m.payeeAddress,
          category: m.categoryName,
          rankPosition: m.rankPosition,
          rankerScore: m.rankerScore,
          txCount30d: m.txCount30d,
          buyers30d: m.buyers30d,
          listingQuality: m.scoreBreakdown.listingQuality,
          volumeSignal: m.scoreBreakdown.volumeSignal,
          primaryResource: primary?.resourceUrl ?? null,
          serviceName: primary?.serviceName ?? null,
          description: documented?.description ?? null,
          tags: documented?.tags ?? [],
          priceUsd: documented?.priceUsd ?? null,
        };
      }),
    })),
  };

  await fs.writeFile(RESULTS_FILE, JSON.stringify(results, null, 2));
  log(`Wrote ${RESULTS_FILE}`);

  log("");
  log("══════════════════════════════════════════════════════════");
  log("                    SUMMARY");
  log("══════════════════════════════════════════════════════════");
  for (const a of analyses) {
    log(`${a.categoryName}:`);
    log(`  Gini=${a.gini}  HHI=${a.hhi}  Top3 share=${pct(a.top3Share)}`);
    log(
      `  Q1 score=${a.quartiles.q1.meanScore}  Q4 score=${a.quartiles.q4.meanScore}  gap=${a.gapAnalysis.scoreGap}`,
    );
    log(`  ListingQ gap Q1-Q4: ${a.gapAnalysis.listingQualityGap}`);
    log(
      `  Ceiling=${a.coldStartCeiling.ceiling}  Top3 mean=${a.coldStartCeiling.top3MeanScore}  gap=${a.coldStartCeiling.gap}  → ${a.coldStartCeiling.verdict}`,
    );
  }
  log("Done.");
}

main().catch((err) => {
  console.error("[analyze] FAILED:", err);
  process.exit(1);
});
