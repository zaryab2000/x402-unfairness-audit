# The ranking experiment

A first-hand test of what x402 discovery actually surfaces for an agent's query,
run against live indices rather than inferred from a snapshot.

The rest of this repo audits a frozen catalog with a published scoring formula.
This experiment asks a narrower, more direct question: **type a query an agent
would type, and see who comes back, in what order, and why.**

Run it:

```bash
npm run rank:collect                                    # queries the live CDP index
npm run rank:analyze -- data/rank-experiment-<date>.json
```

`rank:collect` touches the network and is not reproducible. `rank:analyze` is a
pure function over the collected file and is. Same split as `probe` vs `verify`.

---

## What the indices expose

| | CDP Bazaar | AgentCash |
| --- | --- | --- |
| Endpoint | `GET /platform/v2/x402/discovery/search` | MCP `search` tool |
| Auth | none | none for search |
| Result cap | 20, **no offset parameter** | paginated |
| Ranking signals shown | `quality.l30DaysTotalCalls`, `l30DaysUniquePayers`, `lastCalledAt` | `score`, `vectorSimilarity.{score,rank}`, `resourceUsage`, `originUsage`, `trustedUserUsageRatio` |
| Formula published | no | no, but inputs are itemised per result |

The asymmetry drives the design. CDP's ranking must be **inferred** by
correlating placement against observable features. AgentCash itemises its own
signals — including the pre-rerank semantic rank — so its reranking can be
**measured** directly.

CDP also serves `GET /platform/v2/x402/discovery/resources`, a fully paginated
catalog listing. That is the denominator for the coverage experiment.

---

## The query set

19 queries in three tiers (`scripts/queries.ts`), phrased as capabilities rather
than keywords, because that is how an agent asks.

- **head** (8) — dense domains: weather, token price, wallet data, LLM
  inference, web search, company lookup, financial news, image generation. Many
  merchants compete, so relevance alone cannot fix the order; whatever breaks
  the tie is the ranking's real preference.
- **tail** (5) — sparse niches: tides, freight rates, trademarks, soil moisture,
  flight delays. Tests whether ranking falls back to relevance when nobody has
  volume.
- **paraphrase** (6, in 3 pairs) — same intent, different words. A merchant's
  discoverability should not depend on the buyer's phrasing.

Each query is issued twice and the orderings compared, so instability would be
recorded rather than silently averaged away.

---

## The four experiments

### E1 — What predicts rank on CDP

Spearman correlation between placement and each observable signal, pooled across
queries with rank normalised per query (so a 20-result page and a 4-result page
contribute comparably). Reported alongside a per-query breakdown, so a single
dominant query cannot manufacture the pooled figure, and a top-5/bottom-5 median
comparison that does not assume the relationship is monotonic.

### E2 — Reachability

Union of everything surfaced across all queries, over the catalog total. Also
records how many queries hit the result cap, and how often the same payee
address recurs across unrelated queries.

Includes the phrasing-sensitivity sub-test: Jaccard overlap between the result
sets of paraphrase pairs.

### E3 — Cross-index disagreement

The same query against both indices. Compared **by host**, not by full URL,
because the two indices key on different path granularity — a URL match would
understate real agreement.

### E4 — Relevance vs usage (AgentCash)

AgentCash returns both `vectorSimilarity.rank` and a final position, so the
reranking is observable.

**The correction that matters here:** `vectorSimilarity.rank` indexes the *full
candidate pool* (ranks up to 98 appear in a 10-result page) while `position`
indexes only the returned page. Subtracting them directly is dominated by that
offset and scores nearly every result as "promoted" — an artifact, not a
finding. The measure used instead re-ranks each returned set by its own vector
ranks, and compares that counterfactual ordering to what the agent actually
receives. Displacement is then movement **relative to peers**, which is the
thing that changes which merchant an agent picks.

---

## Results — 2026-08-19

Full narrative write-up: [`baazar_research.md`](../baazar_research.md).

19 queries, 188 CDP results, 120 AgentCash results.

**Ranking is deterministic.** 19/19 queries returned byte-identical ordering on
repeat. Findings here are reproducible within a session, even though the live
catalog moves between sessions.

### E1 — usage leads, but weakly, and not everywhere

| signal | Spearman vs placement | n |
| --- | ---: | ---: |
| hasServiceName | 0.3306 | 188 |
| calls30d | 0.3234 | 187 |
| payers30d | 0.3053 | 187 |
| tagCount | 0.1788 | 188 |
| recency | 0.1598 | 188 |
| hasOutputExample | 0.1351 | 188 |
| hasIcon | −0.0262 | 188 |
| descriptionLength | −0.0226 | 188 |
| priceUsd | 0.0093 | 183 |
| hasInputSchema | — (no variance) | 188 |

Three things stand out.

1. **Volume is the strongest usage signal but explains far less than the
   snapshot audit's formula implies.** ρ ≈ 0.32 for 30-day calls, against a
   formula that weights volume at 0.40 and produces near-deterministic ordering.
   The live index is visibly blending relevance in.
2. **The top signal is `hasServiceName` — a listing field, not a usage one.**
   A merchant that fills in its service name outranks the correlation of its
   transaction count. That is a cold-start-friendly result and it cuts against
   the report's headline: here, documentation *does* move rank.
3. **`hasInputSchema` has no variance at all** — every surfaced result has one.
   It is a filter for being indexed, not a lever for ranking. This is the
   report's "documentation governs whether you are indexed at all" claim,
   confirmed on live data.

Per-query correlations swing hard: +0.81 on company lookup, −0.95 on trademark
status. In three of five tail queries the correlation is negative — the sparse
niches rank on relevance, not volume. **Usage dominates only where there is
usage to dominate with.**

Median top-5 vs bottom-5 separation is thin (3.0 vs 2.0 calls; 5 vs 4 tags),
which is consistent with a small market where most listings have near-zero
volume.

### E2 — the invisible catalog

| | |
| --- | ---: |
| Catalog size | 15,101 |
| Unique resources surfaced by 19 queries | 177 |
| Share of catalog reached | **1.172%** |
| Median results per query | 9.0 |
| Queries hitting the 20-result cap | **0** |
| Unique payee addresses | 94 |

The cap is not the binding constraint — **no query returned 20 results**, median
9. Retrieval is the constraint. 15,101 resources exist and a well-formed
capability query pulls back nine of them.

One payee address surfaced on **10 of 19 queries**, another on 6, a third on 5.
94 distinct payees across 177 resources: a handful of multi-endpoint gateways
occupy a large share of everything an agent sees, across unrelated domains.

**Phrasing sensitivity is severe:**

| intent | Jaccard | shared | same #1 |
| --- | ---: | ---: | --- |
| weather | 0.308 | 4 | no |
| token price | **0.000** | 0 | no |
| person enrichment | **0.000** | 0 | no |

Two of three paraphrase pairs share **not one result**. "How much is this token
worth right now" and "cryptocurrency spot quote and market data" return
completely disjoint sets. Discoverability is not a property of the merchant — it
is a property of the sentence the buyer happened to type. This directly
addresses the "single-query probe design" limitation the report carries: the
limitation is real, and larger than expected.

### E3 — the two indices barely overlap

**Median host-level Jaccard: 0.000.** On 6 of 11 shared queries the indices
return no common host at all; the best overlap is 0.154. No query produced the
same top result.

A merchant's visibility depends on which index the agent queries, more than on
anything the merchant does.

### E4 — relevance mostly survives the rerank

| | |
| --- | ---: |
| Results compared | 120 |
| Median \|displacement\| | **0.0 places** |
| Promoted by usage | 4 |
| Demoted by usage | 11 |
| Unmoved | **105** |
| Relevance rank ~ final rank | **0.9739** |
| Origin txs ~ displacement | 0.0017 |

**AgentCash's reranking is gentle.** 105 of 120 results sit exactly where
semantic relevance alone would place them, and relevance-only order correlates
0.97 with what the agent receives. Usage is a tiebreaker, not the primary key.

The tail is where it bites. The largest single promotion is **+7 places**:
`stableenrich.dev/api/companyenrich/org-enrich` on the company-lookup query,
carrying 493,318 origin transactions against a semantic rank of 98 in the
candidate pool. It reaches final position 3.

So the incumbency premium is real but concentrated: it does almost nothing to
most results, and moves a very-high-volume merchant a long way. The correlation
between origin transactions and displacement is ~0 (0.0017) because 105 results
have zero displacement — the effect lives in the tail, not the average.

---

## What this experiment does not show

- **CDP's formula remains unpublished.** E1 infers association from 187
  observations, not causation. A signal absent from the response cannot be
  tested.
- **AgentCash's `score` is not fully decomposed.** The published signals are
  inputs; the function combining them is not given.
- **One instant.** Collected 2026-08-19. CDP recomputes ranking every 6 hours
  per its own documentation.
- **19 queries is a probe, not a census.** The coverage figure (1.172%) is a
  property of this query set, not a bound on what the index can surface.
- **Query phrasing is the author's.** The phrasing-sensitivity result shows how
  much that choice matters, which is itself the point — but it means no single
  query set is neutral.

## How the AgentCash sidecar is produced

AgentCash search is reachable through an MCP tool, not plain HTTP, so it cannot
be collected by the script. Results are recorded to
`data/agentcash-<date>.json`, matching the collector's date, with `queryId`
values from `scripts/queries.ts` so the analyzer can pair them. The analyzer
picks the sidecar up automatically; without it, E1 and E2 still run and E3/E4
are skipped with a notice.
