/**
 * Reference implementation of the merchant ranking score.
 *
 * This is the scoring path as it stood at the snapshot date (2026-07-25),
 * vendored from the transparent ranker at commit 5b327e0. It is dependency-free
 * on purpose: no database, no network, no framework. Everything the score needs
 * arrives as plain data read from `data/raw-data.json`.
 *
 * Only the scoring path is reproduced here. Report generation, comparators and
 * trend handling are out of scope for reproducing the published numbers.
 *
 * WANT TO DISAGREE WITH THE FINDINGS? Change RANKER_WEIGHTS below and re-run
 * `npm run analyze`. The weights are the single place the formula encodes a
 * judgement call. See README, "How to disagree".
 */

/**
 * Component weights for the ranker score. Must sum to 1.0.
 *
 * Reliability is held at 0.05 as a placeholder: no external API exposes service
 * health, so the component is a constant 0.5 for every merchant in this
 * snapshot. The slot stays wired so a real reliability source later is a
 * one-line weight change.
 */
export const RANKER_WEIGHTS = {
  volume: 0.4,
  buyerDiversity: 0.25,
  reliability: 0.05,
  listingQuality: 0.15,
  recency: 0.15,
} as const;

/** The five components the score decomposes into. */
export interface ScoreBreakdown {
  volumeSignal: number;
  buyerDiversity: number;
  reliability: number;
  listingQuality: number;
  recency: number;
}

/**
 * The resource fields the score actually reads.
 *
 * Deliberately narrower than the catalog's resource record: these are the only
 * fields that reach the formula.
 */
export interface ScorableResource {
  description: string | null;
  serviceName: string | null;
  tags: string[] | null;
  hasInputSchema: boolean;
  hasOutputExample: boolean;
  lastCalledAt: string | null;
  /**
   * Per-resource catalog update time. Absent from the published snapshot — the
   * collector did not serialize it. See METHODOLOGY.md, "Known reproduction
   * gap"; five merchants' recency cannot be reproduced because of this.
   */
  lastUpdated?: string | null;
}

/** The merchant fields the score actually reads. */
export interface ScorableMerchant {
  txCount30d: number | null;
  buyers30d: number | null;
  volume30d: string | number | null;
  /** Merchant-level catalog update time. */
  lastUpdated?: string | null;
}

export interface MerchantData {
  merchant: ScorableMerchant;
  resources: ScorableResource[];
}

/**
 * Reference time for the recency component, as a millisecond epoch.
 *
 * The production code called `Date.now()`. That is correct in a live index and
 * wrong for reproduction: it makes the output depend on when you run the
 * script, so the same input yields different scores on different days. Callers
 * pass the snapshot's `collectedAt` instead — the only defensible zero point
 * for a frozen dataset.
 */
export type ReferenceTimeMs = number;

export function computeRankerScore(data: MerchantData, now: ReferenceTimeMs): number {
  const b = computeScoreBreakdown(data, now);

  const score =
    RANKER_WEIGHTS.volume * b.volumeSignal +
    RANKER_WEIGHTS.buyerDiversity * b.buyerDiversity +
    RANKER_WEIGHTS.reliability * b.reliability +
    RANKER_WEIGHTS.listingQuality * b.listingQuality +
    RANKER_WEIGHTS.recency * b.recency;

  return Math.round(score * 10000) / 10000;
}

export function computeScoreBreakdown(
  data: MerchantData,
  now: ReferenceTimeMs,
): ScoreBreakdown {
  const { merchant, resources } = data;

  return {
    volumeSignal:
      0.5 * logNorm(merchant.txCount30d ?? 0) +
      0.5 * logNorm(Number(merchant.volume30d ?? 0)),
    buyerDiversity: computeBuyerDiversity(merchant.buyers30d ?? 0),
    reliability: computeReliability(),
    listingQuality: computeListingQualityFromResources(resources),
    recency: computeRecency(resources, merchant.lastUpdated ?? null, now),
  };
}

/**
 * Log-scale normalisation to [0, 1]. Compresses heavy-tailed count data so a
 * merchant with 10,000 transactions does not swamp one with 1,000 linearly.
 */
function logNorm(value: number, cap: number = 1_000_000): number {
  if (value <= 0) return 0;
  return Math.min(Math.log10(value + 1) / Math.log10(cap), 1);
}

function computeBuyerDiversity(uniqueBuyers: number): number {
  return logNorm(uniqueBuyers, 10_000);
}

/**
 * Reliability is a constant 0.5 for every merchant.
 *
 * No external source exposes per-service health, so the production code fell
 * back to 0.5 for every merchant in this snapshot (verified: all 1,132 rows
 * carry exactly 0.5). It is reproduced as a constant rather than as a lookup
 * over fields the snapshot does not contain.
 */
function computeReliability(): number {
  return 0.5;
}

// Listing-quality scoring separates always-available structural signals
// (schemas, description) from rare opt-in metadata (service name, tags). Raw
// score is normalized by the theoretical max below.
//
//   Structural (max 2.8): input schema +1.0, output example +1.0,
//                         description tier (exclusive) >150 +0.8 / >50 +0.4
//   Opt-in    (max 0.8):  service name +0.5, tags 3-5 +0.3 / otherwise >=1 +0.1
const LISTING_QUALITY_MAX = 3.6;

function computeListingQualityForResource(r: ScorableResource): number {
  let score = 0;

  if (r.hasInputSchema) score += 1.0;
  if (r.hasOutputExample) score += 1.0;

  const descLen = r.description?.length ?? 0;
  if (descLen > 150) score += 0.8;
  else if (descLen > 50) score += 0.4;

  if (r.serviceName && r.serviceName.length > 0) score += 0.5;

  const tagCount = r.tags?.length ?? 0;
  if (tagCount >= 3 && tagCount <= 5) score += 0.3;
  else if (tagCount >= 1) score += 0.1;

  return Math.min(score / LISTING_QUALITY_MAX, 1);
}

function computeListingQualityFromResources(resources: ScorableResource[]): number {
  if (resources.length === 0) return 0;

  let totalScore = 0;
  for (const r of resources) {
    totalScore += computeListingQualityForResource(r);
  }

  return totalScore / resources.length;
}

/**
 * Recency decay ladder over the most recent activity timestamp seen across a
 * merchant's resources.
 */
function computeRecency(
  resources: ScorableResource[],
  merchantLastUpdated: string | null,
  now: ReferenceTimeMs,
): number {
  let mostRecent = 0;

  // The production code read a per-resource `lastUpdated` alongside
  // `lastCalledAt`. The snapshot preserves only the merchant-level value, so it
  // stands in per resource. Folding it in INSIDE the loop matters: a merchant
  // with no resources scores 0, exactly as production did, rather than
  // inheriting the merchant timestamp and scoring 1.0. Twenty-one merchants in
  // this snapshot have no resources.
  //
  // This reproduces 1,127 of 1,132 merchants exactly; see METHODOLOGY.md for
  // the five that cannot be reproduced from published artifacts.
  const merchantTs = merchantLastUpdated ? new Date(merchantLastUpdated).getTime() : 0;

  for (const r of resources) {
    const lastCalled = r.lastCalledAt ? new Date(r.lastCalledAt).getTime() : 0;
    const lastUpdated = r.lastUpdated
      ? new Date(r.lastUpdated).getTime()
      : merchantTs;
    mostRecent = Math.max(mostRecent, lastCalled, lastUpdated);
  }

  if (mostRecent === 0) return 0;

  const daysSince = (now - mostRecent) / (1000 * 60 * 60 * 24);
  if (daysSince < 1) return 1.0;
  if (daysSince < 7) return 0.8;
  if (daysSince < 30) return 0.5;
  if (daysSince < 90) return 0.2;
  return 0;
}
