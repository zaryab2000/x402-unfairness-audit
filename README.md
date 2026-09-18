# x402-unfairness-audit

Reproducible evidence base for an empirical audit of merchant discovery ranking in the x402 ecosystem.
Frozen snapshot, published scoring code, and a machine-checkable manifest of every figure the report cites.

**Report:** *The x402 Unfairness Report — An Empirical Audit of the Cold-Start Problem for x402 Merchants* — [read it here](https://zaryab2000.notion.site/x402-Unfairness-Report-A-Study-of-1212-merchants-in-an-unfair-x402-agentic-market-3b3a13cdb21f80179d7ee9ed6a20f9fb)
**Snapshot:** 2026-09-09 · 2,252 merchants · 839 analysed across four categories
**Verify:** `npm install && npm run all` — no configuration, no network, no API keys

---

## What the audit found

**1 — Volume is concentrated past the thresholds regulators use.**
Gini runs 0.74–0.98 across all four categories. Data & Enrichment posts an HHI of 8,310, where 3 of 91 merchants take 95.4% of every payment. US merger guidelines call a market highly concentrated above 2,500.

**2 — Listing quality explains little of the gap between the top and bottom of the catalog.**
Volume and buyer diversity explain 46.9–73.6% of the gap between a category's top and bottom rank quartiles, and recency a further 16.0–39.7%. Listing quality explains at most 13.4%, and −0.3% in Finance & Markets, where the bottom quartile is documented marginally *better* than the top. Documentation does move with rank — it is not unrelated to it — but at roughly half the rate the score moves.

**3 — The resulting gap cannot be closed by a new merchant.**
A merchant with flawless metadata and no trading history has a hard ceiling of **0.3250**. Incumbent top-three means run 0.5366 to 0.6504. The smallest gap in the dataset is 0.2116 — larger than the entire value of perfect documentation, which is 0.150. Of the 79 zero-transaction merchants in the analysed set, **not one scores above 0.3250**; the highest observed is 0.2965.

| Category          | Merchants | 30d txs |   Gini |   HHI | Top-3 share | Incumbent top-3 mean | Gap to ceiling |
| ----------------- | --------: | ------: | -----: | ----: | ----------: | -------------------: | -------------: |
| Crypto & DeFi     |       497 |  62,863 | 0.8975 |   400 |       28.1% |               0.6504 |         0.3254 |
| AI & Agents       |       194 |  18,766 | 0.9630 | 2,440 |       77.2% |               0.5489 |         0.2239 |
| Data & Enrichment |        91 |  69,911 | 0.9766 | 8,310 |       95.4% |               0.5951 |         0.2701 |
| Finance & Markets |        57 |   2,175 | 0.7371 |   783 |       37.4% |               0.5366 |         0.2116 |

Every figure above resolves against a committed artifact via `claims.json`.

### What the audit does not claim

- **Documentation is not worthless.** It governs whether a service is indexed at all. Every merchant here is in the dataset because its listing parsed.
- **The incumbents are not undeserving.** This study measures no service quality directly, because no discovery index reads it.
- **Nothing here is a forecast.** No growth model was built. This is one instant, 2026-09-09.

The claim is narrower than any of those: the mechanism selects on volume, and it compounds.

---

## Reproduce it

```bash
git clone https://github.com/zaryab2000/x402-unfairness-audit
cd x402-unfairness-audit
npm install
npm run all
```

`npm run all` runs `analyze` → `recut` → `verify`. Expected output ends with:

```
    component        exact matches   of
    volumeSignal              2252   2252
    buyerDiversity            2252   2252
    reliability               2252   2252
    listingQuality            2252   2252
    recency                   2252   2252

  All verifiable claims reproduce from the committed artifacts.
```

Exit code 0 means every claim in `claims.json` resolved to its cited value. Any mismatch prints the claimed value beside the computed one and exits non-zero.

Requires Node 22+. The only dependencies are `tsx` and `typescript`.

---

## The population, stated precisely

The three numbers that recur in this repo are not interchangeable, so they are set out here once:

|    Number | What it counts                                                                                                                               |
| --------: | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **2,252** | Merchants in the frozen catalog snapshot, across 13 categories. Every one carries a stored score breakdown, so this is also the population the equivalence test runs against. |
|   **839** | Merchants in the four categories with coherent market identity and non-trivial settled volume. **Every finding above is computed on these.** |

The 1,413 merchants outside the analysed set break down as 1,256 in the uncategorised "Other" fallback bucket, plus 157 in named categories too thin to analyse. Category selection and the exclusion rule are in [`docs/METHODOLOGY.md`](docs/METHODOLOGY.md) §2.

---

## What each artifact is

| file                         | what it is                                                                                                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data/raw-data.json`         | Frozen catalog snapshot, collected **2026-09-09T08:09:16.700Z**. 34.7 MB, 2,252 merchants, 42,201 resources. **Never regenerated by this repo** — it is evidence. |
| `data/analysis-results.json` | Concentration, quartile decomposition, cold-start ceiling. Regenerated by `npm run analyze`, byte-identical to the committed copy.                          |
| `data/recut-results.json`    | Pass 2 raw-field re-cut under three aggregation rules. Regenerated by `npm run recut`.                                                                      |
| `data/cdp-probes.json`       | Live discovery-endpoint probes, collected **2026-07-25T11:52:13Z**. Retained from the July run; superseded by `data/probes-2026-09-09.json`.                |
| `data/probes-2026-09-09.json` | Live discovery-endpoint probes from the September run. The current probe record.                                                                          |
| `claims.json`                | Every number cited in the report, with the artifact and path that produces it.                                                                              |
| `src/ranker.ts`              | The scoring formula, dependency-free. Reads the four quality modules below.                                                                                  |
| `src/taxonomy.ts`, `src/description-quality.ts`, `src/tag-quality.ts`, `src/service-name-quality.ts` | Vendored from the same commit; the listing-quality term depends on all four.               |
| `docs/METHODOLOGY.md`        | Definitions, assumptions, and disclosed limitations.                                                                                                        |

---

## The scoring formula

```
score = 0.40·volume
      + 0.25·buyerDiversity
      + 0.05·reliability
      + 0.15·listingQuality
      + 0.15·recency
```

Each component is normalised to [0, 1]. Volume is log-scaled 30-day transactions and USD volume; buyerDiversity is log-scaled unique 30-day buyers; listingQuality scores schemas, description length, service name and tags; recency is a decay ladder on last activity. **Reliability is a constant 0.5 for every merchant** — no source exposes service health, so it differentiates nobody and contributes exactly 0 to every gap decomposition.

Three things to be clear about:

1. **This is a reference implementation**, vendored from the ranking implementation as of the snapshot date (commit `eca0195`, 2026-09-09) — the version that produced the scores stored in the snapshot. Ranking formulas move under operators' feet: the July edition of this study was pinned to an earlier commit whose listing-quality component has since been rewritten.
2. **Production index weights are unpublished.** These are the weights this study's index used, not a disclosure of any third-party ranking system.
3. **The structural result does not depend on the exact weights.** It depends only on volume being the largest term. Any formula that ranks primarily on transaction history reproduces the cold-start trap, because a merchant with no history scores zero on that term by construction.

---

## Known limitations

Carried over from the report rather than re-litigated here:

- **Market scale.** ~$38,735 of 30-day volume across the four analysed categories, of which Crypto & DeFi alone is 89.5%. Concentration measures over a market this small are real but fragile. Smallness bounds the confidence interval around every figure; it does not change the direction.
- **Reliability is a constant placeholder.** At 0.5 for everyone it differentiates nobody; any claim about its 0.05 weight is a claim about a placeholder.
- **Single-query probe design.** One representative query per category. A different phrasing surfaces a different result set.
- **No forward projection.** This is one instant, 2026-09-09. Nothing here forecasts how concentration evolves.
- **Findings describe four categories, not the ecosystem in aggregate.** 1,413 of 2,252 merchants are outside the analysed set — see the population table above.

All five score components reproduce exactly for all 2,252 merchants. The July edition of this study carried a recency shortfall caused by a field the collector dropped at collection time; the September collector serializes it, so `equivalence.unreproducibleMerchantIds` in `claims.json` is empty and a verification transform asserts that it is.

---

## The optional probe

`npm run probe` re-runs the discovery-endpoint probes. It is **not** part of `npm run all` and not part of verification.

It queries a live catalog, so it is non-deterministic: re-running will **not** reproduce the committed `data/cdp-probes.json`.

It never writes to that file. Output goes to `data/probes-<UTC date>.json`, so the frozen records survive any number of probe runs — compare a fresh run against it rather than replacing it. The endpoint is free, unauthenticated and read-only; no credentials, payments, or API keys are involved.

---

## Disclosure

The author builds a merchant-analytics service for the x402 ecosystem. That is a commercial interest in how x402 discovery is ranked. The scoring implementation measured here is the author's own, which is precisely why it is published at the exact commit used, alongside the raw snapshot — so that every figure can be re-derived, re-weighted, or refuted independently. The core finding is additionally re-cut on raw catalog fields with no scoring applied, and holds.

---

## Licence

Dual-licensed:

- **Code** (`src/`, `scripts/`) — MIT, see `LICENSE-CODE`.
- **Data** (`data/`, `claims.json`) — CC0-1.0 (public domain dedication), see `LICENSE-DATA`.

The data is CC0 so that reproducing, re-cutting or extending this analysis carries no attribution friction.
