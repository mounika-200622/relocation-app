# Manual QA script

Run after `npm run db:seed` with the dev server up. Demo password for every seeded person and
business: **`NiraDemo#2026`** (admin: `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`).

| # | As | Steps | Expected |
|---|---|---|---|
| 1 | Visitor | Open `/`, type "Zür" in *Where*, pick Zürich, budget 1000, Search | Redirect to login (search needs an account), then results in Zürich ≤ 1000 |
| 2 | Visitor | Open `/listings/1` | Public page with gallery, facts, map, roommates and essentials; *Message owner* sends you to login |
| 3 | Visitor | Sign up as a person with a 5-char password | Inline error "at least 8 characters"; no account created |
| 4 | New user | Sign up properly | Lands on 3-step onboarding; *Skip for now* reaches `/choose-path` |
| 5 | aarav@nira.app | Log in | `/choose-path`; navbar shows *Messages 2* unread |
| 6 | aarav | `/relocate` | Pre-filtered to Zürich, *Within budget* badges, chips for type/open spots; *Map* shows price pins; URL contains the filters |
| 7 | aarav | Filters → amenities Wi-Fi + Balcony, keyword "room" | Only listings with both amenities whose text matches |
| 8 | aarav | Heart a listing, open `/saved`, *Compare up to 3* | Saved list, comparison table incl. neighbourhood counts |
| 9 | aarav | On a shareable Zürich listing, *I want to share this* | Request appears in the list; a second attempt says "already have an open request" (DB unique rule) |
| 10 | aarav | `/roommates` | Top matches (SQL view) with score rings; filters work |
| 11 | aarav | Open the chat with Priya, send a message | Appears instantly; Priya (other browser) sees it within ~3 s and the badge updates |
| 12 | aarav | Chat menu → Block | Composer replaced by "You can't message"; Priya also cannot send |
| 13 | aarav | `/guide/ch` | Emergency numbers, checklist with 3/12 ticked, costs, SIM, transport, live connection Zürich HB → Bern returns trains |
| 14 | aarav | Tick a checklist item, reload | Stays ticked |
| 15 | aarav | `/essentials` → Health tab | Pharmacies/clinics list + map; radius slider changes results |
| 16 | aarav | Trip mode → *Plan a trip*: Zürich, 3 days, 2 people, 1500 CHF | Itinerary with stay, meals, sights; spend ≤ 1500; budget meter per category |
| 17 | aarav | On the trip: swap a meal, remove a sight, add a custom item, Share link | Meter updates each time; `/share/<token>` opens read-only in a private window |
| 18 | aarav | Visit `/business` | Redirected (wrong role) |
| 19 | hello@alpinestudent.ch | Log in → `/business` | Stats, 14-day views chart, listing table |
| 20 | business | Edit a listing → upload a 6 MB file | "larger than 5 MB" error; a PNG uploads, reorder/cover/caption work |
| 21 | business | Requests page → Accept until full | Occupancy bar fills; on the last accept the rest close automatically and the listing becomes RENTED (trigger) |
| 22 | business | Row menu → Mark as rented | Toast says how many requests were closed (stored procedure) |
| 23 | admin | `/admin` | Users/listings counts, top cities (window RANK), messages per day (Mongo), audit log rows from the price/status changes above |
| 24 | admin | Reports → *Archive listing* on a report | Listing becomes ARCHIVED, report REVIEWED |
| 25 | admin | Guide & costs → edit a SIM plan price | New price shows on `/guide/ch` |
| 26 | any | Toggle light/dark, reload | Theme persists, no flash |
| 27 | phone | Open via LAN IP or the Android app | Bottom tab bar, all flows above work |
| 28 | any | `/chat/abc`, `/listings/999999`, `/api/listings/abc` | 404 page, 404 page, `{"error":"Invalid id."}` with 400 |
