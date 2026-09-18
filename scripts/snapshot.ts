/**
 * Shared types and loader for the frozen snapshot.
 *
 * `data/raw-data.json` is evidence, not a working file. Nothing in this repo
 * writes to it.
 */

import * as fs from "node:fs/promises";

export interface RawResource {
  resourceUrl: string;
  serviceName: string | null;
  description: string | null;
  tags: string[] | null;
  hasInputSchema: boolean;
  hasOutputExample: boolean;
  priceUsd: string | null;
  l30dCalls: number;
  l30dUniquePayers: number;
  lastCalledAt: string | null;
  /** Per-resource catalog update time. Recency maxes over this and lastCalledAt. */
  lastUpdated: string | null;
  /** Icon presence is a +0.15 term in the listing-quality component. */
  iconUrl: string | null;
  descriptionLength: number;
  tagCount: number;
}

export interface RawMerchant {
  id: string;
  payeeAddress: string;
  chain: string;
  categoryId: string;
  categoryName: string;
  rankerScore: string;
  rankPosition: number | null;
  txCount30d: number;
  buyers30d: number;
  volume30d: string;
  firstSeenAt: string;
  lastUpdated: string;
  scoreBreakdown: {
    volumeSignal: number;
    buyerDiversity: number;
    reliability: number;
    listingQuality: number;
    recency: number;
  };
  resources: RawResource[];
}

export interface RawCategory {
  id: string;
  name: string;
  slug: string;
  merchantCount: number;
  medianPrice: string | null;
  totalVolume30d: string;
}

export interface RawSnapshot {
  collectedAt: string;
  rankerWeights: {
    volume: number;
    buyerDiversity: number;
    reliability: number;
    listingQuality: number;
    recency: number;
  };
  dbStats: Record<string, number>;
  categories: RawCategory[];
  top5CategoryIds: string[];
  top5CategoryNames: string[];
  merchants: RawMerchant[];
}

export const SNAPSHOT_FILE = "data/raw-data.json";

/**
 * The four categories analysed in the report.
 *
 * "Other" (636 merchants) is excluded: it is the uncategorised fallback, so a
 * concentration measure over it describes the bucket, not a market.
 */
export const ANALYZED_CATEGORIES = [
  "Crypto & DeFi",
  "AI & Agents",
  "Data & Enrichment",
  "Finance & Markets",
] as const;

export async function loadSnapshot(file: string = SNAPSHOT_FILE): Promise<RawSnapshot> {
  const raw = await fs.readFile(file, "utf-8");
  return JSON.parse(raw) as RawSnapshot;
}

/** Reference time for recency: the snapshot's own collection timestamp. */
export function referenceTime(snapshot: RawSnapshot): number {
  return new Date(snapshot.collectedAt).getTime();
}
