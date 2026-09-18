# Number-swap punch list — July 2026 → September 2026

**Scope.** Numbers, figures, and the sentences that carry a number inside the prose. No new narrative, no July-vs-September comparison, no new sections. Every September value below was read directly from `data/analysis-results.json`, `data/raw-data.json`, `claims.json` and `src/ranker.ts` on branch `refresh/2026-09-09` and recomputed independently, not copied from the builder's summary.

**Source of truth.** Snapshot `collectedAt` `2026-09-09T08:09:16.700Z`. 2,252 merchants, 13 categories, 42,201 resources. Four analysed categories: 839 merchants.

**How to use this.** Part 1 is mechanical — find the string, swap the number, done. Part 2 is the ~14 places where the sentence around the number stops being true and the wording has to move with it; each has a proposed replacement that stays inside the September-only scope. Part 3 is the figures. Part 4 is the two things that need a decision from you rather than an edit. Part 5 lists what does *not* change, so you don't touch it by reflex.

---

## Part 1 — Straight number swaps

### 1.1 Executive Summary (callout)

Nothing to swap. The only number is "top 3 merchants take 9 of every 10 payments" — Data & Enrichment is now 95.4%, so it still reads true. See Part 2 §2.1 for the one exec-summary sentence that *does* break.

### 1.2 Section 2.4 — Merchant Z's position

| Current text | July | September |
|---|---|---|
| "Ranker scores nonetheless differ by 0.18 to 0.24 points." | 0.18–0.24 | **0.21–0.30** (score gaps: 0.2288 / 0.2972 / 0.2059 / 0.2133) |

The other two bullets in this block are Part 2 rewrites (§2.2, §2.3).

### 1.3 Section 3 — Scope of the research

| Location | July | September |
|---|---|---|
| "collected `2026-07-25`" | 2026-07-25 | **2026-09-09** |
| "around 1,212 merchants across 13 categories" | 1,212 / 13 | **2,252 / 13** |
| Crypto & DeFi (n) | 303 | **497** |
| AI & Agents (n) | 128 | **194** |
| Data & Enrichment (n) | 34 | **91** |
| Finance & Markets (n) | 31 | **57** |
| Grey callout: "496 of the catalog's 1,212 merchants" | 496 / 1,212 | **839 / 2,252** |
| Grey callout: "8,165 catalog resources" | 8,165 | **18,555** |
| Grey callout: "\$52,414.65 in 30-day settled volume" | \$52,414.65 | **\$38,735.11** |

### 1.4 Section 4.1 — Volume Concentration (main table)

| Category | Merchants | 30d Volume | 30d Txs | Gini | HHI | Top-3 Share |
|---|---|---|---|---|---|---|
| Crypto & DeFi | 303 → **497** | \$49,844.80 → **\$34,673.65** | 45,290 → **62,863** | 0.9235 → **0.8975** | 816 → **400** | 42.2% → **28.1%** |
| AI & Agents | 128 → **194** | \$916.61 → **\$1,014.46** | 13,912 → **18,766** | 0.9524 → **0.9630** | 1,841 → **2,440** | 65.3% → **77.2%** |
| Data & Enrichment | 34 → **91** | \$1,020.12 → **\$2,166.29** | 20,244 → **69,911** | 0.9244 → **0.9766** | 6,798 → **8,310** | 91.2% → **95.4%** |
| Finance & Markets | 31 → **57** | \$633.11 → **\$880.70** | 2,614 → **2,175** | 0.7809 → **0.7371** | 1,700 → **783** | 66.5% → **37.4%** |

### 1.5 Section 4.1 — "Understanding the parameters" bullets

| Current text | July | September |
|---|---|---|
| "Every category here falls between 0.78 and 0.95" | 0.78–0.95 | **0.74 and 0.98** |
| "Data & Enrichment scores 6,798" | 6,798 | **8,310** |
| "the top three merchants collect 91.2% of every payment" | 91.2% | **95.4%** |
| "The remaining thirty-one merchants divide what is left, which is under nine per cent." | 31 / <9% | **eighty-eight merchants** / **under five per cent** |

### 1.6 Section 4.1 — Real-World Merchant Example

| Field | July | September |
|---|---|---|
| StableEnrich transactions | 16,625 | **63,684** |
| StableEnrich distinct buyers | 841 | **695** |
| StableEnrich category share | 82% | **91.1%** |
| Second-largest seller | Linked Panda | **Google Trends SEO Keyword Data** |
| — its transactions / buyers | 1,194 / 54 | **1,925 / 22** |
| — its category share | 5.9% | **2.8%** |
| "StableEnrich sells 13.9 times more than the merchant directly behind it" | 13.9× | **33.1×** |
| "The gap between first and second place (15,431 transactions)" | 15,431 | **61,759** |
| "larger than the combined sales of all thirty-three other merchants (3,619)" | 33 / 3,619 | **ninety other merchants (6,227)** |
| Otto AI transactions / buyers | 9,132 / 469 | **7,764 / 776** |
| Otto AI category share | 20.2% | **12.4%** |
| "a category containing 303 merchants" | 303 | **497** |

Otto AI is still the largest seller in Crypto & DeFi by transaction count, so that framing survives.

### 1.7 Section 4.2 — Quartile table (Data & Enrichment)

| Quartile | Rank range | Mean score | Volume | Buyer div. | Reliability | Listing quality | Recency |
|---|---|---|---|---|---|---|---|
| Q1 | 1–9 → **1–23** | 0.5319 → **0.4736** | 0.2978 → **0.2409** | 0.4552 → **0.3606** | 0.5000 | 0.8264 → **0.7561** | 1.0000 → **0.9913** |
| Q2 | 10–18 → **24–46** | 0.4460 → **0.3781** | 0.1779 → **0.1049** | 0.3208 → **0.2027** | 0.5000 | 0.7975 → **0.7364** | 1.0000 |
| Q3 | 19–27 → **47–69** | 0.3953 → **0.3346** | 0.0933 → **0.0662** | 0.1950 → **0.1351** | 0.5000 | 0.8950 → **0.7364** | 1.0000 → **0.9261** |
| Q4 | 28–34 → **70–91** | 0.3434 → **0.2677** | 0.0524 → **0.0413** | 0.1093 → **0.0934** | 0.5000 | 0.8294 → **0.6388** | 0.9714 → **0.7136** |

### 1.8 Section 4.2 — Gap-decomposition table

| Category | Volume | Buyer diversity | Reliability | Listing quality | Recency |
|---|---|---|---|---|---|
| Crypto & DeFi | 43.6% → **36.6%** | 42.2% → **36.9%** | 0% | 13.2% → **10.4%** | 0.9% → **16.0%** |
| AI & Agents | 35.7% → **24.5%** | 34.7% → **22.4%** | 0% | 16.9% → **13.4%** | 12.7% → **39.7%** |
| Data & Enrichment | 52.1% → **38.8%** | 45.9% → **32.4%** | 0% | −0.2% → **8.6%** | 2.3% → **20.2%** |
| Finance & Markets | 50.3% → **28.7%** | 43.3% → **32.4%** | 0% | 1.5% → **−0.3%** | 4.8% → **39.3%** |

Reliability stays at exactly 0% in all four. That column is untouched.

### 1.9 Section 4.2 — "Breakdown of numbers" bullets

| Current text | July | September |
|---|---|---|
| "In Data & Enrichment that is ranks 1–9, 10–18, 19–27 and 28–34." | — | **1–23, 24–46, 47–69 and 70–91** |
| "falls from 0.5319 in Q1 to 0.3434 in Q4, a drop of 0.1885, or roughly a third" | 0.5319 / 0.3434 / 0.1885 | **0.4736 / 0.2677 / 0.2059** — still "roughly a third"? No: it is **44%**. See Part 2 §2.7. |
| "In a 34-merchant category" | 34 | **91** |
| "volume 0.2978 → 0.0524, buyer diversity 0.4552 → 0.1093" | — | **volume 0.2409 → 0.0413, buyer diversity 0.3606 → 0.0934** |

### 1.10 Section 4.3 — Ceiling-vs-floor table

| Category | Day-one ceiling | Top-3 mean | Gap |
|---|---|---|---|
| Crypto & DeFi | 0.3250 *(unchanged)* | 0.6577 → **0.6504** | 0.3327 → **0.3254** |
| Data & Enrichment | 0.3250 | 0.5877 → **0.5951** | 0.2627 → **0.2701** |
| AI & Agents | 0.3250 | 0.5561 → **0.5489** | 0.2311 → **0.2239** |
| Finance & Markets | 0.3250 | 0.5388 → **0.5366** | 0.2138 → **0.2116** |

The weights are byte-identical to July (0.40 / 0.25 / 0.05 / 0.15 / 0.15), so the whole component table and the 0.3250 ceiling stand exactly as written.

### 1.11 Section 4.3 — "Breakdown of numbers" and takeaways

| Current text | July | September |
|---|---|---|
| "ranges from 0.5388 in Finance & Markets to 0.6577 in Crypto & DeFi" | — | **0.5366 … 0.6504** |
| "The smallest gap anywhere is 0.2138, in Finance & Markets." | 0.2138 | **0.2116** |
| Takeaway 3: "The smallest — Finance & Markets at 0.2138" | 0.2138 | **0.2116** |
| Takeaway 4: "Of the 77 zero-transaction merchants" | 77 | **79** |
| §5.1 closing line: "the smallest newcomer-to-leader gap from Section 4.3 — 0.2138" | 0.2138 | **0.2116** |

### 1.12 Section 4.3 — Real-World Merchant Example

| Field | July | September |
|---|---|---|
| Example 1 merchant | SentEdge Idea Machine (AI & Agents) | **Suede Agent Studio** (Crypto & DeFi) |
| — listing quality / recency | 1.0000 / 1.0000 | **0.8099 / 1.0000** |
| — score | 0.3250 | **0.2965** |
| — rank | #51 of 128 | **#312 of 497** |
| Example 2: Open Source Filings — listing quality | 0.9722 | **0.8096** |
| — score | 0.3208 | **0.2964** |
| — rank | #30 of 31 | **#47 of 57** |
| Example 3 merchant (category rank #1) | Stock Trends Market Intelligence | **Arkham x402** |
| — rank / transactions / buyers | #1 of 31 / 782 / 51 | **#1 of 57 / 393 / 54** |
| — score | 0.5952 | **0.5810** |
| — its listing quality | 0.9136 | **0.7651** |
| — "What separates them is 782 transactions" | 782 | **393** |

Example 2 is the same merchant record, still zero-transaction, still in Finance & Markets. Examples 1 and 3 need the substitutions above — Part 2 §2.10 and §2.11 cover the sentences.

### 1.13 Section 6 — Limitations

| Current text | July | September |
|---|---|---|
| "paid activity of around \$52,414.65 only over thirty days" | \$52,414.65 | **\$38,735.11** |
| "***crypto & defi*** holds 95.1% of that" | 95.1% | **89.5%** |
| "the other three categories split roughly \$2,600 between them" | ~\$2,600 | **roughly \$4,060** |
| "Data & Enrichment, for instance, holds 34 merchants in total" | 34 | **91** |
| "that is seven to nine merchants per group" | 7–9 | **22–23** |
| "of the 496 merchants in those four categories, 77 made no sale at all" | 496 / 77 | **839 / 79** |

Two sentences in this section break rather than swap — Part 2 §2.13 and §2.14.

### 1.14 Appendix A.1 — Artifacts

| File | Bytes: July → September | September SHA-256 |
|---|---|---|
| `data/raw-data.json` | 16,834,150 → **34,694,123** | `cc59783f3c1b90a6b419e0357342ca2545c009c9fb6a067535289321b59a5760` |
| `data/analysis-results.json` | 40,993 → **81,685** | `ccffd18f43da822b98f4ce73ac83e8040ee4f23a70ed345325cd1e504234de4f` |
| `data/recut-results.json` | 14,693 → **14,817** | `6d2d39f93fea6dd7492eaf2df2bc85a495e204e7839dad58486641948aacdc0e` |
| `data/cdp-probes.json` | 27,440 → **27,440 (July file, unchanged)** | `6b81b2313f0301de3885f84ed76741da2f18aa2d299edc4004a3d06834ae54e7` |
| `claims.json` | 40,366 → **40,195** | `090dff8a86b6209888d814af2e8a2484906ef3f5a0c0ea26a2ad6a11382c3dec` |
| `src/ranker.ts` | 7,435 → **9,354** | `a835bf5632aa0405fa6096b1da722da6b1eab611e3e72146aacf0948f5b3d95c` |

Row description for `raw-data.json`: "collected 2026-07-25T11:41:43.541Z. 1,212 merchants, 13 categories, 26,256 resources" → **"collected 2026-09-09T08:09:16.700Z. 2,252 merchants, 13 categories, 42,201 resources"**.

New rows to add — `src/ranker.ts` alone no longer describes the formula:

| File | Bytes | SHA-256 |
|---|---|---|
| `src/taxonomy.ts` | 7,497 | `d6efaedec815b57422dd7b90f0ac7ee1f0946d8f03c657b60ad5b6d8f7d6dbc9` |
| `src/description-quality.ts` | 7,322 | `113df0f26dc34c12f32a5cf20c525aba5bb654e58d027cbb81ebdb983d62b23d` |
| `src/tag-quality.ts` | 4,896 | `dd09a0f4754fbbe47962c91699e5040a7c4ad592da2cab64343aaca331a84e73` |
| `src/service-name-quality.ts` | 1,862 | `572a04b1ebde9c3b021ac3bdd4261b378b09263715dce68e7288093dbbba0633` |
| `data/probes-2026-09-09.json` | 39,093 | `14ba704f4c7603155926ec474128de5444c5705479ea085afb44adbcf38a999a` |

`cdp-probes.json` is the one artifact still dated July. A fresh probe exists at `data/probes-2026-09-09.json` but was not substituted. One line in A.1 has to say which one the report stands on. Cheapest honest fix: keep both rows, and change the `cdp-probes.json` description from "Live discovery probes from the 2026-07-25 run" to note it is retained from July and superseded by the dated September file.

### 1.15 Appendix A.2 — Source-code references

| Symbol | Line: July → September |
|---|---|
| `RANKER_WEIGHTS` | 25 → **38** |
| `computeRankerScore` | 88 → **105** |
| `computeScoreBreakdown` | 101 → **118** |
| `computeReliability` | 139 → **157** |

Vendored commit: `5b327e0` → **`eca0195`** (full: `eca01953419a51d81e3838530ad255f2b3538901`).

Equivalence table — every cell changes:

| Component | July | September |
|---|---|---|
| `volumeSignal` | 1,132 / 1,132 | **2,252 / 2,252** |
| `buyerDiversity` | 1,132 / 1,132 | **2,252 / 2,252** |
| `reliability` | 1,132 / 1,132 | **2,252 / 2,252** |
| `listingQuality` | 1,132 / 1,132 | **2,252 / 2,252** |
| `recency` | 1,127 / 1,132 | **2,252 / 2,252** |

Table lead-in "across the 1,132 merchants that carry one" → **"across all 2,252 merchants"**.

### 1.16 Appendix A.3

"The Data & Enrichment quartiles used throughout are 9 / 9 / 9 / 7 merchants." → **23 / 23 / 23 / 22**.

### 1.17 Appendix A.5

"The 70–98% range is re-derived from `analysis-results.json`" → **47–74%**.

---

## Part 2 — Sentences that go false and must be reworded

Fourteen places. Each replacement stays September-only: no comparison to July, no new claim.

### 2.1 Executive Summary — Core Finding (and §4.2 Core Insight, §2.4)

The "70–98%" figure appears in five places and is now **46.9–73.6%**. Every occurrence:

1. §2.4 bullet: "Transaction volume and buyer diversity account for 70–98% of that gap, and 86–98% in three of the four categories."
   → **"Transaction volume and buyer diversity account for 47–74% of that gap, and above 70% in two of the four categories."**
2. §4.2 Figure 4.4 caption: "Volume and buyer diversity account for 70.4–98.0% of the gap"
   → **"account for 46.9–73.6% of the gap"**
3. §4.2 bullet 6: "Volume and buyer diversity together account for 70–98% of it: 85.9%, 70.4%, 98.0% and 93.6% across the four categories, with AI & Agents the sole case below 86%."
   → **"Volume and buyer diversity together account for 47–74% of it: 73.6%, 46.9%, 71.2% and 61.1% across the four categories, with AI & Agents the sole case below half."**
4. §4.2 Core Insight callout: "Volume and buyer diversity explain 70–98% of the top-to-bottom score gap"
   → **"explain 47–74% of the top-to-bottom score gap"**
5. Appendix A.5 (already listed at §1.17).

### 2.2 §2.4 bullet — the listing-quality inversion

Current: *"Listing quality is near-identical between them. In Data & Enrichment the bottom quartile scores marginally higher than the top — 0.8294 against 0.8264."*

September reverses this: Q1 **0.7561** against Q4 **0.6388**. The top quartile is better documented by 0.1173.

Replacement: **"Listing quality separates them by far less than rank does. In Data & Enrichment the top quartile scores 0.7561 against the bottom's 0.6388 — a 0.1173 spread against a 0.2059 spread in score."**

### 2.3 §4.1 takeaway 2 — the Gini floor

Current: *"All four categories exceed Gini 0.78."* Finance & Markets is **0.7371**.

Replacement: **"All four categories exceed Gini 0.73, despite differing in size by nearly an order of magnitude."** (Population range is now 57–497, not two orders of magnitude.)

### 2.4 §4.1 takeaway 3 — the monopoly line

Current: *"3 merchants out of 34 take nine of every ten payments in this category."*

Replacement: **"3 merchants out of 91 take more than nine of every ten payments in this category."** (95.4%.)

### 2.5 §4.1 takeaway 4 — "3 of the 4 categories"

Current: *"3 of the 4 categories basically sit at the level of national wealth inequality… Ginis above 0.92."* September Ginis: 0.8975, 0.9630, 0.9766, 0.7371. **Two** clear 0.92.

Replacement: **"2 of the 4 categories sit at the level of national wealth inequality. Ginis above 0.96 are the range recorded for wealth distribution in the most unequal economies on earth."**

### 2.6 §4.1 takeaway 5 — Crypto & DeFi is no longer the outlier it was

Current: *"Crypto & DeFi category has the worst spread of the four (Gini 0.9235) and the mildest single-firm dominance (HHI 816)."* In September Crypto has neither the worst spread (that is Data & Enrichment at 0.9766) nor merely the mildest dominance — it has the lowest HHI of the four at **400**.

Replacement: **"Data & Enrichment has the worst spread of the four (Gini 0.9766) and by far the heaviest single-firm dominance (HHI 8,310). Crypto & DeFi, the largest category, is the least dominated (HHI 400)."**

### 2.7 §4.2 bullet 2 — "roughly a third"

Current: *"It falls from 0.5319 in Q1 to 0.3434 in Q4, a drop of 0.1885, or roughly a third."* September: 0.4736 → 0.2677, a drop of 0.2059 — **44%**.

Replacement: **"It falls from 0.4736 in Q1 to 0.2677 in Q4, a drop of 0.2059, or roughly 44%."**

### 2.8 §4.2 bullet 3 — listing quality by quartile

Current three lines:
- *"Q1 scores 0.8264. Q4 scores 0.8294."*
- *"The bottom quarter is documented marginally better than the top."*
- *"Q3 scores 0.8950, the highest of any quartile in the category, and still ranks below both Q1 and Q2."*

All three invert. September: Q1 0.7561, Q2 0.7364, Q3 0.7364, Q4 0.6388 — monotonically declining, Q1 highest.

Replacement: **"Q1 scores 0.7561. Q4 scores 0.6388. The spread across all four quartiles is 0.1173, against a score spread of 0.2059 — documentation moves with rank, but at roughly half its rate, and Q2 and Q3 are tied at 0.7364 despite twenty-three rank places between them."**

This is the largest single edit in the refresh. The claim "documentation is unrelated to rank" softens to "documentation moves far less than rank" in this one category. It is still a number-driven edit — but read it before you accept it.

### 2.9 §4.2 Figure 4.3 caption

Current: *"Mean ranker score falls 0.1885 from Q1 to Q4 while mean listing quality stays flat: Q4 sits 0.0030 above Q1, and the best-documented quartile in the category is Q3."*

Replacement: **"Mean ranker score falls 0.2059 from Q1 to Q4 while mean listing quality falls 0.1173, with Q2 and Q3 tied at 0.7364."**

### 2.10 §4.2 takeaways 2, 3 and 4 + Core Insight

- Takeaway 2: *"…and in the most concentrated category they are marginally worse."* → the negative case moved to Finance & Markets (**−0.3%**). Replacement: **"…and in Finance & Markets they are marginally worse."**
- Takeaway 3: *"Listing quality accounts for at most 16.9% of the top-to-bottom gap anywhere in the dataset, and runs negative in Data & Enrichment."* → **"at most 13.4% … and runs negative in Finance & Markets."**
- Takeaway 4: *"three of the four documentation signals still favour the bottom quartile."* → September primary re-cut for Data & Enrichment: input schema 100/100/100/100 (tied), output example 87 / 82.6 / 78.3 / 40.9 (favours top), description length 190.3 / 231.2 / 232.6 / 200.6 (favours bottom), tag count 4.48 / 4.26 / 4.57 / 4.86 (favours bottom). Replacement: **"two of the four documentation signals still favour the bottom quartile, one is tied, and one favours the top."**
- Core Insight callout: *"documentation explains at most 16.9%, and in the most concentrated category it runs negative."* → **"at most 13.4%, and in Finance & Markets it runs negative."**
- §4.2 bullet 6 sub-bullets: *"Listing quality accounts for at most 16.9% anywhere, and −0.2% in Data & Enrichment."* → **"at most 13.4% anywhere, and −0.3% in Finance & Markets."**

### 2.11 §4.2 Real-World Merchant Examples — "1.0000" no longer exists

No merchant in the four categories reaches listing quality 1.0000. The maximum anywhere is **0.9253**. Every "listing quality 1.0000 — the maximum the composite can produce" line has to go.

| # | July | September replacement |
|---|---|---|
| 1 | basescout-feed — LQ 1.0000, Crypto & DeFi, #139 of 303, 1 transaction | **Honeyguide Verified Router** — LQ **0.9077**, the best-documented merchant in Crypto & DeFi, ranked **#250 of 497** on **3** settled transactions |
| 2 | Business Change Intelligence API — LQ 1.0000, Q4 of Data & Enrichment, #29 of 34, "out-documents every merchant in Q1" | **Penny API** — LQ **0.8536**, sitting in Q4 of Data & Enrichment at rank **#85 of 91**. ⚠️ It out-documents the Q1 *average* (0.7561) and all but one Q1 merchant, not every one — Domain Health Check API at rank #17 scores 0.8610. Sentence must read **"better documented than the average of its category's entire top quartile"** |
| 3 | Pre-Trade Intelligence Hub — LQ 1.0000, Finance & Markets, #29 of 31, 3 transactions from 1 buyer | **Same merchant.** LQ **0.8416**, rank **#55 of 57**, still 3 settled transactions from a single buyer |

### 2.12 §4.3 takeaway 4 — the ceiling is no longer observed exactly

Current: *"Of the 77 zero-transaction merchants across the four categories, not one scores above 0.3250. The highest observed is exactly 0.3250. The ceiling is not a theoretical construct; it is where these merchants actually sit."*

The structural half survives — 0 of **79** exceed 0.3250. The observational half fails: the maximum is **0.2965**.

Replacement: **"Of the 79 zero-transaction merchants across the four categories, not one scores above 0.3250. The highest observed is 0.2965, which is below the ceiling rather than on it — no merchant has filled every controllable field at once. The bound holds in the live data, and nothing reaches it."**

### 2.13 §4.3 Real-World Merchant Examples 1 and 3

**Example 1.** Current: *"SentEdge Idea Machine is the ceiling, observed exactly… Its score is 0.3250 — the computed ceiling, to four decimal places. It has done everything a merchant can do and landed precisely on the arithmetic maximum. It ranks #51 of 128."*

Replacement: **"Suede Agent Studio is the closest any merchant comes to the ceiling: listing quality 0.8099, recency 1.0000, zero transactions and zero buyers, in Crypto & DeFi. It scores 0.2965 against a ceiling of 0.3250, and ranks #312 of 497. Three hundred and eleven merchants sit above it, and no action available to it closes that distance."**

**Example 3.** Current: *"Stock Trends Market Intelligence… rank #1 of 31, with 782 settled transactions from 51 buyers, scoring 0.5952. Note: its listing quality is 0.9136 — lower than Open Source Filings' 0.9722."*

Stock Trends is now **#2** of 57, and its listing quality (0.8692) is **higher** than Open Source Filings' (0.8096), so the comparison inverts. The category's rank #1 is **Arkham x402**, whose listing quality (**0.7651**) *is* lower than Open Source Filings'. Swap the merchant, not the point.

Replacement: **"Arkham x402 shows what it is measured against, in that same category: rank #1 of 57, with 393 settled transactions from 54 buyers, scoring 0.5810. Note: its listing quality is 0.7651 — lower than Open Source Filings' 0.8096. The best-ranked merchant in the category is less completely documented than the merchant sitting forty-six places below it. What separates them is 393 transactions."**

### 2.14 §6 Limitations — two sentences

**(a)** Current: *"If we split it into quartiles, that is seven to nine merchants per group. Move one merchant from one group to the next and the group average shifts completely."*

With 22–23 per group, one merchant no longer shifts an average "completely." Replacement: **"If we split it into quartiles, that is twenty-two to twenty-three merchants per group. A handful of merchants moving between groups still shifts the group average noticeably."**

**(b)** Current: *"Nine of the thirteen categories hold too few merchants to split into quartiles at all."*

Every one of the thirteen now holds at least 8 merchants, so none is literally too few. September distribution below 30 merchants: Payments & Commerce 44, Media & Content 24, Real-World Data 23, Web & Search 19, Security & Compliance 19, Fun & Games 10, Developer Tools 10, News & Social 8.

Replacement: **"Seven of the thirteen categories hold fewer than thirty merchants, too few for a quartile split to carry any weight."** ⚠️ The threshold is your call — I picked 30 because it is roughly where the July analysis drew the line. Say the word and I will use a different one.

---

## Part 3 — Figures

Five of the eight images in the report are data-driven. All five were regenerated on the refresh branch (`charts/`, timestamped 2026-09-09 08:23). They exist as files; they are **not** yet in Notion — Notion holds its own S3 copies, so each has to be re-uploaded in place.

| Figure | File | Status |
|---|---|---|
| 4.1 | `charts/d3a_lorenz_curves.png` | Regenerated — re-upload |
| 4.2 | `charts/d3b_data_enrichment_cliff.png` | Regenerated — re-upload. Caption says "the thirty-three merchants behind the leader" → **ninety** |
| 4.3 | `charts/d4_quartile_score_vs_listing_quality.png` | Regenerated — re-upload. Caption rewrite at §2.9 |
| 4.4 | `charts/d5_gap_decomposition.png` | Regenerated — re-upload. Caption rewrite at §2.1 item 2 |
| 4.6 | `charts/d7_ceiling_and_gap.png` | Regenerated — re-upload |

Unchanged, conceptual, do not touch: Figure 2.1 (`d16_z_position.png`), the x402 purchase diagram (`d15_x402_purchase.png`), Figure 4.5 (`d9_circular_dependency.png`), and the Section 5 diagrams (`d12`, `d13`, `d14`).

---

## Part 4 — Two things that need your decision, not a swap

**4.1 The Pass 2 robustness claim now fails.**
`recut.robustness.directionHoldsUnderAllRules` is **`false`** in September (it was `true`). Appendix A.3 states *"The direction of the finding holds under all three, which is asserted as a claim rather than left as a statement"* — that sentence is now contradicted by the artifact it cites. §4.2 takeaway 4 leans on the same robustness.

I recomputed the cause independently. The sign of (Q4 − Q1) across the three aggregation rules, Data & Enrichment:

| Field | primary | pooled | max | Agree? |
|---|---|---|---|---|
| outputExamplePct | −46.1 | −35.7 | −50.4 | yes |
| meanDescriptionLength | +10.3 | +73.0 | **−39.2** | **no** |
| meanTagCount | +0.38 | +1.49 | +0.29 | yes |

The break is **`meanDescriptionLength` under the `max` rule**, not `meanTagCount` under `pooled` as the refresh doc's §4.6 states. The doc's conclusion is right and its stated cause is wrong — worth correcting there so you don't write the prose from it.

Options: (a) narrow the A.3 sentence to the two axes that do hold and name the one that does not; (b) drop the robustness sentence and let the claim stand on its own value. Both are honest. (a) is stronger and costs one sentence.

**4.2 `cdp-probes.json` is still the July file.** Covered at §1.14. Cite the fresh dated file, or add a line saying the probe record is retained from July. Pick one.

---

## Part 5 — What does *not* change

Do not touch any of this on reflex:

- **The whole thesis.** Volume concentration, the quality-rank disconnect, the cold-start trap. All three tests return the same verdict on a 69% larger population.
- **The ranking formula and all five weights** (0.40 / 0.25 / 0.05 / 0.15 / 0.15) — byte-identical. Section 3.2 stands as written.
- **The cold-start ceiling, 0.3250.** It depends only on the weights, so it is unchanged in the component table and in all four rows of the gap table.
- **The reliability column: exactly 0%** in every category, in both the quartile table and the decomposition. The constant 0.5 is unchanged.
- **`summary.allCategoriesExtremeGini` = true** and **`allCategoriesUnreachableCeiling` = true**. Both still pass.
- **Gini > 0.70 in all four categories** — Finance & Markets at 0.7371 still clears the extreme-inequality threshold, so §3.1's definition and takeaway 1 hold. Only the "0.78" floor in takeaway 2 moves.
- **HHI > 2,500 in Data & Enrichment only** — same as July (AI & Agents at 2,440 is just under, as 1,841 was). No sentence in the report claims otherwise; §3.1's definition and §4.1's note both stand.
- **Section 5** (all four proposals) — apart from the single `0.2138 → 0.2116` in §5.1.
- **Recency decay: 90 days to zero.** Unchanged, so §4.3's note stands.

### Not part of this refresh — still open from the iteration-2 review

Listed so you don't confuse them with September breakage. None is caused by the new data:

- **C-1** missing disclosure; **C-2 / C-3** the two CDP doc quotes that are no longer on the live pages
- **H-1** top-3 share is computed by transaction count, not rank position — the September figures inherit this
- **M-1** §4.3's "adds at most 0.035 at its 0.05 weight" — the increment is 0.025 (0.05 × 0.5), not 0.035
- **M-2** §2.2 references
- The "index-mediated discovery" qualifier (8 edits) and the intro three-category insert
- Repo housekeeping: commit the collector `iconUrl` patch in `decipher-ranker`, commit the `refresh/2026-09-09` branch, retire METHODOLOGY §4's reproduction-gap section (the equivalence limitation is now closed), fix METHODOLOGY §3's reliability wording
