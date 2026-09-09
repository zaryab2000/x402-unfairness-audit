# v2 research results — what x402 discovery returns for real market queries

Executed against the protocol pre-registered in
[`v2-research-pre.md`](v2-research-pre.md). Collected 2026-08-19.

**46 CDP queries** (23 intents × 2 registers), 404 ranked results.
**27 AgentCash queries** (23 technical + 4 casual), 168 ranked results.
**46/46 CDP queries returned byte-identical ordering on repeat.**

v1 (`baazar_research.md`) is superseded. Its queries were guesses about what
agents ask; v2's are mined from what these four markets actually sell, weighted
by real 30-day transaction counts.

---

## Headline

| # | Finding | Figure |
| --- | --- | --- |
| 1 | Plain-spoken buyers reach a third of the market | **40.3%** casual retention |
| 2 | Ranking rewards usage, but a listing field leads it | `hasServiceName` **0.2811** vs `calls30d` **0.2560** |
| 3 | The two indices disagree almost completely | median host overlap **0.067** |
| 4 | Incumbency is now measurable in the average, not just the tail | usage→displacement **0.408** (v1: 0.0017) |
| 5 | Retrieval hides 97.8% of the catalog | **325 of 15,109** resources |
| 6 | Concentration does not transmit uniformly across categories | retention **21.9%** – **52.8%** |

---

## 1. Register is the largest single barrier

The same buyer need, asked technically and then casually.

| | technical | casual |
| --- | ---: | ---: |
| Total results across 23 intents | **288** | **116** |
| Mean per query | 12.5 | 5.0 |
| Casual retention | — | **40.3%** |
| Median Jaccard overlap | — | **0.105** |
| Pairs sharing **zero** results | — | **7 of 23** |
| Pairs sharing the same top result | — | **3 of 23** |

Speaking plainly costs a buyer **60% of the market**. Seven of 23 intents return
result sets with *nothing* in common between the two phrasings — not a different
order, disjoint sets.

Only 3 of 23 pairs agree on the single best merchant. For the other 20, the
"best" service for an identical need changes entirely with the wording.

### The full pair table

| pair | category | tech | casual | retention | Jaccard | shared | same #1 |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| cd-1 | Crypto | 14 | 8 | 57% | 0.048 | 1 | no |
| cd-2 | Crypto | 11 | 2 | 18% | **0.000** | 0 | no |
| cd-3 | Crypto | 13 | 4 | 31% | **0.000** | 0 | no |
| cd-4 | Crypto | 17 | 7 | 41% | 0.200 | 4 | no |
| cd-5 | Crypto | 10 | 7 | 70% | 0.133 | 2 | no |
| cd-6 | Crypto | 15 | 6 | 40% | 0.105 | 2 | no |
| ai-1 | AI | 15 | 4 | 27% | **0.000** | 0 | no |
| ai-2 | AI | 11 | 6 | 55% | 0.214 | 3 | no |
| ai-3 | AI | 13 | 9 | 69% | 0.294 | 5 | **yes** |
| ai-4 | AI | 14 | 7 | 50% | 0.235 | 4 | no |
| ai-5 | AI | 8 | 2 | 25% | 0.111 | 1 | **yes** |
| ai-6 | AI | 11 | 2 | 18% | 0.083 | 1 | no |
| de-1 | Data | 14 | 6 | 43% | 0.111 | 2 | no |
| de-2 | Data | 11 | 6 | 55% | 0.417 | 5 | no |
| de-3 | Data | 11 | 4 | 36% | 0.071 | 1 | no |
| de-4 | Data | 9 | 3 | 33% | 0.091 | 1 | no |
| de-5 | Data | 15 | 6 | 40% | 0.235 | 4 | no |
| de-6 | Data | 12 | 13 | **108%** | **0.563** | 9 | **yes** |
| fm-1 | Finance | 18 | 4 | 22% | **0.000** | 0 | no |
| fm-2 | Finance | 8 | 1 | 13% | **0.000** | 0 | no |
| fm-3 | Finance | 16 | 2 | 13% | **0.000** | 0 | no |
| fm-4 | Finance | 9 | 2 | 22% | **0.000** | 0 | no |
| fm-5 | Finance | 13 | 5 | 38% | 0.125 | 2 | no |

The worst cases are stark. `fm-2` — "latest stock price quote and weekly
performance" returns 8 results; "what is the share price of this company"
returns **1**, and it is not among the 8. `fm-3` — a technical SEC-filings query
returns 16; "show me what this company filed with regulators" returns 2, sharing
none of them.

**This is not vagueness.** Every casual phrasing above names a specific,
unambiguous need. The index simply does not retrieve for plain language.

The one counter-example is instructive: `de-6` (Reddit search) retains 108% and
shares 9 results. "What are people saying about this on reddit" contains the
proper noun *reddit* — a term that appears verbatim in merchant listings. Where
casual language happens to include the merchants' own vocabulary, retrieval
survives. Where it does not, it collapses.

---

## 2. Ranking rewards usage — but a listing field leads it

Spearman correlation between placement and each observable signal, pooled across
all 46 queries with rank normalised per query.

| signal | Spearman vs placement | n |
| --- | ---: | ---: |
| **hasServiceName** | **0.2811** | 393 |
| payers30d | 0.2790 | 393 |
| recency (−days since last call) | 0.2581 | 393 |
| calls30d | 0.2560 | 393 |
| tagCount | 0.2118 | 393 |
| hasOutputExample | 0.1154 | 393 |
| hasIcon | 0.0619 | 393 |
| descriptionLength | 0.0557 | 393 |
| priceUsd | −0.0286 | 391 |
| hasInputSchema | **no variance** | 393 |

Four observations.

**(a) The strongest single signal is a listing field, not a usage one.** Filling
in your service name correlates with placement above transaction count. 107 of
404 surfaced results have no service name, so this is a real, unclaimed, free
lever — not a saturated field. **This reproduces v1** (there: 0.3306 vs 0.3234)
and it cuts against the report's headline, so it is stated plainly.

**(b) Buyer diversity edges raw volume.** `payers30d` (0.2790) ranks above
`calls30d` (0.2560). Who pays you matters marginally more than how often.

**(c) `hasInputSchema` has zero variance — all 404 results have one.** It cannot
be tested as a ranking signal because it never varies. This is the report's claim
that documentation "governs whether a service is indexed at all," confirmed on
live data across both registers: the schema is an admission ticket, not a lever.

**(d) Price is flat-to-negative.** Charging less does not buy placement.

### Per-query: enormous variance the pooled figure hides

Technical arm, `calls30d` vs rank:

| query | ρ | | query | ρ |
| --- | ---: | --- | --- | ---: |
| de-6-t | **+0.7846** | | ai-5-t | +0.4542 |
| de-3-t | +0.6302 | | fm-5-t | +0.4265 |
| de-5-t | +0.6239 | | de-4-t | +0.4129 |
| fm-2-t | +0.6190 | | fm-1-t | +0.3611 |
| cd-2-t | +0.5845 | | ai-2-t | +0.3196 |
| de-2-t | +0.5434 | | fm-4-t | +0.2384 |
| de-1-t | +0.5257 | | cd-5-t | +0.2202 |
| | | | fm-3-t | +0.2218 |
| | | | ai-3-t | +0.1911 |
| | | | cd-6-t | +0.1299 |
| | | | ai-1-t | +0.0901 |
| | | | cd-4-t | +0.0863 |
| | | | ai-4-t | +0.0870 |
| | | | **cd-1-t** | **−0.0509** |
| | | | **ai-6-t** | **−0.1857** |

Every one of the six Data & Enrichment queries lands between **+0.41 and +0.78**.
AI & Agents spans **−0.19 to +0.45**. The pooled 0.2560 is an average over
markets that behave very differently — which is exactly what Finding 6 examines.

---

## 3. The two indices barely overlap

Same query, CDP vs AgentCash, compared by host.

**Median Jaccard: 0.067.** Twelve of 27 queries share **no host at all**. The
best overlap is 0.500 (`de-1-t`). Only 3 of 27 queries agree on the top result —
all three in Data & Enrichment.

| overlap band | queries |
| --- | ---: |
| 0.000 (nothing in common) | **12** |
| 0.001 – 0.100 | 6 |
| 0.101 – 0.200 | 7 |
| above 0.200 | 2 |

Finance & Markets is the extreme: **all five technical queries return zero
shared hosts** between the two indices. A merchant visible on one index is, on
this evidence, close to invisible on the other.

"Discoverable in x402" is not one property. It is one property per index, and
they are nearly uncorrelated.

---

## 4. Incumbency is now measurable in the average — a change from v1

AgentCash publishes the pre-rerank semantic rank alongside the final position,
so the reranking is measured rather than inferred. Each returned set is re-ranked
by vector similarity alone; displacement is movement **relative to those peers**.

| | v2 | v1 |
| --- | ---: | ---: |
| Results compared | 168 | 120 |
| Unmoved | 128 | 105 |
| Promoted by usage | 15 | 4 |
| Demoted by usage | 25 | 11 |
| Relevance rank ~ final rank | **0.8752** | 0.9739 |
| **Origin txs ~ displacement** | **0.4080** | 0.0017 |

The last row is the headline. In v1 the usage-to-displacement correlation was
statistically nil (0.0017) — the incumbency premium existed only as a rare tail
event. On category-realistic queries it is **0.408**: a clear, positive,
average-case relationship between how much a merchant transacts and how far the
ranking lifts it above where relevance alone would place it.

The relevance-to-final correlation also fell from 0.97 to **0.8752** — semantic
relevance explains materially less of the final order on these queries.

### The mechanism, visible in one merchant

StableEnrich (493,318 origin transactions, 850 unique users — roughly 250× the
next-largest origin in this set) appears **15 times across 9 of 27 queries**:

| query | final position | pure-relevance rank in candidate pool |
| --- | ---: | ---: |
| de-6-t (reddit) | **1** | 11 |
| de-3-t (person enrich) | **1** | 2 |
| de-4-t (company enrich) | **1** | 2 |
| de-2-t (people search) | **1** | 3 |
| ai-3-c (casual: answer my question) | **1** | 17 |
| ai-3-t (grounded answer) | **2** | 14 |
| de-4-t | 2 | 7 |
| ai-2-t (neural search) | 3 | **82** |
| de-3-t | 3 | 24 |
| de-4-t | 4 | 24 |
| ai-6-t (scrape to markdown) | 5 | **85** |
| de-2-t | 5 | **71** |
| de-5-t (maps) | 5 | 30 |
| de-3-t | 6 | 36 |
| de-2-t | 2 | 22 |

Two rows deserve attention. On `ai-2-t`, a listing that pure semantic relevance
ranks **82nd** in the candidate pool reaches the agent at **position 3**. On
`ai-6-t`, **85th** becomes **position 5**. And on `ai-3-c` — a *casual* query,
where no vocabulary match exists — a semantically 17th-ranked listing takes
**position 1**, ahead of the vector-rank-1 result.

That is the report's cold-start thesis, observed directly: half a million
transactions purchase entry into result sets that relevance alone would exclude.

---

## 5. Retrieval hides 97.8% of the catalog

| | |
| --- | ---: |
| Catalog size | **15,109** |
| Unique resources surfaced by 46 queries | **325** |
| Share of catalog reached | **2.151%** |
| Median results per query | 8.5 |
| Queries hitting the 20-result cap | **0** |
| Unique payee addresses | 132 |

The 20-result cap never binds — no query returned 20, median 8.5. The
constraint is retrieval, not page length. And search exposes no offset
parameter, so there is no page 2 regardless.

Two payee addresses each surfaced on **15 of 46 queries**, spanning categories
with nothing in common:

| payee | queries |
| --- | ---: |
| `0x0E84dDEdAaE6A779c462C22a59F301EC31B6b808` | **15** |
| `0xF22e558a00D91Ee12A1F50C52186FecB8dDFf493` | **15** |
| `0x217e5Fe265EB78b29067bF8324ef03a7D8e167C4` | 12 |
| `0xe4181c7de066959bcca010525304ba68a84768e0` | 11 |

This is concentration of *visibility* across unrelated intents — distinct from
the volume concentration the report measures with Gini and HHI.

### The shape of what gets surfaced

| | |
| --- | ---: |
| Median 30-day calls per result | **3** |
| Maximum | 17,365 |
| Results with ≤2 calls in 30 days | **191 of 404** |
| Results with an input schema | **404 of 404** |
| Results with no service name | 107 |
| Results flagged `curated` | 17 |

Nearly half of everything surfaced has two or fewer transactions in 30 days.
Every correlation in this report sits on top of that fact.

---

## 6. Concentration does not transmit uniformly

The report's own concentration figures, tested against live behaviour:

| category | HHI (report) | mean tech | mean casual | **casual retention** | median Jaccard | calls~rank |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Crypto & DeFi | 816 | 13.3 | 5.7 | 42.5% | 0.076 | 0.200 |
| AI & Agents | 1,841 | 12.0 | 5.0 | 41.7% | 0.163 | 0.148 |
| Data & Enrichment | **6,798** | 12.0 | 6.3 | **52.8%** | 0.173 | **0.421** |
| Finance & Markets | 1,700 | 12.8 | 2.8 | **21.9%** | **0.000** | 0.268 |

Two results here run in opposite directions, and both matter.

**Data & Enrichment — the report's most concentrated market (HHI 6,798) — shows
the strongest volume-to-rank coupling (ρ=0.421), by a wide margin.** Where three
merchants take 91.2% of payments, the live ranking tracks transaction count more
tightly than anywhere else. The concentration thesis holds here, on live data.

**But it is also the most robust to casual phrasing (52.8% retention).** The
dominant merchants are so thoroughly indexed that even plain language finds
them. Concentration produces *stability* of discovery, not fragility.

**Finance & Markets is the mirror image.** Middling concentration (HHI 1,700),
yet the worst casual retention in the study (**21.9%**) and a median Jaccard of
exactly **0.000** — not one of its five intents shares a result between
registers. It is also the only category where CDP and AgentCash share no host on
any technical query.

So concentration and discoverability are not the same axis. A thin, unconsolidated
market can be *harder* to reach than a heavily concentrated one, because nobody
in it has enough presence to be found by an ordinary sentence.

Note that visibility concentration is remarkably flat across categories —
top-payee share runs 10.0% to 12.8% regardless of the underlying HHI. Whatever
drives result-page dominance is not the same thing the report's HHI measures.

---

## How these findings sit against the report

**Findings 1, 3 and 5 strengthen the case through a channel the snapshot audit
cannot observe.** They are properties of *retrieval*, which runs before ranking:

- 46 well-formed queries reach 2.151% of the catalog.
- Plain-spoken buyers lose 60% of the market; 7 of 23 intents lose all of it.
- The two indices share a median 0.067 of their results.

None of this depends on the scoring formula. A merchant can have perfect
metadata and strong volume and remain invisible because the buyer phrased the
query normally, or used a different index.

**Finding 4 is the report's cold-start thesis, confirmed and strengthened
relative to v1.** The usage-to-displacement correlation moved from 0.0017 to
**0.408** once queries reflected real market demand. A 493,318-transaction
merchant enters result sets from semantic rank 82 and 85.

**Finding 2 partly cuts against the report and is published as measured.**
`hasServiceName` out-correlating `calls30d` is a cold-start-*friendly* result,
and it reproduced across both v1 and v2 with different query sets. Two things
qualify it without dissolving it:

1. The correlations are computed on results **already retrieved**. Finding 5
   shows retrieval eliminates 97.8% of the catalog before ranking runs. A modest
   volume-to-rank correlation among 8 survivors says nothing about what volume
   did to the other 15,000.
2. The report's own scope note states the snapshot formula is a reference
   implementation and that production has since changed. This is direct evidence
   of that drift.

**Finding 6 complicates the report's framing and should be reported as such.**
Concentration does not translate into a single discovery outcome. In the most
concentrated market it produces tight volume-rank coupling *and* robust
retrieval. In a middling one it produces neither.

---

## What this study does not show

- **CDP's formula stays unpublished.** Finding 2 infers association from 393
  observations. Not causal, and a signal absent from the API cannot be tested.
- **AgentCash's `score` is not fully decomposed.** Published signals are inputs;
  the combining function is not given.
- **Technical queries are fitted to incumbents by construction**, as
  pre-registered. They are mined from top-volume merchants' own descriptions and
  serve as the incumbent's *best case* — a control, not a neutral probe.
  Paraphrasing does not remove this; it measures how much of the advantage
  depends on the buyer's vocabulary. Finding 1 is that measurement.
- **Casual phrasings are the author's.** One plausible rendering of a plain
  buyer, not a sample of real agent traffic.
- **46 queries is a probe, not a census.** The 2.151% coverage figure is a
  property of this query set.
- **AgentCash coverage is uneven** — 23 technical but only 4 casual queries, per
  the approved protocol. E3's casual rows rest on four comparisons.
- **One instant.** Collected 2026-08-19. CDP recomputes ranking every 6 hours
  per its own docs; the catalog moved 15,101 → 15,109 during this session.
- **Small market.** Median 3 calls per surfaced result; 191 of 404 at ≤2 calls.
  Correlations over numbers this thin are real but fragile.
- **x402scan excluded.** No public JSON API — `/api/resources`, `/api/search`
  and tRPC all 404.

---

## Reproducing

```bash
npm run rank:collect                                     # live, non-deterministic
npm run rank:analyze -- data/rank-experiment-<date>.json  # pure, deterministic
```

| artifact | what it is |
| --- | --- |
| `scripts/queries.ts` | 46 queries, tagged by category / register / pair |
| `scripts/rank-experiment.ts` | CDP collector |
| `scripts/rank-analyze.ts` | six analyses, no network |
| `data/rank-experiment-2026-08-19.json` | raw CDP results, verbatim |
| `data/agentcash-2026-08-19.json` | AgentCash sidecar (MCP-collected) |
| `data/rank-findings-2026-08-19.json` | computed findings |
| `docs/v2-research-pre.md` | the pre-registered protocol |

v1 artifacts are retained under `data/v1-archive/`. v2 did not overwrite them.

### Deviations from the pre-registered protocol

- The protocol headline said "24 intents / 48 queries"; the approved tables
  always contained **23 intents / 46 queries** (6+6+6+5). Arithmetic slip in the
  prose, corrected in the doc. No query was added or removed.
- AgentCash casual coverage came to 4 queries rather than the "12" the protocol
  proposed, one per category. Noted as a limitation above.
