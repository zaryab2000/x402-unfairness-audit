/**
 * Reference implementation of the merchant ranking score.
 *
 * This is the scoring path as it stood at the snapshot date (2026-09-09),
 * vendored from the transparent ranker at commit eca0195. It is dependency-free
 * on purpose: no database, no network, no framework. Everything the score needs
 * arrives as plain data read from `data/raw-data.json`.
 *
 * Only the scoring path is reproduced here. Report generation, comparators and
 * trend handling are out of scope for reproducing the published numbers.
 *
 * WHAT CHANGED SINCE THE JULY SNAPSHOT. The July copy (commit 5b327e0) scored
 * listing quality from surface facts: description length tiers, a flat bonus for
 * any service name, and a tag-count tier. This copy grades the same fields for
 * quality — keyword density and fluff in the description, name specificity, tag
 * relevance to the merchant's category — and adds an icon-presence bonus. The
 * normalisation constant moved from 3.6 to 3.75 to match. The four other
 * components are unchanged, as are the weights.
 *
 * WANT TO DISAGREE WITH THE FINDINGS? Change RANKER_WEIGHTS below and re-run
 * `npm run analyze`. The weights are the single place the formula encodes a
 * judgement call. See README, "How to disagree".
 */

import { computeDescriptionQualityScore } from "./description-quality.ts";
import { computeServiceNameQuality } from "./service-name-quality.ts";
import { computeTagQualityScore } from "./tag-quality.ts";
import type { ScorableCategory } from "./taxonomy.ts";

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
  /** Per-resource catalog update time. Serialized by the September collector. */
  lastUpdated?: string | null;
  /** Icon presence is a +0.15 term. Serialized by the September collector. */
  iconUrl?: string | null;
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
  /**
   * The merchant's category. Listing quality grades a description and its tags
   * against the category's own vocabulary, so the same text scores differently
   * in different categories. Null scores those two sub-signals at 0.
   */
  category: ScorableCategory | null;
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
  const { merchant, resources, category } = data;

  return {
    volumeSignal:
      0.5 * logNorm(merchant.txCount30d ?? 0) +
      0.5 * logNorm(Number(merchant.volume30d ?? 0)),
    buyerDiversity: computeBuyerDiversity(merchant.buyers30d ?? 0),
    reliability: computeReliability(),
    listingQuality: computeListingQualityFromResources(resources, category),
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
 * Production reads `reliabilityScore ?? apiSuccessRate` per resource and falls
 * back to 0.5 when neither is positive. Both columns are unpopulated for all
 * 42,201 resources in this snapshot, so every merchant takes the fallback.
 * Verified: all rows carry exactly 0.5. It is reproduced as a constant rather
 * than as a lookup over fields the snapshot does not contain.
 */
function computeReliability(): number {
  return 0.5;
}

// Listing-quality scoring separates always-available structural signals
// (schemas, description) from rare opt-in metadata (service name, tags, icon),
// so a merchant is rewarded for documentation effort rather than for verbosity
// or tag spam. Raw score is normalized by the theoretical max below.
//
//   Structural (max 2.8): input schema +1.0, output example +1.0,
//                         description +0.8 (gated by quality)
//   Opt-in    (max 0.95): service name +0.5 (gated by specificity),
//                         tags +0.3 (gated by quality), icon +0.15
const LISTING_QUALITY_MAX = 3.75;

function computeListingQualityForResource(
  r: ScorableResource,
  category: ScorableCategory | null,
): number {
  let score = 0;

  if (r.hasInputSchema) score += 1.0;
  if (r.hasOutputExample) score += 1.0;

  // Description contributes up to 0.8, gated by a composite quality score
  // (keyword density, category keyword presence, structural specificity, fluff)
  // rather than raw length — a fluff-filled 200-char blurb scores below a dense
  // 120-char API description.
  const descQuality = computeDescriptionQualityScore(r.description ?? "", category);
  score += 0.8 * descQuality.score;

  // Service name contributes up to 0.5, gated by name specificity — a generic
  // "API" scores far below "Weather Forecast API".
  score += 0.5 * computeServiceNameQuality(r.serviceName);

  // Tags contribute up to 0.3, gated by tag quality (taxonomy relevance,
  // specificity, count, anti-spam) rather than raw count — 3 category-matching
  // tags beat 5 generic ones. A resource with no tags contributes 0.
  const tags = r.tags ?? [];
  if (tags.length > 0) {
    const tagQuality = computeTagQualityScore(tags, category);
    score += 0.3 * tagQuality.score;
  }

  // Icon presence is a small metadata-completeness bonus.
  if (r.iconUrl) score += 0.15;

  return Math.min(score / LISTING_QUALITY_MAX, 1);
}

function computeListingQualityFromResources(
  resources: ScorableResource[],
  category: ScorableCategory | null,
): number {
  if (resources.length === 0) return 0;

  let totalScore = 0;
  for (const r of resources) {
    totalScore += computeListingQualityForResource(r, category);
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

  // Production maxes over per-resource `lastCalledAt` and `lastUpdated`. The
  // September collector serializes both, so the merchant-level timestamp is
  // only a fallback for resources missing their own — it is folded in INSIDE
  // the loop so a merchant with no resources scores 0, exactly as production
  // does, rather than inheriting the merchant timestamp and scoring 1.0.
  const merchantTs = merchantLastUpdated ? new Date(merchantLastUpdated).getTime() : 0;

  for (const r of resources) {
    const lastCalled = r.lastCalledAt ? new Date(r.lastCalledAt).getTime() : 0;
    const lastUpdated = r.lastUpdated ? new Date(r.lastUpdated).getTime() : merchantTs;
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
