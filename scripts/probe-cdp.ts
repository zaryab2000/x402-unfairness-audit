/**
 * OPTIONAL: live probe of the CDP Bazaar discovery/search endpoint.
 *
 * This is the only script in the repo that touches the network, and it is NOT
 * part of the verification path. `npm run all` does not call it.
 *
 * NON-DETERMINISTIC BY NATURE. It queries the live x402 catalog, which changes
 * continuously, so a fresh run will NOT reproduce the committed
 * `data/cdp-probes.json` — the frozen record of the 2026-07-25 run that the
 * report cites.
 *
 * This script NEVER writes to that file. Output goes to
 * `data/probes-<UTC date>.json`, dated by the run's own timestamp. Frozen
 * evidence is read-only: an optional command must not be able to destroy the
 * artifact a reader cloned the repo to check.
 *
 * The endpoint is free, unauthenticated and read-only. No credentials, no
 * payments, no API keys are involved.
 *
 * Usage:  npm run probe
 */

import * as fs from "node:fs/promises";

const ANALYSIS_FILE = "data/analysis-results.json";
const RAW_FILE = "data/raw-data.json";

/** The frozen artifact. Read-only — never a write target. */
const FROZEN_PROBES_FILE = "data/cdp-probes.json";

/** Fresh runs are written here, dated by the run's own UTC timestamp. */
function probesOutputFile(probedAt: string): string {
  const day = probedAt.slice(0, 10);
  const file = `data/probes-${day}.json`;
  if (file === FROZEN_PROBES_FILE) {
    throw new Error(
      `Refusing to overwrite frozen evidence at ${FROZEN_PROBES_FILE}`,
    );
  }
  return file;
}

const CDP_SEARCH_URL =
  "https://api.cdp.coinbase.com/platform/v2/x402/discovery/search";

const REQUEST_DELAY_MS = 200;
const REQUEST_TIMEOUT_MS = 15_000;

// One representative 2-4 word query per analyzed category. Chosen to target
// the *service domain* of each category — broad enough to surface many
// merchants but specific enough to be a realistic agent query.
const CATEGORY_QUERIES: Record<string, string[]> = {
  "Crypto & DeFi": ["crypto onchain defi token data wallet"],
  "AI & Agents": ["AI agent inference LLM embeddings"],
  "Data & Enrichment": ["data enrichment company people search"],
  "Finance & Markets": ["finance markets stock price news"],
};

const MAX_BURIED_PER_CATEGORY = 7;

function log(msg: string): void {
  console.log(`[probe-cdp] ${msg}`);
}

// ── types ──────────────────────────────────────────────────────────

interface BuriedMerchant {
  id: string;
  payeeAddress: string;
  category: string;
  rankPosition: number;
  rankerScore: string;
  txCount30d: number;
  buyers30d: number;
  listingQuality: number;
  volumeSignal: number;
  primaryResource: string;
  serviceName: string | null;
  description: string | null;
  tags: string[];
  priceUsd: string | null;
}

interface RawMerchant {
  id: string;
  payeeAddress: string;
  rankPosition: number | null;
  rankerScore: string;
  resources: { resourceUrl: string; serviceName: string | null }[];
}

interface RawSnapshot {
  merchants: RawMerchant[];
}

interface AnalysisFile {
  categories: Array<{
    categoryName: string;
    buriedCandidates: BuriedMerchant[];
  }>;
}

interface CdpResultItem {
  resource?: string;
  url?: string;
  serviceName?: string | null;
  description?: string | null;
  quality?: {
    l30DaysTotalCalls?: number;
    l30DaysUniquePayers?: number;
    lastCalledAt?: string | null;
  } | null;
  accepts?: Array<{ payTo?: string }>;
}

interface ProbeMatch {
  resourceUrl: string | null;
  position: number | null;
  cdpCalls30d: number | null;
  cdpPayers30d: number | null;
  cdpLastCalledAt: string | null;
}

interface ProbePair {
  query: string;
  merchant: {
    id: string;
    payeeAddress: string;
    referenceRank: number | null;
    referenceScore: number;
    referenceListingQ: number;
    referenceTxCount30d: number;
    primaryResource: string;
   serviceName: string | null;
  };
  incumbent: {
    id: string;
    payeeAddress: string;
    referenceRank: number;
    referenceScore: number;
    primaryResource: string;
    serviceName: string | null;
  };
  verdict?: string;
  cdpMatch?: ProbeMatch;
}

interface ProbeResult {
  category: string;
  query: string;
  cdpResultCount: number;
  cdpSearchMethod: string | null;
  incumbent: ProbePair;
  buriedMerchants: ProbePair[];
}

// ── CDP probe logic ─────────────────────────────────────────────────

async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

async function probeCdp(query: string): Promise<{
  items: CdpResultItem[];
  searchMethod: string | null;
  total: number;
}> {
  const url = `${CDP_SEARCH_URL}?query=${encodeURIComponent(query)}&limit=20`;
  log(`  GET ${url}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { accept: "application/json" },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    const data = await res.json() as {
      resources?: CdpResultItem[];
      searchMethod?: string;
      pagination?: { total?: number };
    };
    return {
      items: data.resources ?? [],
      searchMethod: data.searchMethod ?? null,
      total: data.pagination?.total ?? (data.resources?.length ?? 0),
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Find the first item in `cdpItems` whose resource/url matches any of the
 * given candidate URLs. Returns the matched item and its 1-indexed position.
 */
function findInCdp(
  cdpItems: CdpResultItem[],
  candidateUrls: string[],
): { item: CdpResultItem; position: number; matchedUrl: string } | null {
  const normalized = new Set(
    candidateUrls
      .map((u) => u.trim().replace(/\/$/, "").toLowerCase())
      .filter((u) => u.length > 0),
  );

  for (let i = 0; i < cdpItems.length; i++) {
    const item = cdpItems[i];
    if (!item) continue;
    const itemUrl = (item.resource ?? item.url ?? "").trim().replace(/\/$/, "").toLowerCase();
    if (itemUrl && normalized.has(itemUrl)) {
      return { item, position: i + 1, matchedUrl: itemUrl };
    }
  }
  return null;
}

function extractItemQuality(item: CdpResultItem): {
  calls: number | null;
  payers: number | null;
  lastCalledAt: string | null;
} {
  const q = item.quality ?? {};
  return {
    calls: q.l30DaysTotalCalls ?? null,
    payers: q.l30DaysUniquePayers ?? null,
    lastCalledAt: q.lastCalledAt ?? null,
  };
}

// ── main ───────────────────────────────────────────────────────────

async function main(): Promise<void> {
  log("Loading step-2 analysis results + raw snapshot…");
  const analysisRaw = await fs.readFile(ANALYSIS_FILE, "utf-8");
  const analysis: AnalysisFile = JSON.parse(analysisRaw);
  const rawRaw = await fs.readFile(RAW_FILE, "utf-8");
  const raw: RawSnapshot = JSON.parse(rawRaw);

  const merchantsById = new Map<string, RawMerchant>();
  for (const m of raw.merchants) merchantsById.set(m.id, m);

  const results: ProbeResult[] = [];

  for (const cat of analysis.categories) {
    const categoryName = cat.categoryName;
    const queries = CATEGORY_QUERIES[categoryName];
    if (!queries || queries.length === 0) {
      log(`No query mapped for category "${categoryName}" — skipping`);
      continue;
    }

    log(`\n=== ${categoryName} ===`);

    // Find the incumbent (rank-1 merchant in this category). RawMerchant carries
    // no category, so scope by this category's known member IDs (its buried
    // candidates) and pick the best rankPosition among them from the raw snapshot.
    const catMemberIds = new Set(cat.buriedCandidates.map((b) => b.id));
    const incumbentRaw = raw.merchants
      .filter((m) => catMemberIds.has(m.id))
      .sort((a, b) => (a.rankPosition ?? 999999) - (b.rankPosition ?? 999999))[0];

    if (!incumbentRaw) {
      log(`  No incumbent ( rank 1 ) found for ${categoryName} — skipping`);
      continue;
    }

    const incumbentUrls = incumbentRaw.resources.map((r) => r.resourceUrl);
    log(`  Incumbent: ${incumbentRaw.payeeAddress} rank=${incumbentRaw.rankPosition}`);
    log(`    primary: ${incumbentUrls[0] ?? "—"} (${incumbentUrls.length} resources)`);

    // Select buried merchants for this category
    const buried = cat.buriedCandidates.slice(0, MAX_BURIED_PER_CATEGORY);
    log(`  Buried merchants ( capped at ${MAX_BURIED_PER_CATEGORY} ): ${buried.length}`);

    // Probe each query for this category ( single query in current mapping )
    for (const query of queries) {
      log(`  Probing CDP with query: "${query}"`);
      const probe = await probeCdp(query);
      log(`    CDP returned ${probe.items.length} items ( searchMethod: ${probe.searchMethod} )`);

      await sleep(REQUEST_DELAY_MS);

      // Find incumbent in results
      const incMatch = findInCdp(probe.items, incumbentUrls);
      const incQuality = incMatch ? extractItemQuality(incMatch.item) : {
        calls: null, payers: null, lastCalledAt: null,
      };

      const incumbentPair: ProbePair = {
        query,
        merchant: {
          id: incumbentRaw.id,
          payeeAddress: incumbentRaw.payeeAddress,
          referenceRank: incumbentRaw.rankPosition,
          referenceScore: Number(incumbentRaw.rankerScore),
          referenceListingQ: 0, // looked up below if needed
          referenceTxCount30d: 0,
          primaryResource: incumbentUrls[0] ?? "",
          serviceName: incumbentRaw.resources[0]?.serviceName ?? null,
        },
        incumbent: {
          id: incumbentRaw.id,
          payeeAddress: incumbentRaw.payeeAddress,
          referenceRank: incumbentRaw.rankPosition ?? 0,
          referenceScore: Number(incumbentRaw.rankerScore),
          primaryResource: incumbentUrls[0] ?? "",
          serviceName: incumbentRaw.resources[0]?.serviceName ?? null,
        },
        cdpMatch: incMatch
          ? {
              resourceUrl: incMatch.matchedUrl,
              position: incMatch.position,
              cdpCalls30d: incQuality.calls,
              cdpPayers30d: incQuality.payers,
              cdpLastCalledAt: incQuality.lastCalledAt,
            }
          : {
              resourceUrl: null,
              position: null,
              cdpCalls30d: null,
              cdpPayers30d: null,
              cdpLastCalledAt: null,
            },
      };

      // Find each buried merchant in results
      const buriedPairs: ProbePair[] = [];
      for (const b of buried) {
        const bRaw = merchantsById.get(b.id);
        const bUrls = bRaw?.resources.map((r) => r.resourceUrl) ?? [b.primaryResource];

        const bMatch = findInCdp(probe.items, bUrls);
        const bQuality = bMatch ? extractItemQuality(bMatch.item) : {
          calls: null, payers: null, lastCalledAt: null,
        };

        const pair: ProbePair = {
          query,
          merchant: {
            id: b.id,
            payeeAddress: b.payeeAddress,
            referenceRank: b.rankPosition,
            referenceScore: Number(b.rankerScore),
            referenceListingQ: b.listingQuality,
            referenceTxCount30d: b.txCount30d,
            primaryResource: b.primaryResource,
            serviceName: b.serviceName,
          },
          incumbent: {
            id: incumbentRaw.id,
            payeeAddress: incumbentRaw.payeeAddress,
            referenceRank: incumbentRaw.rankPosition ?? 0,
            referenceScore: Number(incumbentRaw.rankerScore),
            primaryResource: incumbentUrls[0] ?? "",
            serviceName: incumbentRaw.resources[0]?.serviceName ?? null,
          },
          cdpMatch: bMatch
            ? {
                resourceUrl: bMatch.matchedUrl,
                position: bMatch.position,
                cdpCalls30d: bQuality.calls,
                cdpPayers30d: bQuality.payers,
                cdpLastCalledAt: bQuality.lastCalledAt,
              }
            : {
                resourceUrl: null,
                position: null,
                cdpCalls30d: null,
                cdpPayers30d: null,
                cdpLastCalledAt: null,
              },
        };

        // verdict
        const incPos = incMatch?.position ?? 999;
        const bPos = bMatch?.position ?? 999;
        if (bPos === 999 && incPos !== 999) {
          pair.verdict = "Buried on CDP — incumbent appears in top-20, buried merchant does not";
        } else if (bPos !== 999 && incPos !== 999 && bPos > incPos) {
          pair.verdict = `Rank parity on CDP — incumbent #${incPos}, buried merchant #${bPos}`;
        } else if (bPos !== 999 && incPos === 999) {
          pair.verdict = "Anomaly — buried merchant appears in top-20 but incumbent does not";
        } else if (bPos !== 999 && incPos !== 999 && bPos < incPos) {
          pair.verdict = `Anomaly — buried merchant ranks ABOVE incumbent on CDP ( buried #${bPos}, incumbent #${incPos} )`;
        } else {
          pair.verdict = "Both absent from CDP top-20 ( query may not target this niche )";
        }

        buriedPairs.push(pair);
      }

      results.push({
        category: categoryName,
        query,
        cdpResultCount: probe.items.length,
        cdpSearchMethod: probe.searchMethod,
        incumbent: incumbentPair,
        buriedMerchants: buriedPairs,
      });
    }
  }

  // ── write the dated probe record ──────────────────────────────────
  const probedAt = new Date().toISOString();
  const outputFile = probesOutputFile(probedAt);
  const output = {
    probedAt,
    cdpSearchEndpoint: CDP_SEARCH_URL,
    queries: CATEGORY_QUERIES,
    results,
    summary: {
      totalPairs: results.reduce((s, r) => s + 1 + r.buriedMerchants.length, 0),
      totalBuriedFound: results.reduce(
        (s, r) => s + r.buriedMerchants.filter((p) => p.cdpMatch?.position !== null).length,
        0,
      ),
      totalBuriedNotInTop20: results.reduce(
        (s, r) => s + r.buriedMerchants.filter((p) => p.cdpMatch?.position === null).length,
        0,
      ),
      totalIncumbentsFound: results.filter((r) => r.incumbent.cdpMatch?.position !== null).length,
    },
  };

  await fs.writeFile(outputFile, JSON.stringify(output, null, 2));
  const sizeKB = (await fs.stat(outputFile)).size / 1024;
  log(`\nWrote ${outputFile} (${sizeKB.toFixed(1)} KB)`);
  log(
    `Frozen record at ${FROZEN_PROBES_FILE} is untouched — compare against it rather than replacing it.`,
  );
}

main().catch((err) => {
  console.error("[probe-cdp] FAILED:", err);
  process.exit(1);
});