# What x402 discovery actually shows an agent

A first-hand test of the CDP Bazaar and AgentCash discovery indices.
Collected 2026-08-19. 19 queries, 188 CDP results, 120 AgentCash results.

---

## Why this test exists

The audit in this repo works backwards. It takes a frozen snapshot of 1,212
merchants, applies a scoring formula whose weights are published, and shows the
formula rewards transaction volume over listing quality. That is an argument
about a **mechanism**.

This test works forwards. It types queries into live discovery indices and
records what comes back. No formula assumed, nothing inferred from a snapshot —
just what an agent would actually receive.

The two approaches answer different questions, and where they disagree, that
disagreement is itself information. They do disagree in one place, reported in
full below.

---

## Method

### The indices

| | CDP Bazaar | AgentCash |
| --- | --- | --- |
| Endpoint | `GET /platform/v2/x402/discovery/search` | MCP `search` tool |
| Auth | none | none for search |
| Result cap | 20, **no offset parameter** | paginated |
| Catalog listing | `GET /platform/v2/x402/discovery/resources` (15,101 resources) | not exposed |
| Ranking formula | unpublished | unpublished |
| Signals returned per result | `l30DaysTotalCalls`, `l30DaysUniquePayers`, `lastCalledAt` | `score`, `vectorSimilarity.{score,rank}`, `resourceUsage`, `originUsage`, `trustedUserUsageRatio` |

This asymmetry shapes the whole design:

- **CDP hides its formula but exposes usage stats per result.** Its ranking must
  be *inferred* by correlating placement against observable features.
- **AgentCash itemises its own signals, including the pre-rerank semantic
  rank.** Its reranking can be *measured* directly.

CDP's search reports `searchMethod: "hybrid"` on every query — it is blending
lexical and vector retrieval.

### The 19 queries

Phrased as capabilities rather than keywords, because that is how an agent asks.
Full set in `scripts/queries.ts`.

**Head tier (8)** — dense, competitive domains. When many services genuinely
match, relevance cannot settle the order alone; whatever breaks the tie reveals
what the ranking actually prefers.

| id | query |
| --- | --- |
| `head-weather` | weather forecast for a city |
| `head-token-price` | current price of a crypto token |
| `head-wallet` | wallet balance and onchain activity for an address |
| `head-llm` | run an LLM completion or chat model |
| `head-websearch` | search the web and return results |
| `head-company` | look up company information by domain |
| `head-news` | latest financial news headlines |
| `head-image` | generate an image from a text prompt |

**Tail tier (5)** — sparse niches where almost nobody has volume. Tests whether
ranking falls back to relevance when there is no usage to rank on.

| id | query |
| --- | --- |
| `tail-tides` | tide times for a coastal harbour |
| `tail-shipping` | container shipping freight rates |
| `tail-legal` | check trademark registration status |
| `tail-soil` | soil moisture readings for farmland |
| `tail-flight` | historical flight delay statistics |

**Paraphrase tier (6, in 3 pairs)** — same intent, different words. A merchant's
discoverability should not depend on the buyer's phrasing. This tier exists to
measure the "single-query probe design" limitation the report already discloses.

| intent | A | B |
| --- | --- | --- |
| weather | what is the weather going to be like tomorrow | meteorological conditions and temperature outlook |
| token-price | how much is this token worth right now | cryptocurrency spot quote and market data |
| person-enrichment | find someone's email address and job title | b2b contact enrichment and lead data |

### Design discipline

Collection touches the network and is not reproducible; analysis is a pure
function over a committed file and is. Same split as this repo's `probe` vs
`verify`. Every query is issued twice and the orderings compared, so instability
would be recorded rather than silently averaged away.

**Ranking is deterministic: 19/19 queries returned byte-identical ordering on
repeat.** Findings here are reproducible within a session, even though the live
catalog moves between sessions.

---

## What the result pages look like

Before the findings, the shape of the data, because it governs how much weight
any correlation can carry.

| | |
| --- | ---: |
| Total CDP results across 19 queries | 188 |
| Median 30-day calls per result | **3** |
| Maximum | 783 |
| Results with ≤2 calls in 30 days | **89 of 187** |
| Results with no `serviceName` | 53 |
| Results with zero tags | 52 |
| Results with an input schema | **188 of 188** |
| Results with an output example | 146 |
| Results flagged `curated` | **1** |

Nearly half of everything surfaced has two or fewer transactions in 30 days.
This is a very small market, and every correlation below sits on top of that
fact.

---

## Finding 1 — Retrieval, not the result cap, is what hides the catalog

| | |
| --- | ---: |
| Catalog size | 15,101 |
| Unique resources surfaced by 19 queries | **177** |
| Share of catalog reached | **1.172%** |
| Median results per query | **9.0** |
| Queries hitting the 20-result cap | **0** |
| Unique payee addresses | 94 |

I expected the 20-result ceiling to be the bottleneck. **It never binds.** No
query returned 20 results. The median was 9, and the thinnest — trademark
status — returned 4.

So the constraint is not that page one is short. It is that a well-formed
capability query *finds* nine things when 15,101 exist. There is also no offset
parameter, so if you are not in that top-20 you are not on page 2 either —
there is no page 2. But that ceiling turns out to be the second-order problem.

Result counts per query:

| query | results | | query | results |
| --- | ---: | --- | --- | ---: |
| head-weather | 18 | | tail-tides | 6 |
| head-image | 16 | | tail-shipping | 12 |
| head-llm | 14 | | tail-legal | **4** |
| head-websearch | 12 | | tail-soil | 7 |
| head-news | 12 | | tail-flight | 11 |
| head-token-price | 11 | | para-weather-a | 8 |
| head-wallet | 9 | | para-weather-b | 9 |
| head-company | **8** | | para-token-a | **5** |
| | | | para-token-b | 6 |
| | | | para-person-a | 9 |
| | | | para-person-b | 11 |

### Concentration across unrelated queries

94 distinct payee addresses across 177 unique resources. But one address
surfaced on **10 of 19 queries** — spanning weather, crypto, search and
enrichment, domains with nothing in common:

| payee | queries |
| --- | ---: |
| `0xF22e558a00D91Ee12A1F50C52186FecB8dDFf493` | **10** |
| `0x217e5Fe265EB78b29067bF8324ef03a7D8e167C4` | 6 |
| `0x0E84dDEdAaE6A779c462C22a59F301EC31B6b808` | 5 |
| `0xB810B599bc730Aa85800BABe7f5d160524322C86` | 5 |
| four addresses | 4 each |

Multi-endpoint gateway operators occupy a disproportionate share of everything
an agent sees. This is concentration of a different kind than the Gini/HHI
figures in the report — not concentration of *volume*, but concentration of
*visibility* across unrelated intents.

---

## Finding 2 — Discoverability depends on the buyer's phrasing more than on the merchant

Same intent, different words:

| intent | Jaccard overlap | shared results | same #1 |
| --- | ---: | ---: | --- |
| weather | 0.308 | 4 | no |
| token price | **0.000** | **0** | no |
| person enrichment | **0.000** | **0** | no |

Two of three pairs share **not one result**. Not a different order — completely
disjoint sets.

"How much is this token worth right now" returns Token Price
(`api.anchor-x402.com`), Token Snapshot, Tereno Token Metadata. "Cryptocurrency
spot quote and market data" returns a community endpoint, Hyperliquid Market
Data, orchard-data. Two ways of asking the same question, zero merchants in
common.

Even the best case is weak: the weather pair shares 4 results out of 8 and 9,
and still disagrees on the top result — `x402.shizu.me` (153 calls) for one
phrasing, `weather.payapi.market` (88 calls) for the other.

**This is the sharpest result in the study.** Your report already lists
"single-query probe design" as a limitation. This measures it, and it is larger
than the disclosure implies: for two of three intents, changing the wording
replaces the entire result set. Whether a merchant is discoverable is, to a
substantial degree, a property of the sentence the buyer happened to type.

---

## Finding 3 — The two indices barely overlap

Same queries, both indices, compared **by host** rather than full URL (the two
index at different path granularity, so URL matching would understate real
agreement).

| query | CDP | AgentCash | Jaccard | shared hosts | same top-1 |
| --- | ---: | ---: | ---: | ---: | --- |
| head-weather | 18 | 10 | 0.087 | 2 | no |
| head-token-price | 11 | 15 | **0.000** | 0 | no |
| head-wallet | 9 | 15 | **0.000** | 0 | no |
| head-llm | 14 | 12 | 0.045 | 1 | no |
| head-websearch | 12 | 12 | **0.000** | 0 | no |
| head-company | 8 | 10 | **0.000** | 0 | no |
| head-news | 12 | 10 | **0.000** | 0 | no |
| head-image | 16 | 10 | 0.043 | 1 | no |
| tail-tides | 6 | 8 | **0.000** | 0 | no |
| para-person-a | 9 | 10 | 0.100 | 1 | no |
| para-person-b | 11 | 8 | 0.154 | 2 | no |

**Median Jaccard: 0.000.** Six of eleven queries share no host at all. The best
overlap is 0.154. **No query produced the same top result on both indices.**

Rank agreement is uncomputable on most queries — with 0 or 1 shared host there
is nothing to correlate.

A merchant's visibility depends on which index the agent happens to query, more
than on anything the merchant controls. "Being discoverable in x402" is not one
property; it is one property per index, and they are close to uncorrelated.

---

## Finding 4 — Usage leads on CDP, but weakly, and the top signal is a listing field

Spearman correlation between placement and each observable signal, pooled across
queries with rank normalised per query so a 18-result page and a 4-result page
contribute comparably.

| signal | Spearman vs placement | n |
| --- | ---: | ---: |
| **hasServiceName** | **0.3306** | 188 |
| calls30d | 0.3234 | 187 |
| payers30d | 0.3053 | 187 |
| tagCount | 0.1788 | 188 |
| recency (−days since last call) | 0.1598 | 188 |
| hasOutputExample | 0.1351 | 188 |
| hasIcon | −0.0262 | 188 |
| descriptionLength | −0.0226 | 188 |
| priceUsd | 0.0093 | 183 |
| hasInputSchema | **no variance** | 188 |

Four things here.

**(a) Volume leads among usage signals but explains far less than the snapshot
formula implies.** ρ≈0.32 for 30-day calls, against a formula weighting volume
at 0.40 and producing near-deterministic ordering. The live index is visibly
mixing relevance in — consistent with its self-reported `searchMethod: hybrid`.

**(b) The single strongest signal is `hasServiceName` — a listing field, not a
usage one.** Filling in your service name correlates with placement marginally
*above* transaction count. 53 of 188 surfaced results have no service name, so
this is not a saturated field: it is a real, freely available lever. **This cuts
against the report's headline**, and is published as measured.

**(c) `hasInputSchema` has zero variance — all 188 results have one.** It cannot
be tested as a ranking signal because it never varies. That is precisely the
report's claim that documentation "governs whether a service is indexed at all,"
confirmed on live data: the schema is an admission ticket, not a ranking lever.

**(d) Description length is flat-to-negative (−0.0226).** Writing more prose does
not help. Structured fields (name, tags, output example) all correlate
positively; unstructured length does not.

### Per-query: the pooled figure hides enormous variance

| query | calls~rank | payers~rank |
| --- | ---: | ---: |
| head-company | **+0.8051** | +0.6547 |
| para-person-b | +0.7138 | +0.7853 |
| para-weather-a | +0.6099 | +0.5183 |
| head-token-price | +0.5923 | +0.3927 |
| head-llm | +0.5451 | +0.1830 |
| head-news | +0.5413 | +0.5236 |
| head-image | +0.4580 | +0.4258 |
| head-websearch | +0.4450 | +0.5380 |
| tail-tides | +0.4414 | +0.1690 |
| para-weather-b | +0.3866 | +0.4001 |
| tail-shipping | +0.3702 | +0.5130 |
| para-token-b | +0.3086 | +0.3947 |
| para-token-a | +0.3000 | +0.4743 |
| para-person-a | +0.2921 | +0.1743 |
| head-weather | +0.2618 | +0.1917 |
| tail-flight | +0.1033 | +0.0737 |
| **tail-soil** | **−0.3563** | −0.4082 |
| **head-wallet** | **−0.7454** | −0.4108 |
| **tail-legal** | **−0.9487** | −0.8944 |

The range runs from **+0.81 to −0.95**. Three queries are negative — meaning
*lower*-volume merchants ranked *higher*. Two are tail queries where nobody has
volume to rank on: on `tail-legal`, the top three results have 1, 1 and 2 calls.
On `tail-soil`, the top three all have exactly 1.

**Usage dominates only where there is usage to dominate with.** In sparse
niches, ranking reverts to relevance — which is the cold-start-friendly
behaviour the snapshot audit does not predict.

The head-tier queries also show that volume does not simply win. On
`head-weather` the top result has 77 calls while #2 has **153** — nearly double,
ranked lower. On `head-company` the top result has 6 calls while #2 has 49 and
#3 has 52. On `head-websearch`, #1 has 6 calls and #3 has 18.

Median top-5 vs bottom-5 separation is correspondingly thin: 3.0 vs 2.0 calls.

---

## Finding 5 — On AgentCash, reranking is gentle and its bite is in the tail

AgentCash returns both `vectorSimilarity.rank` and a final position, so the
reranking is directly observable.

### A measurement correction that changed the answer

My first pass subtracted `vectorSimilarityRank` from `position` and reported
"110 promoted, 0 demoted, median displacement 9 places." **That was an artifact,
not a finding.** `vectorSimilarityRank` indexes the *full candidate pool* —
ranks up to 98 appear inside a 10-result page — while `position` indexes only
the returned page. Their raw difference is dominated by that offset, so nearly
everything scores as "promoted."

The corrected measure re-ranks each returned set by its own vector ranks — the
counterfactual ordering if usage carried no weight — and compares that to what
the agent receives. Displacement is then movement **relative to peers**, which
is what actually changes which merchant gets picked.

### Corrected results

| | |
| --- | ---: |
| Results compared | 120 |
| Median \|displacement\| | **0.0 places** |
| Unmoved | **105** |
| Promoted by usage | 4 |
| Demoted by usage | 11 |
| Relevance-only rank ~ final rank | **0.9739** |
| Origin transactions ~ displacement | 0.0017 |

**105 of 120 results sit exactly where semantic relevance alone would place
them.** Relevance-only ordering correlates 0.97 with what the agent receives.
On AgentCash, usage is a tiebreaker, not the primary key.

The transactions-to-displacement correlation is ~0 (0.0017) — but that is not
evidence of no effect. It is dragged to zero by the 105 results with zero
displacement. **The effect lives in the tail, not the average.**

The clearest case: `stableenrich.dev/api/companyenrich/org-enrich` on the
company-lookup query. Semantic rank **98** in the candidate pool. Final position
**3**. Against peers, a **+7 place** promotion — the largest in the dataset. It
carries **493,318 origin transactions and 850 unique users**, against
competitors with 1 to 846.

The same origin appears again on `para-person-a` at semantic rank 40, and on
`para-person-b` at semantic rank 59 — reaching the returned page both times.
A merchant with half a million transactions gets pulled into result sets that
pure relevance would have excluded.

So the incumbency premium on AgentCash is **real but concentrated**: it does
nothing to most results and moves a very-high-volume merchant a long way.

---

## How these findings relate to the report

**Findings 1, 2 and 3 sharpen the report's case.** They identify barriers the
snapshot audit could not see, because they are properties of the retrieval
layer rather than the scoring layer:

- 98.8% of the catalog is not reached by 19 well-formed queries.
- Two of three paraphrase pairs share zero results.
- The two indices agree on essentially nothing.

None of these depends on the scoring formula at all. A merchant can have perfect
metadata and strong volume and still be invisible because the buyer phrased the
query differently, or used a different index.

**Finding 4 partly cuts against the report, and is published as measured.**
`hasServiceName` out-correlating `calls30d` is a cold-start-*friendly* result.
Three queries show negative volume-to-rank correlation. The live hybrid index
does not behave like the frozen formula.

Two things reconcile this without dissolving it:

1. The report's own scope note says the snapshot formula is "a reference
   implementation... the production formula has since changed." This is direct
   evidence of exactly that drift, on a different index.
2. The correlations here are computed on results **already retrieved**. Finding 1
   shows retrieval eliminates 98.8% of the catalog before ranking runs at all.
   A weak volume-to-rank correlation among nine survivors says nothing about
   what volume did to the other 15,092.

**Finding 5 is the report's cold-start thesis, at a smaller magnitude than the
snapshot implies.** The mechanism is confirmed — a 493,318-transaction merchant
is promoted into results relevance would have excluded — but it moves 15 of 120
results rather than reordering the page.

---

## What this study does not show

- **CDP's formula remains unpublished.** Finding 4 infers association from 188
  observations. It is not causal, and a signal absent from the API response
  cannot be tested at all.
- **AgentCash's `score` is not fully decomposed.** The published signals are
  inputs; the function combining them is not given.
- **19 queries is a probe, not a census.** The 1.172% coverage figure is a
  property of this query set, not a bound on what the index can surface.
- **Query phrasing is the author's.** Finding 2 demonstrates how much that
  choice matters — which is the point, but it also means no query set is
  neutral, including this one.
- **One instant.** Collected 2026-08-19. CDP recomputes ranking every 6 hours by
  its own documentation, and the catalog total moved from 15,105 to 15,101
  during this session's own collection runs.
- **Small numbers.** Median 3 calls per result, 89 of 187 results at ≤2 calls.
  Correlations over a market this thin are real but fragile.
- **x402scan is not included.** It exposes no public JSON API — `/api/resources`,
  `/api/search` and tRPC endpoints all return 404. Adding it would require
  scraping. The analyzer's comparison seam accepts a third index without
  restructuring.

---

## Reproducing

```bash
npm run rank:collect                                    # live, non-deterministic
npm run rank:analyze -- data/rank-experiment-<date>.json # pure, deterministic
```

| artifact | what it is |
| --- | --- |
| `scripts/queries.ts` | the 19-query set, shared by both indices |
| `scripts/rank-experiment.ts` | CDP collector |
| `scripts/rank-analyze.ts` | the five analyses, no network |
| `data/rank-experiment-2026-08-19.json` | raw ranked results, verbatim |
| `data/agentcash-2026-08-19.json` | AgentCash sidecar (MCP-collected) |
| `data/rank-findings-2026-08-19.json` | computed findings |
| `docs/RANKING-EXPERIMENT.md` | method reference |

AgentCash search is reachable only through an MCP tool, not plain HTTP, so it
cannot be collected by the script. Its results are recorded to a dated sidecar
keyed by the same `queryId` values. The analyzer picks it up automatically;
without it, Findings 1–4 still run and 3/5 are skipped with a notice.

A collection bug was found and fixed during this study: `position` was written
0-indexed while the code documented it as 1-indexed. Data was re-collected after
the fix. Spearman correlations are invariant to that shift so Finding 4 was
unaffected, but the stored artifacts now match their documentation.
