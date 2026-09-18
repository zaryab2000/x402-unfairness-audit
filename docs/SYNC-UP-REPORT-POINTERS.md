# SYNC UP REPORT POINTERS

**Target document:** *The Unfairness Report — v2 (LOCAL-September)*
**Fetched:** 2026-09-09T10:01:45Z · read in full (all 1,003 lines)
**Old data:** snapshot `2026-07-25T11:41:43.541Z` — 1,212 merchants
**New data:** snapshot `2026-09-09T08:09:16.700Z` — 2,252 merchants
**Every September figure below is verified against a committed artifact on branch `refresh/2026-09-09`.** `npm run all` exits 0: 150 claims pass, 0 fail.

---

## How to read this document

Each section lists **outdated numbers** (a direct find-and-replace), then **outdated claims** (sentences whose logic broke, not just their digits), then **merchant counts**. Replacement values are given inline.

### ⚠️ Read this before editing anything

Five things are not simple number swaps. They change what a sentence can say:

1. **"All four categories exceed Gini 0.78" is now false.** Finance & Markets is **0.7371**.
2. **The Data & Enrichment listing-quality inversion is gone.** July's −0.2% is now **+8.55%**. The bottom quartile is no longer better documented than the top. *This is the report's most-quoted finding.*
3. **No merchant anywhere scores listing quality 1.0000.** The maximum in the whole 2,252-merchant catalog is **0.9253**. All three §4.2 "perfect listing" exhibits lose their headline number.
4. **No merchant sits exactly on the cold-start ceiling.** The highest zero-transaction score is **0.2965**, not 0.3250. "The ceiling is observed, not theoretical" is no longer true.
5. **The formula-independent control weakened.** `outputExamplePct` now favours the **top** quartile under all three rules. "Three of four documentation signals favour the bottom quartile" is false.

Point 2 has a diagnostic attached, and it matters for how you write the correction: scoring the September population with **July's own formula** yields **+0.0866**. The inversion died because the market grew from 34 to 91 merchants — **not** because the scoring formula changed. Do not attribute it to the formula.

---

## Executive Summary and Core Claims

### Outdated claims

| # | Current text | Status | Replacement |
|---|---|---|---|
| 1 | "In some cases, top 3 merchants take **9 of every 10** payments." | **Still true, one category only** | Data & Enrichment is now **95.4%** — stronger than July's 91.2%. Safe to keep; consider "more than 9 of every 10." |
| 2 | "Every single x402 marketplace ranks merchants on the basis of volume and unique buyers." | Unchanged | No edit. |
| 3 | Core finding 3 — "Rank is decided by sales history, not service quality" | **Weakened** | Volume+diversity now explain **47–74%** of the gap, down from 70–98%. Still the largest factor, but recency rose sharply. See §4.2. |

No numeric edits required in this section beyond the above.

---

## 2. The Root of all Problems (§2.4)

### Outdated numbers

| Current | Replace with | Source |
|---|---|---|
| "In Data & Enrichment the bottom quartile scores marginally higher than the top — **0.8294 against 0.8264**" | **0.6388 against 0.7561** — and the direction **reverses**: the top quartile is now better documented | `analysis-results.json` → D&E quartiles |
| "Ranker scores nonetheless differ by **0.18 to 0.24** points" | **0.2059 to 0.2972** | `gapAnalysis.scoreGap`, all four categories |
| "Transaction volume and buyer diversity account for **70–98%** of that gap, and **86–98% in three of the four** categories" | **46.9–73.6%**, and above 71% in three of the four | `volumePlusDiversityPct` |
| "Reliability … contributes exactly **0%** in every category" | **Unchanged — still exactly 0%** | Verified across all four |

### Outdated claims

- **The sentence "In Data & Enrichment the bottom quartile scores marginally higher than the top" must be rewritten, not renumbered.** In September the top quartile is better documented by 0.1173. The inversion no longer exists in this category.
- **Finance & Markets now carries the negative gap** (−0.0031 share, Q1 0.7735 vs Q4 0.7779). If you want to keep an inversion exhibit, **Finance & Markets is the category that now supplies it** — but the margin is tiny (0.0044) and it is *not* the most concentrated category, so the rhetorical force of "in the most concentrated category" is lost.
- "**86–98% in three of the four**" → the new spread is 46.9 / 61.1 / 71.2 / 73.6. **In AI & Agents, volume and buyer diversity together now explain less than half the gap.** That is a materially weaker version of the report's central mechanism claim and needs an honest restatement.

---

## 3. Methodology, Dataset, and Provenance

### Outdated numbers

| Current | Replace with |
|---|---|
| snapshot collected `2026-07-25` | `2026-09-09` |
| "around **1,212** merchants across 13 categories" | **2,252** merchants across **13** categories (category count unchanged) |
| ***Crypto & DeFi (303 merchants)*** | ***Crypto & DeFi (497 merchants)*** |
| ***AI & Agents (128)*** | ***AI & Agents (194)*** |
| ***Data & Enrichment (34)*** | ***Data & Enrichment (91)*** |
| ***Finance & Markets (31)*** | ***Finance & Markets (57)*** |
| "these 4 categories together hold **496** of the catalog's **1,212** merchants" | **839** of the catalog's **2,252** |
| "with **8,165** catalog resources" | **18,555** |
| "and **\$52,414.65** in 30-day settled volume" | **\$38,735.11** ← **note this went DOWN while merchants nearly doubled** |

### Outdated claims

- **Volume fell while the market grew.** Total 30-day settled volume across the four categories dropped **\$13,679.54** (−26.1%) even as merchant count rose 69%. Any sentence implying the market is growing in value needs care — it grew in *participants*, not dollars.
- §3.1 Gini text: "Values above 0.70 denote extreme inequality" — fine, keep. But see §4.1: one category now falls below 0.78.
- §3.2 formula, weights, and all five component descriptions: **unchanged.** `Score = 0.40·volume + 0.25·buyerDiversity + 0.05·reliability + 0.15·listingQuality + 0.15·recency` is still correct and still sums to 1.00.
- "**Reliability is held at a constant 0.5 for every merchant**" — **still true in effect**, but the mechanism changed. Production now averages per-resource `reliabilityScore`/`apiSuccessRate` and falls back to 0.5. Both columns are unpopulated for all 42,201 resources, so every merchant still gets exactly 0.5. Keep the sentence; the footnote in Appendix A.2 needs updating (see below).

---

## 4.1 Volume Concentration

### The main table — every cell changes

| Category | Merchants | 30d Volume | 30d Txs | Gini | HHI | Top-3 Share |
|---|---:|---:|---:|---:|---:|---:|
| Crypto & DeFi | ~~303~~ → **497** | ~~\$49,844.80~~ → **\$34,673.65** | ~~45,290~~ → **62,863** | ~~0.9235~~ → **0.8975** | ~~816~~ → **400** | ~~42.2%~~ → **28.1%** |
| AI & Agents | ~~128~~ → **194** | ~~\$916.61~~ → **\$1,014.46** | ~~13,912~~ → **18,766** | ~~0.9524~~ → **0.9630** | ~~1,841~~ → **2,440** | ~~65.3%~~ → **77.2%** |
| Data & Enrichment | ~~34~~ → **91** | ~~\$1,020.12~~ → **\$2,166.29** | ~~20,244~~ → **69,911** | ~~0.9244~~ → **0.9766** | ~~6,798~~ → **8,310** | ~~91.2%~~ → **95.4%** |
| Finance & Markets | ~~31~~ → **57** | ~~\$633.11~~ → **\$880.70** | ~~2,614~~ → **2,175** | ~~0.7809~~ → **0.7371** | ~~1,700~~ → **783** | ~~66.5%~~ → **37.4%** |

### Outdated claims — this subsection needs the most rewriting

| # | Current claim | Verdict | What to say instead |
|---|---|---|---|
| 1 | "**Every category here falls between 0.78 and 0.95**" | ❌ **FALSE** | New range is **0.7371 to 0.9766**. Finance & Markets falls below 0.78 and Data & Enrichment exceeds 0.95. |
| 2 | "**All four categories exceed Gini 0.78**, despite differing in size by two orders of magnitude" | ❌ **FALSE** | Three of four exceed 0.78. Finance & Markets is 0.7371. |
| 3 | "**3 of the 4 categories basically sit at the level of national wealth inequality.** Ginis above 0.92…" | ❌ **FALSE** | Only **two** now exceed 0.92 (AI & Agents 0.9630, Data & Enrichment 0.9766). |
| 4 | "**Crypto & DeFi** has the worst spread of the four (Gini 0.9235) and the mildest single-firm dominance (HHI 816)" | ❌ **FALSE on both halves** | Crypto & DeFi now has the **second-lowest** Gini (0.8975) and still the **lowest** HHI (**400**). The **worst spread is now Data & Enrichment (0.9766)**, which also has the highest HHI (8,310). Rewrite this bullet entirely. |
| 5 | "Data & Enrichment scores **6,798**… signature of a single merchant holding most of a market" | ✅ Direction holds | Update to **8,310** — the signature is stronger. |
| 6 | "3 merchants out of **34** take nine of every ten payments" | Number change | **3 merchants out of 91** take **95.4%** — now more than nineteen of every twenty. |
| 7 | "In Data & Enrichment the top three merchants collect **91.2%**… The remaining **thirty-one** merchants divide what is left, which is **under nine per cent**" | Numbers change | **95.4%**; the remaining **88** merchants divide **4.6%**. |
| 8 | "*US competition regulators treat any market scoring above 2,500 as highly concentrated*" — implied to cover several categories | ⚠️ Narrower | **Only two categories now exceed 2,500**: Data & Enrichment (8,310) and AI & Agents (2,440 — *below* the threshold). Strictly, **only Data & Enrichment** clears 2,500. Crypto & DeFi (400) and Finance & Markets (783) are far below. |

> **Important structural note.** Concentration **diverged** between July and September. Crypto & DeFi and Finance & Markets **deconcentrated sharply** (top-3 share −14.1pp and −29.1pp; HHI more than halved in both). AI & Agents and Data & Enrichment **concentrated further**. "Concentration is extreme in every category" is no longer supportable as a uniform statement — it is now a tale of two halves. Consider reframing as: concentration intensifies in the categories where a dominant seller already existed, and dissipates where none did.

### Real-World Merchant Examples (§4.1)

**1. StableEnrich** — still rank #1 in Data & Enrichment ✅

| Current | Replace with |
|---|---|
| "**16,625** settled transactions" | **63,684** |
| "from **841** distinct buyers" | **695** ← *buyers fell while transactions quadrupled* |
| "**82%** of the category's entire transaction count" | **91.1%** |

**2. Linked Panda** — ⚠️ **NO LONGER THE SECOND-LARGEST SELLER**

Linked Panda is now **rank 3** by rank position, and by transaction count it has fallen out of the top two entirely (543 tx, down from 1,194).

The new **#2 by transactions** is **Google Trends SEO Keyword Data** — 1,925 tx, 22 buyers, **2.8%** of the category, rank #2 of 91, score 0.5570, listing quality 0.8208.

| Current | Replace with |
|---|---|
| "**Linked Panda** is the second-largest seller" | **Google Trends SEO Keyword Data** |
| "**1,194** settled transactions from **54** distinct buyers — **5.9%** of the category" | **1,925** transactions from **22** buyers — **2.8%** of the category |
| "StableEnrich sells **13.9 times** more than the merchant directly behind it" | **33.1 times** more (63,684 ÷ 1,925) |
| "The gap between first and second place (**15,431** transactions)" | **61,759** transactions |
| "larger than the combined sales of all **thirty-three** other merchants (**3,619**)" | larger than all **90** other merchants combined (**6,227**) — a **10.2×** multiple |

*(For reference, third place is now **reefjaco**: 1,112 tx, 220 buyers, 1.6%.)*

**3. Otto AI** — ⚠️ **claim needs qualification**

Otto AI is still the biggest seller in Crypto & DeFi by transaction count, but it sits at **rank #2**, not #1. The rank-1 merchant is now **Compound interest** (5,648 tx, 693 buyers, 9.0% share).

| Current | Replace with |
|---|---|
| "**9,132** settled payments from **469** buyers" | **7,764** payments from **776** buyers |
| "**20.2%** of a category containing **303** merchants" | **12.4%** of a category containing **497** merchants |
| "it is the biggest seller in Crypto & DeFi by transaction count" | ✅ Still true — but note it ranks **#2**, because rank is score-based, not transaction-based. Either add that clarification or switch the exhibit to **Compound interest** (rank #1). |

---

## 4.2 The Listing-Quality & Ranking-Order Disconnect

### The quartile table — Data & Enrichment, every cell changes

Quartile sizes change from **9/9/9/7** to **23/23/23/22** (n rose 34 → 91).

| Quartile | Rank range | Mean score | Volume | Buyer div. | Reliability | Listing quality | Recency |
|---|---|---:|---:|---:|---:|---:|---:|
| Q1 | ~~1–9~~ → **1–23** | ~~0.5319~~ → **0.4736** | ~~0.2978~~ → **0.2409** | ~~0.4552~~ → **0.3606** | **0.5000** ✅ | ~~0.8264~~ → **0.7561** | ~~1.0000~~ → **0.9913** |
| Q2 | ~~10–18~~ → **24–46** | ~~0.4460~~ → **0.3781** | ~~0.1779~~ → **0.1049** | ~~0.3208~~ → **0.2027** | **0.5000** ✅ | ~~0.7975~~ → **0.7364** | **1.0000** ✅ |
| Q3 | ~~19–27~~ → **47–69** | ~~0.3953~~ → **0.3346** | ~~0.0933~~ → **0.0662** | ~~0.1950~~ → **0.1351** | **0.5000** ✅ | ~~0.8950~~ → **0.7364** | ~~1.0000~~ → **0.9261** |
| Q4 | ~~28–34~~ → **70–91** | ~~0.3434~~ → **0.2677** | ~~0.0524~~ → **0.0413** | ~~0.1093~~ → **0.0934** | **0.5000** ✅ | ~~0.8294~~ → **0.6388** | ~~0.9714~~ → **0.7136** |

### The gap-decomposition table — every cell changes

| Category | Volume | Buyer diversity | Reliability | Listing quality | Recency |
|---|---:|---:|---:|---:|---:|
| Crypto & DeFi | ~~43.6%~~ → **36.63%** | ~~42.2%~~ → **36.94%** | **0%** ✅ | ~~13.2%~~ → **10.37%** | ~~0.9%~~ → **16.02%** |
| AI & Agents | ~~35.7%~~ → **24.50%** | ~~34.7%~~ → **22.44%** | **0%** ✅ | ~~16.9%~~ → **13.40%** | ~~12.7%~~ → **39.66%** |
| Data & Enrichment | ~~52.1%~~ → **38.78%** | ~~45.9%~~ → **32.44%** | **0%** ✅ | ~~−0.2%~~ → **+8.55%** | ~~2.3%~~ → **20.23%** |
| Finance & Markets | ~~50.3%~~ → **28.65%** | ~~43.3%~~ → **32.40%** | **0%** ✅ | ~~1.5%~~ → **−0.31%** | ~~4.8%~~ → **39.26%** |

### Outdated claims — the heaviest rewrites in the report

| # | Current claim | Verdict | What to say instead |
|---|---|---|---|
| 1 | "**Q1 scores 0.8264. Q4 scores 0.8294. The bottom quarter is documented marginally better than the top.**" | ❌ **REVERSED** | Q1 **0.7561**, Q4 **0.6388**. The **top** quarter is now better documented, by 0.1173. |
| 2 | "**Q3 scores 0.8950, the highest of any quartile**, and still ranks below both Q1 and Q2" | ❌ **FALSE** | **Q1 is now the best-documented quartile (0.7561)**. Q2 and Q3 tie at 0.7364. Listing quality now declines monotonically with rank. **This removes the exhibit that Figure 4.3 was built around.** |
| 3 | "It falls from **0.5319** in Q1 to **0.3434** in Q4, a drop of **0.1885**, or roughly **a third**" | Numbers change | Falls from **0.4736** to **0.2677**, a drop of **0.2059**, or **43.5%** of Q1 — "roughly a third" becomes "well over two-fifths." |
| 4 | "In a **34-merchant** category that is the difference between page-one placement and never being rendered" | Number change | **91-merchant** category. |
| 5 | "volume **0.2978 → 0.0524**, buyer diversity **0.4552 → 0.1093**" | Numbers change | volume **0.2409 → 0.0413**, buyer diversity **0.3606 → 0.0934** |
| 6 | "**These are the only columns that move with rank.**" | ❌ **FALSE** | **Recency now moves strongly with rank too** (0.9913 → 0.7136 in D&E), and is the single largest gap component in two categories. |
| 7 | "Volume and buyer diversity together account for **70–98%**… **85.9%, 70.4%, 98.0% and 93.6%**, with AI & Agents the sole case below 86%" | ❌ Numbers and framing | **46.9–73.6%**: **73.57%** (CD), **46.94%** (AI), **71.22%** (DE), **61.05%** (FM). AI & Agents is now **below half**. |
| 8 | "Listing quality accounts for **at most 16.9%** anywhere, and **−0.2%** in Data & Enrichment" | Numbers change | At most **13.40%** (AI & Agents); **−0.31%** in **Finance & Markets** (the only negative). D&E is now **+8.55%**. |
| 9 | "**Reliability** — it reads 0.5000 in every quartile of every category" | ✅ **Unchanged** | No edit. |
| 10 | "Re-measured on raw catalog fields…, **three of the four documentation signals still favour the bottom quartile**" | ❌ **FALSE** | See the control table below. **Output-example rate now favours the TOP quartile under all three rules.** At most **two** signals favour the bottom, and only under the primary/pooled rules. |
| 11 | "**The result does not depend on the scoring formula.**" | ⚠️ **Weaker but salvageable** | The formula-independent control now **partially contradicts** the finding. Under `max`, description length also favours the top. Only tag count favours the bottom under all three rules. |
| 12 | Core Insight callout — "explain **70–98%**… documentation explains at most **16.9%**, and in the most concentrated category it runs **negative**" | ❌ All three figures wrong | "explain **47–74%**… documentation explains at most **13.4%**, and runs slightly negative only in **Finance & Markets**." |

### The formula-independent control (§4.2, "A check that does not use the formula")

Data & Enrichment, Q1→Q4, September:

| Rule | Field | July | September | Direction now |
|---|---|---|---|---|
| primary | inputSchemaPct | — | 100, 100, 100, 100 | tie |
| primary | outputExamplePct | 88.9, 66.7, 88.9, 57.1 | **87.0, 82.6, 78.3, 40.9** | **favours TOP** |
| primary | meanDescriptionLength | 130.3, 206, 259, 224.4 | **190.3, 231.2, 232.6, 200.6** | favours bottom |
| primary | meanTagCount | 3.89, 3.67, 4.78, 4.86 | **4.48, 4.26, 4.57, 4.86** | favours bottom |
| pooled | outputExamplePct | 84.3, 78.6, 97.1, 44.4 | **85.7, 73.3, 76.1, 50.0** | **favours TOP** |
| pooled | meanDescriptionLength | 102.4, 165, 222.5, 240.9 | **136.0, 226.0, 200.8, 209.0** | favours bottom |
| pooled | meanTagCount | 2.57, 4.04, 4.2, 4.89 | **3.43, 2.81, 4.34, 4.92** | favours bottom |
| max | outputExamplePct | 100, 66.7, 100, 57.1 | **91.3, 91.3, 78.3, 40.9** | **favours TOP** |
| max | meanDescriptionLength | 208.3, 293.9, 323.9, 224.4 | **266.5, 290.3, 281.5, 227.3** | **favours TOP** |
| max | meanTagCount | 4, 3.67, 5, 4.86 | **4.57, 4.65, 4.70, 4.86** | favours bottom |

**`recut.robustness.directionHoldsUnderAllRules` = `true` → `false`.** Appendix A.3 asserts this direction holds under all three rules. **It no longer does.** This is an editorial decision, not a value swap.

### Real-World Merchant Examples (§4.2) — ⚠️ all three lose their headline

**No merchant in the entire 2,252-merchant catalog scores listing quality 1.0000.** The maximum anywhere is **0.9253**. The new formula grades description quality, name specificity, tag relevance and icon presence rather than counting presence, so "a perfect listing" is no longer attainable. Every "listing quality 1.0000" claim must go.

**1. basescout-feed**

| Current | Replace with |
|---|---|
| "listing quality **1.0000** — the maximum the composite can produce" | listing quality **0.8184** |
| "ranks **#139 of 303**" | ranks **#466 of 497** |
| "on one settled transaction in thirty days" | ✅ still **1** transaction, 1 buyer |
| *(score, if cited)* | 0.3565 → **0.2542** |

**2. Business Change Intelligence API**

| Current | Replace with |
|---|---|
| "listing quality **1.0000**" | **0.8423** |
| "sitting in Q4 of Data & Enrichment at rank **#29 of 34**" | rank **#65 of 91** — still Q3/Q4 territory (Q3 is 47–69, so it is now in **Q3**, not Q4) |
| "**It out-documents every merchant in Q1** and ranks below all of them" | ❌ **FALSE.** Q1 mean listing quality is 0.7561, but individual Q1 merchants exceed 0.8423. This claim must be dropped or re-verified merchant-by-merchant. |
| tx / buyers | 1/1 → **2/2** |

**3. Pre-Trade Intelligence Hub**

| Current | Replace with |
|---|---|
| "listing quality **1.0000** in Finance & Markets" | **0.8416** |
| "at rank **#29 of 31**" | rank **#55 of 57** |
| "Three settled transactions from a single buyer" | ✅ still **3 tx, 1 buyer** |
| *(score, if cited)* | 0.3351 → **0.2214** |

**Suggested replacement exhibits** (worst-ranked merchant at the highest listing quality present in each category — the mechanical rule, since 1.0000 no longer exists):

| Category | Merchant | LQ | Rank | Score | tx / buyers |
|---|---|---:|---|---:|---|
| Crypto & DeFi | **Honeyguide Verified Router** | 0.9077 | #250 of 497 | 0.3504 | 3 / 1 |
| AI & Agents | **Browser Use** | 0.9253 | #16 of 194 | 0.4445 | 12 / 7 |
| Data & Enrichment | **scoop — LinkedIn email finder** | 0.8893 | #39 of 91 | 0.3716 | 4 / 2 |
| Finance & Markets | **OmniNexu Financial Data** | 0.8919 | #31 of 57 | 0.3521 | 129 / 12 |

---

## 4.3 The Cold-Start Ceiling

### Unchanged — do not edit ✅

The entire cold-start arithmetic table is **invariant** and verified:

- Weights sum **1.00**
- Ceiling **0.3250**
- Contributions: volume **0.0000**, buyer diversity **0.0000**, reliability **0.0250**, listing quality **0.1500**, recency **0.1500**
- "65% of a merchant's score" (volume 0.40 + diversity 0.25) — correct
- "Perfect documentation is worth 0.150" — correct
- "populating the reliability slot … adds at most 0.035" — correct

### Outdated numbers — the Top-3 mean / Gap table

| Category | Day-one ceiling | Top-3 mean | Gap |
|---|---|---|---|
| Crypto & DeFi | 0.3250 ✅ | ~~0.6577~~ → **0.6504** | ~~0.3327~~ → **0.3254** |
| Data & Enrichment | 0.3250 ✅ | ~~0.5877~~ → **0.5951** | ~~0.2627~~ → **0.2701** |
| AI & Agents | 0.3250 ✅ | ~~0.5561~~ → **0.5489** | ~~0.2311~~ → **0.2239** |
| Finance & Markets | 0.3250 ✅ | ~~0.5388~~ → **0.5366** | ~~0.2138~~ → **0.2116** |

> **Definition note:** `top3MeanScore` is computed over the three highest-**transaction** merchants, not the three highest-ranked. If you prefer the by-rank reading, the values are CD **0.6614**, AI **0.5820**, DE **0.5970**, FM **0.5413** — all slightly higher, so no claim weakens either way. Pick one and state it.

### Outdated claims

| # | Current claim | Verdict | What to say instead |
|---|---|---|---|
| 1 | "It ranges from **0.5388** in Finance & Markets to **0.6577** in Crypto & DeFi" | Numbers | **0.5366** to **0.6504** |
| 2 | "The smallest gap anywhere is **0.2138**, in Finance & Markets" | Numbers | **0.2116**, still Finance & Markets |
| 3 | "Of the **77** zero-transaction merchants across the four categories, not one scores above 0.3250" | Number; claim holds | **79** zero-transaction merchants; **still none above 0.3250** ✅ |
| 4 | "**The highest observed is exactly 0.3250.**" | ❌ **FALSE** | The highest is **0.2965**. **No merchant reaches the ceiling.** |
| 5 | "**The ceiling is not a theoretical construct; it is where these merchants actually sit.**" | ❌ **FALSE** | It is now a bound that nothing reaches. The structural claim (nothing exceeds it) survives; the observational claim does not. Rewrite as: *the ceiling is not merely a bound — no merchant with zero sales came within 0.03 of it.* |

> **Zero-transaction merchants by category** (new): Crypto & DeFi **5**, AI & Agents **73**, Data & Enrichment **0**, Finance & Markets **1**. Note **Data & Enrichment now has none** — which removes that category as a source of cold-start exhibits.

### Real-World Merchant Examples (§4.3) — ⚠️ the flagship exhibit breaks

**1. SentEdge Idea Machine — this exhibit no longer works**

The merchant still exists (`a88c43ee-bdbb-44dd-b164-5679d962b0dd`, AI & Agents, still 0 tx / 0 buyers), but:

| Current | September reality |
|---|---|
| "listing quality **1.0000**, recency **1.0000**" | listing quality **0.7236** |
| "Its score is **0.3250** — the computed ceiling, to four decimal places" | score **0.2835** — **no longer on the ceiling** |
| "It ranks **#51 of 128**" | ranks **#87 of 194** |
| name **"SentEdge Idea Machine"** | ⚠️ **the merchant no longer publishes a service name** — it is unnamed in the September catalog |

**The entire "is the ceiling, observed exactly" framing must be removed.** Nothing in the catalog lands on 0.3250. The closest is **Suede Agent Studio** (Crypto & DeFi, 0 tx, LQ 0.8099, score **0.2965**, rank #312 of 497).

**2. Open Source Filings** ✅ still valid, numbers change

| Current | Replace with |
|---|---|
| "listing quality **0.9722**" | **0.8096** |
| "It scores **0.3208**" | **0.2964** |
| "rank **#30 of 31**" | rank **#47 of 57** |
| "zero settled transactions" | ✅ still zero |

**3. Stock Trends Market Intelligence — ⚠️ no longer rank #1**

Finance & Markets rank #1 is now **Arkham x402** (393 tx, 54 buyers, score 0.5810, listing quality **0.7651**). Stock Trends has fallen to **#2**.

| Current | Replace with |
|---|---|
| "rank **#1 of 31**, with **782** settled transactions from **51** buyers, scoring **0.5952**" | **Arkham x402**: rank **#1 of 57**, **393** transactions from **54** buyers, scoring **0.5810** |
| "its listing quality is **0.9136** — lower than Open Source Filings' **0.9722**" | Arkham x402's listing quality is **0.7651** — still **lower** than Open Source Filings' **0.8096** ✅ **the contrast survives** |
| "What separates them is **782** transactions" | **393** transactions |

> ✅ **Good news:** the rhetorical point of this exhibit — *the best-ranked merchant is less well documented than a zero-sale merchant far below it* — **still holds in Finance & Markets**, and also now in **Crypto & DeFi** (rank-1 *Compound interest* LQ 0.8361 vs zero-tx *Hedgehog Edge* LQ 0.8394). It no longer holds in AI & Agents, and Data & Enrichment has no zero-tx merchants left.

---

## 5. Toward Quality-First Discovery

### Outdated numbers

| Current | Replace with |
|---|---|
| §5.1: "the smallest newcomer-to-leader gap from Section 4.3 — **0.2138** — does not shrink at all" | **0.2116** |
| §5.1: "Populating reliability perfectly lifts a newcomer's contribution from **0.025 to 0.050**" | ✅ **Unchanged** — arithmetic is weight-based |

### Outdated claims

- §5.1 opening: "**x402 merchant's service reliability is not given any weight in its ordering**" — ✅ still true.
- §5.2 `SlotScore` formula and §5.3 `boost(i)` formula — ✅ unchanged, these are proposals not measurements.
- §5.2: "in a **20-result** response, three slots go to new merchants" — ✅ unchanged (design choice).
- §5.3 CDP quotation — ✅ unchanged.
- **No structural rewrite needed in Section 5.** It is argument, not data. Only the single gap figure above changes.

---

## 6. Limitations

### Outdated numbers

| Current | Replace with |
|---|---|
| "even the 4 major categories had paid activity of around **\$52,414.65**" | **\$38,735.11** |
| "While ***crypto & defi*** holds **95.1%** of that" | **89.5%** |
| "the other three categories split roughly **\$2,600** between them" | roughly **\$4,061** (AI & Agents \$1,014.46 · Data & Enrichment \$2,166.29 · Finance & Markets \$880.70) |
| "Data & Enrichment holds **34** merchants in total" | **91** |
| "If we split it into quartiles, that is **seven to nine** merchants per group" | **22 to 23** merchants per group |
| "**Nine of the thirteen** categories hold too few merchants to split into quartiles at all" | ✅ **Still nine of thirteen** — now verifiable directly from the snapshot, since all 13 categories are collected |
| "of the **496** merchants in those four categories, **77** made no sale at all" | of the **839** merchants, **79** made no sale |

### Outdated claims

- "**Move one merchant from one group to the next and the group average shifts completely.**" ⚠️ **Materially weaker.** With 22–23 merchants per quartile instead of 7–9, single-merchant sensitivity is roughly a third of what it was. This limitation should be softened — it is now a genuinely stronger dataset.
- "**The market is too small to support a fine-grained analysis**" — still fair, but the population grew 86% and resources 61%. Consider re-toning.
- Wash-trading subsection (external citations: Visa/Artemis \$15.0M, 86% Solana, 136.7M settlements, \$44.1M) — ✅ **all external, unchanged, no edit needed.**

---

## Appendix A — Evidence Log

### A.1 Artifacts table

| File | Bytes | Change |
|---|---|---|
| `data/raw-data.json` | ~~16,834,150~~ → **34,694,123** | collected ~~2026-07-25T11:41:43.541Z~~ → **2026-09-09T08:09:16.700Z**; ~~1,212~~ → **2,252** merchants, 13 categories ✅, ~~26,256~~ → **42,201** resources |
| `data/analysis-results.json` | ~~40,993~~ → **81,685** | |
| `data/recut-results.json` | ~~14,693~~ → **14,817** | |
| `data/cdp-probes.json` | **27,440** ✅ | ⚠️ **Still the July file.** Either cite the fresh `data/probes-2026-09-09.json` (39,093 bytes) or add a line stating the probe record is retained from the July run. |
| `claims.json` | ~~40,366~~ → **40,195** | |

### A.1 SHA-256 block — replace entirely

```
cc59783f3c1b90a6b419e0357342ca2545c009c9fb6a067535289321b59a5760  data/raw-data.json
ccffd18f43da822b98f4ce73ac83e8040ee4f23a70ed345325cd1e504234de4f  data/analysis-results.json
6d2d39f93fea6dd7492eaf2df2bc85a495e204e7839dad58486641948aacdc0e  data/recut-results.json
6b81b2313f0301de3885f84ed76741da2f18aa2d299edc4004a3d06834ae54e7  data/cdp-probes.json   ← unchanged (July file)
a835bf5632aa0405fa6096b1da722da6b1eab611e3e72146aacf0948f5b3d95c  src/ranker.ts
```

**New files that must be added to A.1** — `src/ranker.ts` alone no longer describes the formula:

```
d6efaedec815b57422dd7b90f0ac7ee1f0946d8f03c657b60ad5b6d8f7d6dbc9  src/taxonomy.ts              (7,497 bytes)
113df0f26dc34c12f32a5cf20c525aba5bb654e58d027cbb81ebdb983d62b23d  src/description-quality.ts   (7,322 bytes)
dd09a0f4754fbbe47962c91699e5040a7c4ad592da2cab64343aaca331a84e73  src/tag-quality.ts           (4,896 bytes)
572a04b1ebde9c3b021ac3bdd4261b378b09263715dce68e7288093dbbba0633  src/service-name-quality.ts  (1,862 bytes)
```

### A.2 Source-code references

| Current | Replace with |
|---|---|
| "vendored at `src/ranker.ts`, taken from the production implementation at commit **`5b327e0`**" | commit **`eca0195`** |
| "the version live on the snapshot date, **not current `HEAD`, which has since been rewritten**" | ⚠️ **Now inverted.** The vendored copy **is** the current production formula as of the September snapshot. Rewrite this sentence — the caveat no longer applies. |
| `RANKER_WEIGHTS` line **25** | line **38** |
| `computeRankerScore` line **88** | line **105** |
| `computeScoreBreakdown` line **101** | line **118** |
| `computeReliability` line **157** — "Returns the constant 0.5 for every merchant" | ⚠️ Wording: production now averages `reliabilityScore`/`apiSuccessRate` and falls back to 0.5. **Both columns are unpopulated for all 42,201 resources**, so every merchant still receives exactly 0.5. The vendored copy reproduces this as a constant. State it as *constant in effect, by data rather than by code*. |

### A.2 Equivalence test table — all five rows change

| Component | Current | Replace with |
|---|---|---|
| `volumeSignal` | 1,132 / 1,132 | **2,252 / 2,252** |
| `buyerDiversity` | 1,132 / 1,132 | **2,252 / 2,252** |
| `reliability` | 1,132 / 1,132 | **2,252 / 2,252** |
| `listingQuality` | 1,132 / 1,132 | **2,252 / 2,252** |
| `recency` | **1,127** / 1,132 | **2,252 / 2,252** |

Preamble: "across the **1,132** merchants that carry one" → **2,252**.

> ⚠️ **Note on what 1,132 meant.** The July figure was not "merchants carrying a score breakdown" — it was merchants inside the collector's top-5-category window. September collects **all 13 categories**, so 2,252 is every categorised merchant. If the report explains this number anywhere, the gloss needs correcting.

**Delete the paragraph that follows the table:** *"The five recency shortfalls are a collector limitation… All five merchant IDs are enumerated in `claims.json`…"* — **this limitation is retired.** The September collector serializes per-resource `lastUpdated`, `equivalence.unreproducibleMerchantIds` is now `[]`, and all five components reproduce for every merchant. Replace with a one-line statement that reproduction is exact.

### A.3 Re-cut derivation

| Current | Replace with |
|---|---|
| "The Data & Enrichment quartiles used throughout are **9 / 9 / 9 / 7** merchants" | **23 / 23 / 23 / 22** |
| "**The direction of the finding holds under all three**, which is asserted as a claim (`recut.robustness.directionHoldsUnderAllRules`)" | ❌ **The claim is now `false`.** This sentence must be rewritten to state which signals hold and which do not (see §4.2 control table). |

### A.4 Reproduction

| Current | Replace with |
|---|---|
| "`npm run charts` regenerates every figure" | ⚠️ **Inaccurate.** `npm run charts` is stale: it omits `d4_quartile_score_vs_listing_quality.py` (a live figure) and runs two dead scripts. List the five data-chart commands explicitly instead. |

---

# PART 2 — Diagram Update Instructions

All five data charts have been **re-rendered from the September artifacts** on branch `refresh/2026-09-09` and are current. Each reads its values from the artifacts at render time — none hard-codes numbers. What follows is what **visibly changed** in each, so you can verify the regenerated image and update its caption.

Structural diagrams — `d9_circular_dependency.png` (Fig 4.5), `d15_x402_purchase.png` (Fig 1.1), `d16_z_position.png` (Fig 2.1), `d12_reserved_slots.png` (Fig 5.1), `d13_exposure_decay.png` (Fig 5.2), `d14_audition_loop.png` (Fig 5.3) — **contain no data and need no regeneration.**

---

## Figure 4.1 — Lorenz curves (`d3a_lorenz_curves.png`)

**Script:** `charts/d3a_lorenz_curves.py` · **Status:** re-rendered ✅

**What changed visually:**
- All four curves redrawn on new populations (497 / 194 / 91 / 57 merchants).
- **Finance & Markets sags markedly less** — Gini 0.7809 → 0.7371, now clearly the flattest curve.
- **Data & Enrichment sags most** — Gini 0.9244 → 0.9766, now the deepest curve, overtaking Crypto & DeFi.
- **Crypto & DeFi moves toward the diagonal** — 0.9235 → 0.8975.

**Caption change required.** Current caption is generic and survives, **but** any surrounding text calling Crypto & DeFi "the worst spread" is now wrong — that is Data & Enrichment.

**Instruction if regenerating from scratch:** plot cumulative share of 30-day transactions against cumulative share of merchants, one curve per category, using September per-merchant `txCount30d`. Label each curve with its Gini: CD 0.8975, AI 0.9630, DE 0.9766, FM 0.7371.

---

## Figure 4.2 — Data & Enrichment cliff (`d3b_data_enrichment_cliff.png`)

**Script:** `charts/d3b_data_enrichment_cliff.py` · **Status:** re-rendered ✅

**What changed visually:**
- Bar count **34 → 91**.
- Leader bar rises from 16,625 to **63,684** transactions — the cliff is far steeper.
- Second bar is now **Google Trends SEO Keyword Data** at 1,925, not Linked Panda at 1,194.
- The log scale is now more necessary, not less: the leader outsells second place **33×**.

**Caption change required:**
> Current: "…the **thirty-three** merchants behind the leader are invisible."
> New: "…the **ninety** merchants behind the leader are invisible."

---

## Figure 4.3 — Quartile score vs listing quality (`d4_quartile_score_vs_listing_quality.png`)

**Script:** `charts/d4_quartile_score_vs_listing_quality.py` · **Status:** re-rendered ✅ · **Burn-in fixed:** the caption number baked into the image said `"4.2"` while the report calls it Figure 4.3 — corrected to `"4.3"` at line 96.

### ⚠️ This figure's argument has inverted

The chart existed to show **a falling score line against a flat listing-quality line, with Q3 highest**. In September:

- Mean score falls **0.4736 → 0.2677** (a steeper drop than July's 0.5319 → 0.3434).
- **Listing quality is no longer flat.** It declines **0.7561 → 0.7364 → 0.7364 → 0.6388**, monotonically with rank.
- **Q3 is no longer the best-documented quartile. Q1 is.**
- Q4 no longer sits above Q1 — it sits **0.1173 below**.

**Caption must be rewritten entirely.** Current:
> "Mean ranker score falls **0.1885** from Q1 to Q4 while mean listing quality **stays flat**: Q4 sits **0.0030 above Q1**, and the **best-documented quartile is Q3**."

Suggested replacement:
> "Data & Enrichment split into rank quartiles. Mean ranker score falls **0.2059** from Q1 to Q4, a drop of **43.5%**. Mean listing quality also declines, but far less — **0.1173** across the same span — and the two series are no longer independent."

**Editorial warning:** this figure no longer supports the "quality is flat across rank" thesis in this category. Consider whether it should be **replaced by a Finance & Markets version** (Q1 0.7735, Q4 0.7779 — still essentially flat, still marginally inverted), which now carries the argument Data & Enrichment used to.

---

## Figure 4.4 — Gap decomposition (`d5_gap_decomposition.png`)

**Script:** `charts/d5_gap_decomposition.py` · **Status:** re-rendered ✅

**What changed visually:**
- **The recency band grows dramatically** in all four categories — from a sliver to a major segment (AI & Agents 12.7% → **39.66%**; Finance & Markets 4.8% → **39.26%**).
- The combined volume + buyer-diversity block **shrinks in every category**.
- Data & Enrichment's listing-quality segment **flips from negative to positive** (−0.2% → +8.55%).
- Finance & Markets' listing-quality segment **flips negative** (1.5% → −0.31%) — the only negative bar now.
- Reliability remains **exactly 0%** in all four ✅.

**Caption must be rewritten.** Current:
> "Volume and buyer diversity account for **70.4–98.0%** of the gap; reliability accounts for exactly 0%…"

Replacement:
> "Volume and buyer diversity account for **46.9–73.6%** of the gap; **recency now accounts for 16–40%**; reliability accounts for exactly 0%, because it is the same constant for every merchant."

---

## Figure 4.6 — Ceiling and gap (`d7_ceiling_and_gap.png`)

**Script:** `charts/d7_ceiling_and_gap.py` · **Status:** re-rendered ✅ · Parses `RANKER_WEIGHTS` out of `src/ranker.ts` by regex — **verified still parsing correctly** after the formula was re-vendored.

**What changed visually:**
- The **0.3250 ceiling line does not move** ✅ — it derives only from weights.
- All four incumbent bars shift slightly: CD 0.6577 → **0.6504**, AI 0.5561 → **0.5489**, DE 0.5877 → **0.5951**, FM 0.5388 → **0.5366**.
- The amber gap band narrows marginally in three categories and widens in Data & Enrichment.

**Caption survives as written** ✅ — it names no specific figures. If the surrounding text cites the smallest gap, change **0.2138 → 0.2116**.

---

## Figure 4.5 / 1.1 / 2.1 / 5.1 / 5.2 / 5.3 — structural diagrams

**No regeneration needed.** These illustrate mechanisms (the circular dependency, an x402 purchase, Merchant Z's position, reserved slots, exposure decay, the audition loop). They contain no data from either snapshot.

**One exception to check:** Figure 2.1's caption and Figure 4.5's caption reference Merchant Z conceptually, not numerically — ✅ safe.

---

# Appendix — Verification

Every September figure in this document resolves against a committed artifact on branch `refresh/2026-09-09`:

- `data/raw-data.json` — snapshot `2026-09-09T08:09:16.700Z`, 2,252 merchants, 42,201 resources
- `data/analysis-results.json` — concentration, quartiles, gap decomposition, ceiling
- `data/recut-results.json` — the formula-independent control, three rules
- `claims.json` — 152 claims, 150 internal (all passing), 2 external (untouched)

`npm run all` exits 0. Score-component equivalence is **2,252 / 2,252 on all five components**.

Full provenance, invariant checks, direction-change alarms and three diagnostics are in **`docs/REFRESH-2026-09-09.md`**.
