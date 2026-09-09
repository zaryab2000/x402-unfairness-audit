# v2 research protocol — pre-registration

**Status: approved and executed 2026-08-19.** Results in
[`v2-research-results.md`](v2-research-results.md). This document is retained
unaltered except for the query-count correction noted below, so the design can
be checked against what was actually run.

This document fixes the design *before* collection, so the findings cannot be
retrofitted to whatever the data happens to show. It states the objective, the
exact queries, what will be measured, and what each possible outcome would mean.

v1 (`baazar_research.md`) is superseded. Its queries were written from intuition
about what agents ask, not from what these markets actually sell. v2 replaces
them entirely — no v1 query is carried forward.

---

## 1. Objective

The report audits a frozen snapshot against a published scoring formula and
concludes that discovery selects on transaction volume, which compounds against
newcomers. That is an argument about a **mechanism**.

v2 tests the **outcome**, first-hand, on live indices:

> When a buyer asks for a service that exists in one of the four real x402
> markets, who does the index actually return — and does the answer depend on
> the merchant's merit, the buyer's vocabulary, or the index they happened to
> use?

Three sub-questions:

1. **What does the ranking reward** once retrieval has already happened?
2. **What does retrieval silently exclude** before ranking runs at all?
3. **Is "discoverable" a stable property** of a merchant, or does it move with
   phrasing and index choice?

Question 2 is the one v1 stumbled into and the one the snapshot audit
structurally cannot see: a formula analysis assumes the candidate set: it cannot
observe who never entered it.

---

## 2. Scope — the four markets

Queries are confined to the four categories the report analyses, and were
derived from them rather than invented.

| Category | Merchants | 30d txs | Gini | HHI | What actually sells (top services by 30d calls) |
| --- | ---: | ---: | ---: | ---: | --- |
| Crypto & DeFi | 303 | 45,290 | 0.9235 | 816 | Otto AI (~11k calls: news/sentiment, funding rates, yield, KOL signals), Nansen (smart money, balances) |
| AI & Agents | 128 | 13,912 | 0.9524 | 1,841 | Exa search (4,128), BlockRun.AI (mindshare, prediction markets, Exa proxying) |
| Data & Enrichment | 34 | 20,244 | 0.9244 | **6,798** | StableEnrich (~10k on Exa search, plus FullEnrich/PDL/Firecrawl/Clado), Linked Panda |
| Finance & Markets | 31 | 2,614 | 0.7809 | 1,700 | Usenami (funding rates, 354), Stock Trends (~12 endpoints at ~43 calls each) |

### How the queries were derived

Every term and tag in `data/raw-data.json` was weighted by the **actual 30-day
call count** of the resource carrying it, so the query set reflects what agents
*buy*, not what merchants merely list. Candidates were then tested against the
live CDP index and rephrased where retrieval was too thin to make ranking
meaningful.

---

## 3. The queries

23 intents (6 + 6 + 6 + 5). Each is asked **twice** — once in technical
register, once in casual — for **46 queries total**.

Every pair expresses the same buyer need. Only the vocabulary changes.

### Crypto & DeFi

| id | technical | casual |
| --- | --- | --- |
| `cd-1` | live perpetual funding rates and open interest across venues | where can I see if traders are paying to stay long or short |
| `cd-2` | smart money wallet netflows and whale accumulation | are big wallets buying or selling this token |
| `cd-3` | defi yield farming APY across lending protocols | where can I park stablecoins for the best return right now |
| `cd-4` | crypto market news with sentiment analysis | what is the crypto market mood today |
| `cd-5` | token balance and portfolio holdings for a wallet address | what coins are in this wallet |
| `cd-6` | trending altcoins and social sentiment signals | which coins are people talking about right now |

### AI & Agents

| id | technical | casual |
| --- | --- | --- |
| `ai-1` | chat completions across multiple frontier LLM models | I want to ask a question to a language model |
| `ai-2` | neural web search with full page content extraction | search the internet and read the pages for me |
| `ai-3` | AI generated answer grounded in live web sources | just answer my question using the internet |
| `ai-4` | prediction market odds on polymarket and kalshi | what are the odds people are betting on this happening |
| `ai-5` | social mindshare and project attention metrics | how much attention is this crypto project getting online |
| `ai-6` | scrape and crawl a website into structured markdown | turn this website into text I can read |

### Data & Enrichment

| id | technical | casual |
| --- | --- | --- |
| `de-1` | find a work email address from a linkedin profile | how do I contact this person I found on linkedin |
| `de-2` | people search filtered by company seniority and job title | get me a list of people who do this job at this company |
| `de-3` | enrich a person profile with career history and phone | tell me about this person and where they work |
| `de-4` | company enrichment with employee count and industry | how many employees does this company have |
| `de-5` | google maps place details and business listings | find details about this shop or restaurant |
| `de-6` | search reddit posts and social discussions | what are people saying about this on reddit |

### Finance & Markets

| id | technical | casual |
| --- | --- | --- |
| `fm-1` | current funding rates per venue for a symbol | what is it costing to hold this position right now |
| `fm-2` | latest stock price quote and weekly performance | what is the share price of this company |
| `fm-3` | SEC EDGAR filings and 10-K company disclosures | show me what this company filed with regulators |
| `fm-4` | equity market indicators and momentum signals | is this stock going up or down |
| `fm-5` | market regime classification and sector rotation | is the market risk on or risk off right now |

*(`fm` has 5 intents, the others 6 — Finance & Markets is genuinely thin at 31
merchants and a fifth pair would have been padding.)*

---

## 4. Pilot readings — why the casual arm matters

Both arms were pilot-tested for **result count only** (no ranking recorded, no
findings drawn) to confirm each query retrieves enough to make ranking
meaningful. Those counts are already stark:

| | technical | casual |
| --- | ---: | ---: |
| Mean results per query | **≈13** | **≈4.6** |
| Range | 8 – 18 | **0** – 13 |

Casual phrasing retrieves roughly **a third** of what technical phrasing does
for the identical need. `ai-2a` ("find me pages about a topic and give me what
they say") returned **zero results** — while its technical twin returned 11.

This is not an artifact of vagueness. Precise-but-plain phrasings collapse too:

| query | results |
| --- | ---: |
| "what is the share price of this company" | 1 |
| "is this stock in an uptrend or downtrend" | **0** |
| "how many employees does this company have" | 3 |
| "look things up online and pull the text" | 1 |

These are unambiguous requests. The index simply does not retrieve for them.
Register, not clarity, is what moves the number.

**Consequence for the design:** the casual arm is no longer a robustness check
bolted onto the side. It is a primary result. The pilot counts will be
re-collected under the recorded protocol rather than cited from this pilot.

---

## 5. What gets measured

Five analyses, all already implemented in `scripts/rank-analyze.ts`. Collection
is non-deterministic (live network); analysis is a pure function over the
committed file and re-runnable by anyone.

### A — What predicts rank (CDP)

CDP does not publish its formula, so it is inferred. Spearman correlation
between final position and every observable signal: `l30DaysTotalCalls`,
`l30DaysUniquePayers`, recency, price, description length, tag count, and
presence of service name / icon / input schema / output example.

Reported three ways, because a single pooled number is easy to fool:
pooled across queries with rank normalised per query; **per query**, so one
query cannot manufacture the headline; and top-5 vs bottom-5 medians, which does
not assume the relationship is linear.

### B — Reachability

Union of everything surfaced, over the live catalog total (~15,100). Also: how
many queries hit the 20-result cap, and how often one payee address recurs
across unrelated queries.

### C — Register sensitivity *(the v2 centrepiece)*

For all 23 pairs: Jaccard overlap between the technical and casual result sets,
whether the top result is the same merchant, and how many results each arm
returns.

v1 ran this on 3 pairs and found two with **zero** overlap. v2 runs it on 23,
across four categories with known concentration levels.

### D — Cross-index disagreement

Same queries against CDP and AgentCash, compared by host (the two index at
different path granularity, so URL matching would understate real agreement).

### E — Relevance vs usage (AgentCash)

AgentCash publishes the pre-rerank semantic rank alongside the final rank, so
the incumbency premium is **measured**, not inferred. Each returned set is
re-ranked by vector similarity alone; displacement is movement against those
peers.

> A v1 measurement error is already corrected here and must stay corrected:
> `vectorSimilarityRank` indexes the full candidate pool while `position`
> indexes only the returned page. Subtracting them directly scores nearly
> everything as "promoted" — an artifact. v1's first pass reported "110 promoted,
> 0 demoted"; the corrected figure was 4 promoted, 11 demoted, 105 unmoved.

### F — Per-category comparison *(new in v2)*

v1 had no category structure and could not do this. Every analysis above is also
cut by category, which lets the report's own concentration figures be tested
against live ranking behaviour:

- Data & Enrichment — HHI **6,798**, three merchants take 91.2%
- Finance & Markets — HHI **1,700**, the mildest of the four

If concentration drives discovery outcomes, these two should behave measurably
differently.

---

## 6. Execution

| step | what runs | mode |
| --- | --- | --- |
| 1 | `npm run rank:collect` — 46 queries × 2 repeats = 92 CDP calls | automated |
| 2 | Same queries through the AgentCash MCP tool → dated sidecar | manual (MCP-only, no HTTP API) |
| 3 | `npm run rank:analyze` — six analyses over committed files | automated, deterministic |

Each query is issued twice and the orderings compared. v1 found 19/19 queries
returned byte-identical ordering on repeat; if that breaks in v2 it gets
recorded rather than averaged away.

**AgentCash scope:** all 46 on CDP. On AgentCash, the **23 technical queries
plus 12 casual** (one pair per category, three per category), because each
AgentCash query is a manual tool call. Say the word if you want all 46 on both.

---

## 7. Pre-committed interpretations

Stated now so results cannot be reverse-fitted.

| finding | what it would mean |
| --- | --- |
| Casual overlap is low across most pairs | Discoverability is not a merchant property. A seller can do everything right and vanish because the buyer spoke plainly. Strengthens the report via a channel the formula analysis cannot see. |
| Casual overlap is high | Retrieval is robust to register; v1's zero-overlap pairs were an artifact of badly-chosen queries. Weakens that line of argument, and I report it as such. |
| Volume correlates strongly with rank | Direct live support for the report's central claim. |
| Volume correlates weakly, listing fields correlate more | Cuts against the report's headline. **This is what v1 found** (`hasServiceName` ρ=0.3306 vs `calls30d` ρ=0.3234) and it will be published again if it reproduces. |
| Concentrated Data & Enrichment behaves like unconcentrated Finance & Markets | Concentration does not transmit to discovery outcomes — a real problem for the report's framing, and reportable. |
| CDP and AgentCash disagree | "Discoverable in x402" is not one property but one per index. |

---

## 8. Known limitations, stated in advance

- **Queries are fitted to incumbents, by construction.** They were mined from
  the top-volume merchants' own service descriptions. This biases *toward*
  making the ranking look relevance-driven, since query and incumbent copy match
  by design. Mitigated three ways: technical queries are phrased at the
  *category* level rather than copying distinctive vendor language (no "ST-IM",
  no "crowded-positioning radar"); every intent is also asked casually, where no
  such match exists; and the technical arm is treated as the incumbent's
  **best case** — a control, not a neutral probe. **Paraphrasing does not remove
  this bias. It measures how much of the incumbent's advantage depends on the
  buyer using their vocabulary.**
- **CDP's formula stays unpublished.** Analysis A infers association, never
  causation, and cannot test a signal the API does not return.
- **AgentCash's `score` is not fully decomposed.** Published signals are inputs;
  the combining function is not given.
- **46 queries is a probe, not a census.** Any coverage percentage is a property
  of this query set.
- **One instant.** CDP recomputes ranking every 6 hours per its own docs, and
  the catalog total moved 15,105 → 15,101 during v1's own session.
- **Small market.** v1 saw a median of 3 calls per surfaced result. Correlations
  over numbers this thin are real but fragile.
- **x402scan excluded.** No public JSON API — `/api/resources`, `/api/search`
  and tRPC all return 404. The analyzer takes a third index without
  restructuring if one becomes available.
- **Casual phrasings are the author's.** They are one plausible rendering of a
  plain-spoken buyer, not a sample of real agent traffic.

---

## 9. What lands

- `scripts/queries.ts` — 46 queries, tagged by category, register and pair id
- `data/rank-experiment-<date>.json` — raw CDP results, verbatim
- `data/agentcash-<date>.json` — AgentCash sidecar
- `data/rank-findings-<date>.json` — computed findings
- `baazar_research_v2.md` — the write-up, replacing v1

v1's artifacts are retained unaltered. v2 does not overwrite them.

---

## Sign-off

Approve, or mark changes to: the queries, the AgentCash scope in §6, or the
pre-committed interpretations in §7.
