/**
 * LIVE EXPERIMENT: what does x402 discovery ranking actually reward?
 *
 * This is a collector, not an analysis. It issues a fixed query set against the
 * CDP Bazaar discovery index, records every ranked result verbatim, and writes a
 * dated raw record. `scripts/rank-analyze.ts` turns that record into findings.
 *
 * The split matters: collection touches the live network and is not
 * reproducible, analysis is a pure function over a committed file and is. Same
 * discipline as `probe` vs `verify`.
 *
 * NETWORK, NOT VERIFICATION. Not part of `npm run all`.
 *
 * The CDP endpoint is free, unauthenticated and read-only. No credentials, no
 * payments, no API keys.
 *
 * AgentCash results are NOT collected here — that index is reachable only
 * through an MCP tool, not plain HTTP. Write those to the sidecar described in
 * docs/RANKING-EXPERIMENT.md; the analyzer merges them when present.
 *
 * Usage:  npm run rank:collect
 */

import * as fs from "node:fs/promises";

import { QUERIES, type Query } from "./queries.js";

const CDP_SEARCH_URL =
  "https://api.cdp.coinbase.com/platform/v2/x402/discovery/search";
const CDP_CATALOG_URL =
  "https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources";

/** The index caps search results at 20 and exposes no offset. There is no page 2. */
const SEARCH_LIMIT = 20;

const REQUEST_DELAY_MS = 250;
const REQUEST_TIMEOUT_MS = 20_000;

/** Repeat each query this many times to record whether ranking is stable. */
const DETERMINISM_REPEATS = 2;

function log(msg: string): void {
  console.log(`[rank-experiment] ${msg}`);
}

// ── the shape CDP returns ──────────────────────────────────────────

interface CdpAccept {
  scheme?: string;
  network?: string;
  amount?: string;
  payTo?: string;
  asset?: string;
  maxTimeoutSeconds?: number;
}

interface CdpQuality {
  l30DaysTotalCalls?: number;
  l30DaysUniquePayers?: number;
  lastCalledAt?: string | null;
}

interface CdpResource {
  resource?: string;
  description?: string | null;
  type?: string;
  lastUpdated?: string | null;
  accepts?: CdpAccept[];
  extensions?: Record<string, unknown>;
  quality?: CdpQuality | null;
  serviceName?: string | null;
  tags?: string[] | null;
  bundleSlugs?: string[] | null;
  iconUrl?: string | null;
  curated?: boolean | null;
  skillUrl?: string | null;
}

interface CdpSearchResponse {
  resources?: CdpResource[];
  searchMethod?: string;
  partialResults?: boolean;
  x402Version?: number;
  meta?: { searchToken?: string };
}

// ── what we record ─────────────────────────────────────────────────

/**
 * One ranked result, flattened to the features a ranking could plausibly use.
 * Kept verbatim alongside `raw` so a re-analysis can reach fields this
 * flattening did not anticipate.
 */
interface RankedResult {
  position: number;
  resource: string;
  serviceName: string | null;
  payTo: string | null;
  network: string | null;

  /** Usage signals, as the index itself reports them. */
  calls30d: number | null;
  payers30d: number | null;
  lastCalledAt: string | null;

  /** Listing-quality signals, observable from the record alone. */
  priceUsd: number | null;
  descriptionLength: number;
  tagCount: number;
  hasServiceName: boolean;
  hasIcon: boolean;
  hasInputSchema: boolean;
  hasOutputExample: boolean;
  curated: boolean;

  raw: CdpResource;
}

interface QueryRun {
  queryId: string;
  queryText: string;
  pairId: string;
  category: Query["category"];
  register: Query["register"];
  searchMethod: string | null;
  partialResults: boolean;
  resultCount: number;
  results: RankedResult[];
  /** Result URLs in order, once per repeat, to test rank stability. */
  repeatOrderings: string[][];
  stableAcrossRepeats: boolean;
  error?: string;
}

// ── helpers ────────────────────────────────────────────────────────

async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

async function getJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

function searchUrl(query: string): string {
  const params = new URLSearchParams({
    query,
    limit: String(SEARCH_LIMIT),
  });
  return `${CDP_SEARCH_URL}?${params.toString()}`;
}

/**
 * USDC amounts arrive as integer strings in the asset's base units (6 decimals).
 * Returns null rather than 0 when absent, so "free" and "unpriced" stay distinct.
 */
function priceToUsd(accept: CdpAccept | undefined): number | null {
  if (!accept?.amount) return null;
  const n = Number(accept.amount);
  if (!Number.isFinite(n)) return null;
  return n / 1_000_000;
}

/** Bazaar metadata is nested and every level is optional; probe it defensively. */
function bazaarInfo(r: CdpResource): Record<string, unknown> | null {
  const bazaar = r.extensions?.["bazaar"];
  if (!bazaar || typeof bazaar !== "object") return null;
  const info = (bazaar as Record<string, unknown>)["info"];
  if (!info || typeof info !== "object") return null;
  return info as Record<string, unknown>;
}

function hasInputSchema(r: CdpResource): boolean {
  const info = bazaarInfo(r);
  if (!info) return false;
  const input = info["input"];
  return typeof input === "object" && input !== null;
}

function hasOutputExample(r: CdpResource): boolean {
  const info = bazaarInfo(r);
  if (!info) return false;
  const output = info["output"];
  if (typeof output !== "object" || output === null) return false;
  return "example" in (output as Record<string, unknown>);
}

function flatten(r: CdpResource, position: number): RankedResult {
  const accept = r.accepts?.[0];
  const q = r.quality ?? {};
  return {
    position,
    resource: r.resource ?? "",
    serviceName: r.serviceName ?? null,
    payTo: accept?.payTo ?? null,
    network: accept?.network ?? null,

    calls30d: q.l30DaysTotalCalls ?? null,
    payers30d: q.l30DaysUniquePayers ?? null,
    lastCalledAt: q.lastCalledAt ?? null,

    priceUsd: priceToUsd(accept),
    descriptionLength: (r.description ?? "").length,
    tagCount: r.tags?.length ?? 0,
    hasServiceName: Boolean(r.serviceName && r.serviceName.trim().length > 0),
    hasIcon: Boolean(r.iconUrl),
    hasInputSchema: hasInputSchema(r),
    hasOutputExample: hasOutputExample(r),
    curated: r.curated === true,

    raw: r,
  };
}

function orderingOf(items: CdpResource[]): string[] {
  return items.map((r) => r.resource ?? "");
}

// ── collection ─────────────────────────────────────────────────────

async function runQuery(q: Query): Promise<QueryRun> {
  log(`  [${q.register.padEnd(9)}] ${q.id}  "${q.text}"`);

  const base: QueryRun = {
    queryId: q.id,
    queryText: q.text,
    pairId: q.pairId,
    category: q.category,
    register: q.register,
    searchMethod: null,
    partialResults: false,
    resultCount: 0,
    results: [],
    repeatOrderings: [],
    stableAcrossRepeats: true,
  };

  try {
    const first = await getJson<CdpSearchResponse>(searchUrl(q.text));
    const items = first.resources ?? [];

    base.searchMethod = first.searchMethod ?? null;
    base.partialResults = first.partialResults === true;
    base.resultCount = items.length;
    // 1-indexed: position 1 is the top result the agent sees.
    base.results = items.map((r, i) => flatten(r, i + 1));
    base.repeatOrderings = [orderingOf(items)];

    for (let i = 1; i < DETERMINISM_REPEATS; i++) {
      await sleep(REQUEST_DELAY_MS);
      const again = await getJson<CdpSearchResponse>(searchUrl(q.text));
      base.repeatOrderings.push(orderingOf(again.resources ?? []));
    }

    const firstOrdering = JSON.stringify(base.repeatOrderings[0]);
    base.stableAcrossRepeats = base.repeatOrderings.every(
      (o) => JSON.stringify(o) === firstOrdering,
    );

    log(
      `    ${base.resultCount} results · method=${base.searchMethod} · stable=${base.stableAcrossRepeats}`,
    );
  } catch (err) {
    base.error = err instanceof Error ? err.message : String(err);
    log(`    FAILED: ${base.error}`);
  }

  return base;
}

/** Catalog size is the denominator for the coverage experiment (E2). */
async function catalogSize(): Promise<number | null> {
  try {
    const d = await getJson<{ pagination?: { total?: number } }>(
      `${CDP_CATALOG_URL}?limit=1`,
    );
    return d.pagination?.total ?? null;
  } catch (err) {
    log(`Catalog size lookup failed: ${err instanceof Error ? err.message : err}`);
    return null;
  }
}

function outputFile(collectedAt: string): string {
  return `data/rank-experiment-${collectedAt.slice(0, 10)}.json`;
}

async function main(): Promise<void> {
  log(`Querying CDP discovery with ${QUERIES.length} queries…`);
  log(`Search limit is ${SEARCH_LIMIT} and the endpoint exposes no offset.`);

  const total = await catalogSize();
  log(`Catalog reports ${total ?? "unknown"} resources.`);

  const runs: QueryRun[] = [];
  for (const q of QUERIES) {
    runs.push(await runQuery(q));
    await sleep(REQUEST_DELAY_MS);
  }

  const collectedAt = new Date().toISOString();
  const file = outputFile(collectedAt);

  const output = {
    collectedAt,
    index: "cdp-bazaar",
    endpoint: CDP_SEARCH_URL,
    catalogEndpoint: CDP_CATALOG_URL,
    searchLimit: SEARCH_LIMIT,
    catalogTotal: total,
    queryCount: QUERIES.length,
    runs,
  };

  await fs.writeFile(file, JSON.stringify(output, null, 2));
  const kb = (await fs.stat(file)).size / 1024;
  log(`\nWrote ${file} (${kb.toFixed(1)} KB)`);

  const failed = runs.filter((r) => r.error).length;
  const unstable = runs.filter((r) => !r.error && !r.stableAcrossRepeats).length;
  log(`${runs.length - failed} queries succeeded, ${failed} failed, ${unstable} unstable.`);
  log(`Next: npm run rank:analyze -- ${file}`);
}

main().catch((err) => {
  console.error("[rank-experiment] FAILED:", err);
  process.exit(1);
});
