# Trip planner algorithm

Code: `src/lib/budget.ts` (money), `src/lib/trip/planner.ts` (pure planner, unit-tested),
`src/lib/trip/generate.ts` (loads data, converts currencies, saves the result).
Tests: `tests/budget.test.ts`, `tests/planner.test.ts`.

## Inputs

City (from the cascading location picker), days (1–30), people, rooms (default ⌈people/2⌉),
total budget + currency, start date, style (budget / balanced / comfort), pace (relaxed /
normal / packed), where to sleep (any / hostel / hotel / apartment), interests, and the budget
split (default **stay 40 % · food 30 % · activities 20 % · transport 10 %**, adjustable with
sliders that always keep the total at 100 %).

## 1. Collect candidates (no hard-coded places)

1. Make sure the place cache covers the city: one Overpass query per group, each with its own
   radius so dense restaurant areas can't crowd out the rest —
   stays 2.5 km, food 1.5 km, culture sights 2 km, outdoor sights 2 km. Results are cached in
   MySQL (`POI`, `PoiQueryCache`) for 7 days; if the service is down we plan from the cache.
2. Price every candidate from its **price tier** (derived from OSM tags, see
   `src/lib/poi/price-tier.ts`) and the city's `CostEstimate` rows (fallback: country rows,
   then a generic USD table). The planning price is the **midpoint** of the tier's range.
3. Short-stay listings from our own database (`minStayMonths = 1`) join the stay candidates at
   `monthly price ÷ 30 × 1.5` (short-stay premium).
4. If no stays are cached at all, the planner books a clearly labelled estimate line per tier
   ("Mid-range hotel in Zürich (price estimate)") so the budget is still realistic.
5. Convert every price to the trip currency once (`ExchangeRate`, cached 24 h).

## 2. Budget ledger — the "never exceeds the budget" guarantee

`allocate(total, split)` turns the split into four caps **in integer cents**, so the parts add
up exactly to the total. A `BudgetLedger` holds those caps and refuses (`tryAdd → false`) any
cost that would push either the **category** or the **overall** spend over its cap. Every item
the planner adds goes through the ledger, so the plan can't exceed the budget by construction.
After the stay is booked, unused stay money is moved to activities (`reassign`).

## 3. Planning steps

1. **Stay** – the whole stay is `room-night price × nights × rooms` (nights = days − 1, min 1).
   `pickByStyle` chooses among stays that fit the stay cap:
   *budget* → cheapest, *comfort* → most expensive, *balanced* → closest to 70 % of the cap
   (ties → nearer to the centre).
2. **Each day**
   - **Transport:** `day-pass price × people` if the transport cap allows it.
   - **Sights:** starting at the lodging, repeatedly take the **nearest unvisited** sight that
     the activities cap can afford (greedy nearest-neighbour chain), up to 2 / 3 / 4 per day for
     relaxed / normal / packed. This clusters each day geographically so it is walkable. The
     day's stops are re-ordered from the lodging with `nearestNeighbourOrder`.
     Slots: morning → afternoon → afternoon → evening.
   - **Meals:** breakfast near the lodging, lunch near the first sight, dinner near the last.
     The daily food budget per person is split 20 / 35 / 45 % (breakfast / lunch / dinner);
     among the 25 nearest unused places the style rule picks one. If nothing fits, the plan says
     "supermarket picnic" (cost 0) instead of overspending.
   - **Evening (normal/packed):** a viewpoint, or a bar if "nightlife" is an interest.
3. Places are never repeated within a trip.

## 4. Minimum viable budget

`cheapest room-night × nights × rooms + cheapest meal × 2 × days × people + cheapest day pass × days × people`.
If the budget is below it, the trip is still generated with what fits, `minViableBudget` is
stored, and the UI explains the shortfall.

## 5. After generation

- **Budget meter:** per category `spent / cap` and total remaining (`summarize()`), recomputed
  whenever an item is added, removed or swapped.
- **Swap:** up to 3 alternatives in the same category group and the **same price tier**, nearest
  to the original, not already in the trip.
- **Regenerate / duplicate:** done in one transaction (delete + insert, or copy).
- **Share:** a random 128-bit token gives a read-only public page (`/share/<token>`).

## Complexity

Per day the nearest-neighbour step is O(n²) in the number of candidate sights (≤ 160 after
the 80-per-category cap), which is instant at this size; meal choice looks at the 25 nearest
candidates only.
