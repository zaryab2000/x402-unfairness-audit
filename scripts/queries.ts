/**
 * v2 query set. Pre-registered in docs/v2-research-pre.md.
 *
 * 24 buyer intents drawn from the four categories the report analyses, each
 * asked twice — once in technical register, once in casual — for 48 queries.
 *
 * Derivation: every term and tag in data/raw-data.json was weighted by the
 * actual 30-day call count of the resource carrying it, so the set reflects
 * what agents *buy*, not what merchants merely list.
 *
 * The technical arm is fitted to incumbents by construction — it is phrased the
 * way the top-volume sellers describe themselves. That is deliberate: it is the
 * incumbent's BEST CASE, and serves as a control. The casual arm expresses the
 * same need with no such text match. Paraphrasing does not remove the fitting;
 * it measures how much of an incumbent's advantage depends on the buyer using
 * their vocabulary.
 *
 * Technical phrasings are kept at the CATEGORY level and deliberately avoid
 * distinctive vendor language (no "ST-IM", no "crowded-positioning radar"), so
 * they do not fingerprint one seller.
 *
 * v1's queries are superseded and none is carried forward.
 */

export type Category =
  | "Crypto & DeFi"
  | "AI & Agents"
  | "Data & Enrichment"
  | "Finance & Markets";

export type Register = "technical" | "casual";

export interface Query {
  /** Stable identifier: `<pairId>-<register initial>`. Keys every comparison. */
  id: string;
  /** Joins the two registers of one buyer intent. */
  pairId: string;
  text: string;
  category: Category;
  register: Register;
}

/** One buyer intent, expressed in both registers. */
interface Intent {
  pairId: string;
  category: Category;
  technical: string;
  casual: string;
}

const INTENTS: Intent[] = [
  // ── Crypto & DeFi — 303 merchants, 45,290 txs/30d ────────────────
  {
    pairId: "cd-1",
    category: "Crypto & DeFi",
    technical: "live perpetual funding rates and open interest across venues",
    casual: "where can I see if traders are paying to stay long or short",
  },
  {
    pairId: "cd-2",
    category: "Crypto & DeFi",
    technical: "smart money wallet netflows and whale accumulation",
    casual: "are big wallets buying or selling this token",
  },
  {
    pairId: "cd-3",
    category: "Crypto & DeFi",
    technical: "defi yield farming APY across lending protocols",
    casual: "where can I park stablecoins for the best return right now",
  },
  {
    pairId: "cd-4",
    category: "Crypto & DeFi",
    technical: "crypto market news with sentiment analysis",
    casual: "what is the crypto market mood today",
  },
  {
    pairId: "cd-5",
    category: "Crypto & DeFi",
    technical: "token balance and portfolio holdings for a wallet address",
    casual: "what coins are in this wallet",
  },
  {
    pairId: "cd-6",
    category: "Crypto & DeFi",
    technical: "trending altcoins and social sentiment signals",
    casual: "which coins are people talking about right now",
  },

  // ── AI & Agents — 128 merchants, 13,912 txs/30d ──────────────────
  {
    pairId: "ai-1",
    category: "AI & Agents",
    technical: "chat completions across multiple frontier LLM models",
    casual: "I want to ask a question to a language model",
  },
  {
    pairId: "ai-2",
    category: "AI & Agents",
    technical: "neural web search with full page content extraction",
    casual: "search the internet and read the pages for me",
  },
  {
    pairId: "ai-3",
    category: "AI & Agents",
    technical: "AI generated answer grounded in live web sources",
    casual: "just answer my question using the internet",
  },
  {
    pairId: "ai-4",
    category: "AI & Agents",
    technical: "prediction market odds on polymarket and kalshi",
    casual: "what are the odds people are betting on this happening",
  },
  {
    pairId: "ai-5",
    category: "AI & Agents",
    technical: "social mindshare and project attention metrics",
    casual: "how much attention is this crypto project getting online",
  },
  {
    pairId: "ai-6",
    category: "AI & Agents",
    technical: "scrape and crawl a website into structured markdown",
    casual: "turn this website into text I can read",
  },

  // ── Data & Enrichment — 34 merchants, 20,244 txs/30d, HHI 6,798 ──
  {
    pairId: "de-1",
    category: "Data & Enrichment",
    technical: "find a work email address from a linkedin profile",
    casual: "how do I contact this person I found on linkedin",
  },
  {
    pairId: "de-2",
    category: "Data & Enrichment",
    technical: "people search filtered by company seniority and job title",
    casual: "get me a list of people who do this job at this company",
  },
  {
    pairId: "de-3",
    category: "Data & Enrichment",
    technical: "enrich a person profile with career history and phone",
    casual: "tell me about this person and where they work",
  },
  {
    pairId: "de-4",
    category: "Data & Enrichment",
    technical: "company enrichment with employee count and industry",
    casual: "how many employees does this company have",
  },
  {
    pairId: "de-5",
    category: "Data & Enrichment",
    technical: "google maps place details and business listings",
    casual: "find details about this shop or restaurant",
  },
  {
    pairId: "de-6",
    category: "Data & Enrichment",
    technical: "search reddit posts and social discussions",
    casual: "what are people saying about this on reddit",
  },

  // ── Finance & Markets — 31 merchants, 2,614 txs/30d ──────────────
  {
    pairId: "fm-1",
    category: "Finance & Markets",
    technical: "current funding rates per venue for a symbol",
    casual: "what is it costing to hold this position right now",
  },
  {
    pairId: "fm-2",
    category: "Finance & Markets",
    technical: "latest stock price quote and weekly performance",
    casual: "what is the share price of this company",
  },
  {
    pairId: "fm-3",
    category: "Finance & Markets",
    technical: "SEC EDGAR filings and 10-K company disclosures",
    casual: "show me what this company filed with regulators",
  },
  {
    pairId: "fm-4",
    category: "Finance & Markets",
    technical: "equity market indicators and momentum signals",
    casual: "is this stock going up or down",
  },
  {
    pairId: "fm-5",
    category: "Finance & Markets",
    technical: "market regime classification and sector rotation",
    casual: "is the market risk on or risk off right now",
  },
];

/** Flattened to one entry per query. Technical arm first, then casual. */
export const QUERIES: Query[] = [
  ...INTENTS.map((i) => ({
    id: `${i.pairId}-t`,
    pairId: i.pairId,
    text: i.technical,
    category: i.category,
    register: "technical" as const,
  })),
  ...INTENTS.map((i) => ({
    id: `${i.pairId}-c`,
    pairId: i.pairId,
    text: i.casual,
    category: i.category,
    register: "casual" as const,
  })),
];

/** The 24 intents, each mapping to its technical and casual query. */
export function registerPairs(): Map<string, { technical: Query; casual: Query }> {
  const byPair = new Map<string, { technical?: Query; casual?: Query }>();
  for (const q of QUERIES) {
    const entry = byPair.get(q.pairId) ?? {};
    entry[q.register] = q;
    byPair.set(q.pairId, entry);
  }

  const complete = new Map<string, { technical: Query; casual: Query }>();
  for (const [pairId, entry] of byPair) {
    if (entry.technical && entry.casual) {
      complete.set(pairId, { technical: entry.technical, casual: entry.casual });
    }
  }
  return complete;
}

export const CATEGORIES: Category[] = [
  "Crypto & DeFi",
  "AI & Agents",
  "Data & Enrichment",
  "Finance & Markets",
];
