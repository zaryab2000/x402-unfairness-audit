# Chart update punch list — July 2026 → September 2026

**What I did.** Read all 18 scripts in `charts/` line by line, then opened every rendered PNG that carries a number and read what is actually printed on it. Source review alone would have missed three of the five defects below, because the bugs are in text that *renders* correctly from the code's point of view and is wrong on the page.

**The headline, and it is worse than "the charts are outdated."** Five figures were already regenerated on 9 September against the new data. **Three of those five are now actively wrong** — not stale, wrong. One prints a sentence that contradicts itself. One labels the wrong category with a number that belongs to a different category, and the bar it points at prints a different number. One has its most important bar clipped off the top of the plot and silently dropped the annotation naming the dominant merchant.

Regenerating is not enough. Three scripts have to be edited first.

**Where the images actually live.** Notion still holds the **July** renders — the S3 copies were never replaced. So every figure in the report today is July, including the five whose repo copies are September. Nothing is fixed until each PNG is re-rendered *and* re-uploaded into the Notion page.

---

## The inventory

18 files in `charts/`. Twelve appear in the report.

| Script | In report as | Data-bearing? | PNG regenerated 9 Sep? | Verdict |
|---|---|---|---|---|
| `d3a_lorenz_curves.py` | Figure 4.1 | yes, fully live | yes | **Clean** — re-upload only |
| `d3b_data_enrichment_cliff.py` | Figure 4.2 | yes, fully live | yes | **BROKEN** — bar clipped, annotation lost |
| `d4_quartile_score_vs_listing_quality.py` | Figure 4.3 | yes, fully live | yes | **BROKEN** — title, callout and caption all false |
| `d5_gap_decomposition.py` | Figure 4.4 | bars live, annotation hardcoded | yes | **BROKEN** — wrong category labelled |
| `d9_circular_dependency.py` | Figure 4.5 | no — pure diagram | n/a | Clean, no change |
| `d7_ceiling_and_gap.py` | Figure 4.6 | yes, fully live | yes | **Clean** — re-upload only, two minor collisions |
| `d15_x402_purchase.py` | §1 purchase flow | no — pure diagram | n/a | Clean, no change |
| `d16_z_position.py` | Figure 2.1 | no — pure diagram | n/a | Clean, no change |
| `d12_reserved_slots.py` | §5.2 | no — pure diagram | n/a | Clean, no change |
| `d13_exposure_decay.py` | §5.3 | no — pure diagram | n/a | Clean, no change |
| `d14_audition_loop.py` | §5.3 | no — pure diagram | n/a | Clean, no change |
| `banner_notion_cover.py` | page cover | no — brand art | n/a | Clean, no change |
| `d3_concentration.py` | not used | yes | no | Superseded by d3a+d3b. Leave or delete |
| `d4_quality_rank_disconnect.py` | not used | yes | no | **Carries July narrative in code.** Do not revive without a rewrite |
| `d4_quartile_divergence.py` | not used | yes | no | Same. Do not revive without a rewrite |
| `d10_ceiling_observed.py` | not used | yes | no | Same. Do not revive without a rewrite |
| `d11_two_surface_model.py` | not used | no | n/a | Clean |
| `decipher_style.py` | shared style module | n/a | n/a | No change |

Seven of the twelve in-report figures are pure diagrams with no data in them at all. They are correct as they stand and should not be touched.

---

## Figure 4.2 — `d3b_data_enrichment_cliff.py` — BROKEN

**What is wrong on the page right now.** Look at the September render: the blue leading bar runs straight off the top of the plot area with no cap, and there is **no label naming StableEnrich or stating its 91% share**. In July that annotation was the whole point of the figure.

**Why.** Line 33: `ax.set_ylim(0, 60000)`. StableEnrich settled **63,684** transactions in September — above the ceiling. The bar clips, and because the annotation is anchored at `xy=(0, tx[0])`, its anchor point is off-canvas, so matplotlib dropped the label silently. In July the leader was 16,625, comfortably inside 60,000, so the hardcoded limit never bit.

**Fixes required in the script**

| Line | Now | Change to |
|---|---|---|
| 33 | `ax.set_ylim(0, 60000)` | `ax.set_ylim(0, max(tx) * 1.30)` — never hardcode a ceiling against live data again |
| 41 | `xytext=(3.4, 26000)` | Re-tune. Tuned for 34 bars and a 60k axis; the plot is now 91 bars. Suggest `xytext=(6.0, max(tx)*0.42)` |
| 46 | `xytext=(4.6, 2600)` | Re-tune for 91 bars. Suggest `xytext=(8.0, 2600)` |
| 49 | `ds.chip(ax, len(tx) * .30, 170, ...)` | Position is proportional so it survives, but check it after re-render |
| 4 (docstring) | "the thirty-three merchants behind the leader" | "the ninety merchants behind the leader" |

**Everything else in this figure is live and already correct**: the subtitle renders "one merchant holds 91% of all payments made" ✓, the x-label renders "The 91 merchants of Data & Enrichment" ✓, and the chip renders "The gap between first and second (61,759) is larger than every other merchant combined (6,227)" ✓ — all three verified against the data.

**After re-render, confirm the restored annotation reads:** `StableEnrich` / `63,684 sales — 91% of the category`, and `second place: 1,925` / `33.1x smaller`.

**Notion caption change (Figure 4.2):** "…on a linear one the **thirty-three** merchants behind the leader are invisible" → **ninety**.

---

## Figure 4.3 — `d4_quartile_score_vs_listing_quality.py` — BROKEN

This is the worst of the three. Every number on it is correct; every sentence on it is false. The script is honest — it computes each callout from the data — but the *sentence templates* were written around a July finding that has reversed.

**What is printed on the September render:**

1. Title: **"Rank collapses. Listing quality stays where it is."** Listing quality falls 0.7561 → 0.6388 across the quartiles, monotonically. It does not stay where it is.
2. Callout: **"Listing quality does not follow it down."** It does follow it down.
3. Callout, same chip: **"the best-listed quartile in the category is Q1, not Q1."** The template is `f"...is {labels[best_quality_i]}, not Q1."` — and in September Q1 *is* the best-listed quartile, so it renders a sentence that contradicts itself inside four words. Anyone who reads the figure carefully will stop trusting the report at this point.
4. Caption: **"Source: analysis-results.json, snapshot 2026-07-25."** Hardcoded string on line 103 — September data, July date stamp. The one place a reader checks for provenance is wrong.
5. The amber arrow (line 89) points at **Q3**, a leftover from "Q3 is the best-documented quartile." It now points at nothing in particular.
6. The Q4 listing-quality marker (0.6388) is partly hidden behind the blue "Score falls" chip.

**Fixes required in the script**

| Line | Now | Change to |
|---|---|---|
| ~99 `ds.title` | "Rank collapses. Listing quality stays where it is." | **"Rank collapses. Listing quality slips — at half the rate."** |
| ~78 chip text | "Listing quality does not follow it down. / Q4 sits {x} below Q1, and the best-listed / quartile in the category is {Q}, not Q1." | **"Listing quality follows rank down, but at half the rate. / Q4 sits {abs(quality_delta):.4f} below Q1 while score falls {score_drop_abs:.4f}. / Q2 and Q3 are tied at {quality[1]:.4f}, twenty-three rank places apart."** |
| ~89 `ax.annotate` arrow | points at `quality[2]` (Q3) | Re-point at the Q2/Q3 tie, or delete. It no longer marks anything |
| 103 caption | `"...snapshot 2026-07-25."` | **Read the date from the artifact**: `f"...snapshot {d['snapshotCollectedAt'][:10]}."` — so it can never go stale again |
| ~84 chip position | `ds.chip(ax, 2.36, .697, ...)` | Nudge right or up; it currently occludes the Q4 amber marker |

**Do not** delete the `best_quality_i` logic — make it conditional: only print the "best-listed quartile is X" sentence when `best_quality_i != 0`.

**Values to expect after re-render** (all already correct on the current PNG): score 0.4736 / 0.3781 / 0.3346 / 0.2677, listing quality 0.7561 / 0.7364 / 0.7364 / 0.6388, ranks 1–23 / 24–46 / 47–69 / 70–91, n=23/23/23/22, tx 3,014.7 / 13.7 / 8.8 / 2.5, "Score falls 0.2059 — 43.5% of Q1's score."

**Note the drift with the report body.** My earlier report punch list gives 44% for this drop; the figure computes 43.5% (`0.2059/0.4736`). Use **43.5%** in both, or round both to 43%. Right now they will disagree by half a point.

**Notion caption change (Figure 4.3):** the current one says score falls 0.1885 and "the best-documented quartile in the category is Q3" — replace per the report punch list §2.9. This figure also bakes its own caption into the PNG, so **both** captions have to say the same thing. Check them against each other after re-render.

---

## Figure 4.4 — `d5_gap_decomposition.py` — BROKEN

**What is printed on the September render:** an amber label reading **"listing quality −0.2%"** with an arrow pointing at the **Data & Enrichment** bar — and that same bar prints **8.6%** in its own listing-quality segment. The figure disagrees with itself. Directly beneath it, "better-documented merchants rank lower here" sits against the Data & Enrichment row.

**Why.** Lines 73–81 hardcode both the category and the number:

```python
de_i = order.index("Data & Enrichment")
ax.annotate("listing quality\n−0.2%", xy=(-0.5, de_i), ...)
ax.text(-27, de_i - .58, "better-documented merchants\nrank lower here", ...)
```

The bars are computed live, so they updated. The annotation did not. In September the negative listing-quality share moved to **Finance & Markets at −0.3%** — visible on the render as a tiny unlabelled amber sliver at x=0 on the F&M row.

**Fixes required in the script**

| Line | Now | Change to |
|---|---|---|
| 73 | `de_i = order.index("Data & Enrichment")` | `neg = [c for c in order if shares[c]["listingQuality"] < 0]` then `neg_i = order.index(neg[0]) if neg else None` |
| 74 | `ax.annotate("listing quality\n−0.2%", xy=(-0.5, de_i), xytext=(-27, de_i), ...)` | Guard on `neg_i is not None`, and compute the number: `f"listing quality\n{100*shares[neg[0]]['listingQuality']:.1f}%".replace("-","−")` → renders **−0.3%** against **Finance & Markets** |
| 79 | `ax.text(-27, de_i - .58, ...)` | Same guard, `neg_i` in place of `de_i` |
| 68 | `ax.set_xlim(-30, 104)` | `-30` reserved room for a July-sized negative bar. Tighten to about `-14` so the chart is not a third empty white space |
| ~86 `ds.title` | "Sales history explains the gap. Documentation does not." | **"Sales history and freshness explain the gap. Documentation does not."** — in AI & Agents history is 46.9% and recency alone is 39.7%; the current title overstates what the bars show |

**The subtitle is already correct and live:** "Volume and buyer diversity together account for 46.9–73.6% of the top-to-bottom score gap in every category." ✓

**Bar values to expect** (all correct on the current PNG): Crypto 36.6 / 36.9 / 0 / 10.4 / 16.0 · D&E 38.8 / 32.4 / 0 / 8.6 / 20.2 · F&M 28.6 / 32.4 / 0 / −0.3 / 39.3 · AI 24.5 / 22.4 / 0 / 13.4 / 39.7.

**The structural change worth seeing before you sign off.** Recency is now the second- or third-largest block in every category — 39.7% in AI & Agents, 39.3% in Finance & Markets, against 0.9% and 4.8% in July. The figure will look materially different from the one your readers saw in July, and that is the data, not a bug.

---

## Figure 4.1 — `d3a_lorenz_curves.py` — CLEAN

Fully data-driven: curves from `raw-data.json`, Gini labels from `analysis-results.json`, legend sorted by Gini. September render is correct — Finance & Markets 0.7371, Crypto & DeFi 0.8975, AI & Agents 0.9630, Data & Enrichment 0.9766. Subtitle carries no numbers.

**No code change. Re-upload to Notion only.**

One optional legibility note, not an error: the three non-focus curves get grey tints in category order, not Gini order, so AI & Agents — the second-most concentrated — is drawn in the palest dotted grey and reads as the least severe. If you want it to read correctly, assign `grey_tints` by Gini rank instead of loop position. Cosmetic.

---

## Figure 4.6 — `d7_ceiling_and_gap.py` — CLEAN

The most robust script in the set. Weights are parsed out of `src/ranker.ts` with a regex rather than typed, and there is an assertion that the components must reconstruct the ceiling — so it would have failed loudly rather than lied if the weights had moved. They did not move, so the 0.3250 ceiling and its 0.150 / 0.150 / 0.025 breakdown stand. September gaps render correctly: +0.2116 / +0.2239 / +0.2701 / +0.3254, top-3 means 0.5366 / 0.5489 / 0.5951 / 0.6504. Subtitle computed live ✓.

**No data change. Re-upload to Notion.** Two cosmetic collisions worth ten minutes if you are in there anyway:

- The "day-one ceiling 0.3250" chip at `x=4.62` overlaps the right edge of the Crypto & DeFi bar.
- The dashed amber box "volume + buyer diversity / 65% of the score, locked at zero" collides with the Finance & Markets bar. Move it left, into the empty column above "A perfect new merchant".

---

## The seven diagrams — NO CHANGE

`d9_circular_dependency`, `d15_x402_purchase`, `d16_z_position`, `d12_reserved_slots`, `d13_exposure_decay`, `d14_audition_loop`, `banner_notion_cover`.

I read all seven in full. Every one is deterministic — no `json.load`, no data path, no numeric claim about the market. The only digits anywhere in them are structural labels ("402 + payment terms", "200 + resource", "ranks 13–20", "at 0 → graduate", "Merchant A/B/C"), none of which depend on the snapshot.

**Do not regenerate these and do not re-upload them.** They are correct, and touching them risks introducing drift where none exists.

---

## The four unused scripts — a trap to avoid

`d3_concentration.py`, `d4_quality_rank_disconnect.py`, `d4_quartile_divergence.py`, `d10_ceiling_observed.py` are not in the report and were not regenerated. Three of them have **July's finding written into their code as prose**, and they will render confidently false figures if anyone runs them:

- `d4_quality_rank_disconnect.py` line 55: *"The bottom quartile is better documented than the top"*; line 60: *"best-documented quartile (Q3), still ranks below Q1 and Q2"*; caption: *"n=34"*, *"The Q3 rise is shown rather than smoothed"*, *"snapshot 2026-07-25"*.
- `d4_quartile_divergence.py` line 90: *"Q4 is fractionally above Q1"*.
- `d10_ceiling_observed.py` line 51: *"The highest is exactly {top_zero:.4f}"* — September's maximum is 0.2965, below the ceiling, so "exactly" is wrong framing; caption hardcodes *"n=496"*, *"the 77 merchants"*, *"snapshot 2026-07-25"*.

Either delete them, or put a `# JULY NARRATIVE — DO NOT RUN AGAINST SEPTEMBER DATA` banner at the top of each. Leaving them as-is is how a false figure gets into v3.

---

## Order of operations

1. **Edit three scripts**: `d3b` (y-limit + annotation positions), `d4_quartile_score_vs_listing_quality` (title, callout template, caption date), `d5` (negative-share category detection, xlim, title).
2. **Re-render all five**: `npm run charts` regenerates seven scripts including all five report figures. Cheap, deterministic, no network.
3. **Eyeball all five renders** before anything goes near Notion. Specifically: does d3b now show a capped blue bar *and* the StableEnrich label; does d4 no longer say "Q1, not Q1"; does d5's amber label point at Finance & Markets.
4. **Re-upload the five PNGs into the Notion page**, replacing the July S3 copies in place.
5. **Update the four Notion captions** — Figures 4.2, 4.3, 4.4 per the report punch list, and confirm 4.1 and 4.6 need none.
6. **Cross-check the baked-in caption on Figure 4.3 against the Notion caption below it.** That figure is the only one carrying its own caption inside the image; the two must not disagree.

Steps 1–3 I can do now if you want them done rather than listed. Step 4 is yours — I cannot replace image blocks in Notion, only text.
