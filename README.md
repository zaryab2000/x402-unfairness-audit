# x402-unfairness-audit

Reproducible evidence base for an empirical audit of merchant discovery ranking in the x402 ecosystem.
Frozen snapshot, published scoring code, and a machine-checkable manifest of every figure the report cites.

**Report:** *The Unfairness Report* — [read it here](REPORT_URL)
**Snapshot:** 2026-07-25 · 1,212 merchants · 496 analysed across four categories
**Verify:** `npm install && npm run all` — no configuration, no network, no API keys

---

## What the audit found

**1 — Volume is concentrated past the thresholds regulators use.**
Gini runs 0.78–0.95 across all four categories. Data & Enrichment posts an HHI of 6,798, where 3 of 34 merchants take 91.2% of every payment. US merger guidelines call a market highly concentrated above 2,500.

**2 — Listing quality does not separate the top of the catalog from the bottom.**
Volume and buyer diversity explain 70–98% of the gap between a category's top and bottom rank quartiles. Listing quality explains at most 16.9%, and −0.2% in Data & Enrichment, where the bottom quartile is documented marginally *better* than the top. The direction holds when the same quartiles are re-cut on raw catalog fields with no scoring applied at all.

**3 — The resulting gap cannot be closed by a new merchant.**
A merchant with flawless metadata and no trading history has a hard ceiling of **0.3250**. Incumbent top-three means run 0.5388 to 0.6577. The smallest gap in the dataset is 0.2138 — larger than the entire value of perfect documentation, which is 0.150. Of the 77 zero-transaction merchants in the analysed set, **not one scores above 0.3250**.

| Category          | Merchants | 30d txs |   Gini |   HHI | Top-3 share | Incumbent top-3 mean | Gap to ceiling |
| ----------------- | --------: | ------: | -----: | ----: | ----------: | -------------------: | -------------: |
| Crypto & DeFi     |       303 |  45,290 | 0.9235 |   816 |       42.2% |               0.6577 |         0.3327 |
| AI & Agents       |       128 |  13,912 | 0.9524 | 1,841 |       65.3% |               0.5561 |         0.2311 |
| Data & Enrichment |        34 |  20,244 | 0.9244 | 6,798 |       91.2% |               0.5877 |         0.2627 |
| Finance & Markets |        31 |   2,614 | 0.7809 | 1,700 |       66.5% |               0.5388 |         0.2138 |

Every figure above resolves against a committed artifact via `claims.json`.

### What the audit does not claim

- **Documentation is not worthless.** It governs whether a service is indexed at all. Every merchant here is in the dataset because its listing parsed.
- **The incumbents are not undeserving.** This study measures no service quality directly, because no discovery index reads it.
- **Nothing here is a forecast.** No growth model was built. This is one instant, 2026-07-25.

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
    volumeSignal              1132   1132
    buyerDiversity            1132   1132
    reliability               1132   1132
    listingQuality            1132   1132
    recency                   1127   1132  <- see METHODOLOGY.md

  All verifiable claims reproduce from the committed artifacts.
```

Exit code 0 means every claim in `claims.json` resolved to its cited value. Any mismatch prints the claimed value beside the computed one and exits non-zero.

Requires Node 22+. The only dependencies are `tsx` and `typescript`.

---

## The population, stated precisely

The three numbers that recur in this repo are not interchangeable, so they are set out here once:

|    Number | What it counts                                                                                                                               |
| --------: | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **1,212** | Merchants in the frozen catalog snapshot, across 13 categories.                                                                              |
| **1,132** | Of those, the merchants carrying a stored score breakdown — the population the equivalence test runs against.                                |
|   **496** | Merchants in the four categories with coherent market identity and non-trivial settled volume. **Every finding above is computed on these.** |

The 716 merchants outside the analysed set break down as 636 in the uncategorised "Other" fallback bucket, plus 80 in named categories too thin to analyse. Category selection and the exclusion rule are in [`docs/METHODOLOGY.md`](docs/METHODOLOGY.md) §2.

---

## What each artifact is

| file                         | what it is                                                                                                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data/raw-data.json`         | Frozen catalog snapshot, collected **2026-07-25T11:41:43Z**. 17 MB, 1,212 merchants, 26,256 resources. **Never regenerated by this repo** — it is evidence. |
| `data/analysis-results.json` | Concentration, quartile decomposition, cold-start ceiling. Regenerated by `npm run analyze`, byte-identical to the committed copy.                          |
| `data/recut-results.json`    | Pass 2 raw-field re-cut under three aggregation rules. Regenerated by `npm run recut`.                                                                      |
| `data/cdp-probes.json`       | Live discovery-endpoint probes, collected **2026-07-25T11:52:13Z**. Frozen record; see the note on `npm run probe` below.                                   |
| `claims.json`                | Every number cited in the report, with the artifact and path that produces it.                                                                              |
| `src/ranker.ts`              | The scoring formula, dependency-free.                                                                                                                       |
| `docs/METHODOLOGY.md`        | Definitions, assumptions, and the known reproduction gap.                                                                                                   |

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

1. **This is a reference implementation**, vendored from the ranking implementation as of the snapshot date (commit `5b327e0`, 2026-07-25). The production formula has since changed — see METHODOLOGY.md §3. That drift is itself a finding: ranking formulas move under operators' feet.
2. **Production index weights are unpublished.** These are the weights this study's index used, not a disclosure of any third-party ranking system.
3. **The structural result does not depend on the exact weights.** It depends only on volume being the largest term. Any formula that ranks primarily on transaction history reproduces the cold-start trap, because a merchant with no history scores zero on that term by construction.

---

## How to disagree

The formula encodes a judgement call, and the judgement is in exactly one place. If you think the weights are wrong, change them and see what happens:

1. Open **`src/ranker.ts`**, line **26** — the `RANKER_WEIGHTS` constant.
2. Change the numbers. They should sum to 1.0.
3. Run `npm run analyze` and compare.

For example, setting `volume: 0.15` and `listingQuality: 0.40` — the strongest plausible "documentation should matter most" position — reorders Data & Enrichment so that well-documented low-volume merchants take the top places (rank 12 → 5, rank 9 → 3), displacing the volume incumbent. That is the honest result of that assumption, and it demonstrates the finding is a consequence of weighting volume highly, not an artifact of arithmetic.

What re-weighting does **not** do is close the cold-start gap, unless you drive the volume and buyerDiversity weights to near zero. That is the report's actual claim, and it is the thing to attack if you want to falsify it.

Other useful attacks: recut the quartiles under a different aggregation rule (all three are already emitted in `data/recut-results.json`), or challenge the category exclusions in METHODOLOGY.md §2.

---

## Known limitations

Carried over from the report rather than re-litigated here:

- **Market scale.** ~$52,415 of 30-day volume across the four analysed categories, of which Crypto & DeFi alone is 95.1%. Concentration measures over a market this small are real but fragile. Smallness bounds the confidence interval around every figure; it does not change the direction.
- **Reliability is a constant placeholder.** At 0.5 for everyone it differentiates nobody; any claim about its 0.05 weight is a claim about a placeholder.
- **Single-query probe design.** One representative query per category. A different phrasing surfaces a different result set.
- **No forward projection.** This is one instant, 2026-07-25. Nothing here forecasts how concentration evolves.
- **Findings describe four categories, not the ecosystem in aggregate.** 716 of 1,212 merchants are outside the analysed set — see the population table above.

One reproduction gap is disclosed in full: four of five score components reproduce for all 1,132 merchants, and recency reproduces for 1,127. The five shortfalls are caused by a field the collector dropped at collection time, not by the formula, and none affects a figure the report cites. The affected merchant ids are enumerated in METHODOLOGY.md §4.

---

## The optional probe

`npm run probe` re-runs the discovery-endpoint probes. It is **not** part of `npm run all` and not part of verification.

It queries a live catalog, so it is non-deterministic: re-running will **not** reproduce the committed `data/cdp-probes.json`.

It never writes to that file. Output goes to `data/probes-<UTC date>.json`, so the frozen 2026-07-25 record survives any number of probe runs — compare a fresh run against it rather than replacing it. The endpoint is free, unauthenticated and read-only; no credentials, payments, or API keys are involved.

---

## Disclosure

The author builds a merchant-analytics service for the x402 ecosystem. That is a commercial interest in how x402 discovery is ranked. The scoring implementation measured here is the author's own, which is precisely why it is published at the exact commit used, alongside the raw snapshot — so that every figure can be re-derived, re-weighted, or refuted independently. The core finding is additionally re-cut on raw catalog fields with no scoring applied, and holds.

---

## Licence

Dual-licensed:

- **Code** (`src/`, `scripts/`) — MIT, see `LICENSE-CODE`.
- **Data** (`data/`, `claims.json`) — CC0-1.0 (public domain dedication), see `LICENSE-DATA`.

The data is CC0 so that reproducing, re-cutting or extending this analysis carries no attribution friction.
