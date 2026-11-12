# Roommate compatibility

Implemented twice on purpose:
- **TypeScript** `computeCompatibility()` in `src/lib/matching.ts` — used on listing pages and
  `/roommates`, unit-tested in `tests/matching.test.ts`.
- **SQL view** `v_roommate_compatibility` (migration `20261112090100_sql_objects`) — used for
  "Top matches for you", and as a DBMS showcase of `CASE` scoring inside a view.

Both give the same number for the same inputs.

## Hard filter

Only requests on **shareable, active listings in the viewer's destination city** are scored
(`JOIN Listing l ON l.cityId = vp.destinationCityId AND l.isShareable AND l.status = 'ACTIVE'`),
and a person never matches their own request. Blocked pairs are excluded in the query that
reads the view.

## Score (0–100)

| Part | Points | Rule |
|---|---|---|
| Budget overlap | 30 | `30 × smaller ÷ larger` of the viewer's monthly budget and the request's budget share (or the requester's profile budget). Unknown → 15. |
| Move-in date | 20 | `20 × max(0, 1 − |days apart| ÷ 60)`: same day = 20, 30 days = 10, ≥ 60 days = 0. Unknown → 10. |
| Gender | 20 | 20 only if (a) the listing's rule allows the viewer, (b) the viewer's roommate preference allows the requester, and (c) the requester's preference allows the viewer; otherwise 0. |
| Smoking | 10 | Same habit = 10; smoker vs non-smoker = 0; anything involving "outside only" = 5. |
| Pets | 10 | 0 if one has pets and the other is not ok with pets; else 10. |
| Social style | 5 | Same = 5; one is "balanced" = 2.5; quiet vs social = 0. |
| Sleep schedule | 5 | Same = 5; one is "flexible" = 2.5; early bird vs night owl = 0. |

Total is rounded to an integer. Labels: ≥ 85 "Excellent", ≥ 70 "Great", ≥ 50 "Good", else "Possible".

## Example

Viewer A (budget 1000, moves in on 12 Dec, balanced, night owl, fine with pets) vs requester B
(budget share 1050, moves in on 9 Dec, balanced, flexible sleep, has a cat), both non-smokers,
no gender restrictions:
budget 30 × 1000/1050 = 28.6 · move-in 20 × (1 − 3/60) = 19 · gender 20 · smoking 10 ·
pets 10 · social 5 · sleep 2.5 → **95**.

## Why both TS and SQL?

The TypeScript version scores any (viewer, request) pair on the fly, including ones that the
view would filter out (e.g. browsing another city). The SQL view lets the database rank all
candidates for a viewer in one query (`ORDER BY score DESC LIMIT n`) without loading every
profile into the application.
