# Normalization and integrity

## 1. Normal forms

**1NF – atomic values, no repeating groups.**
- v1 stored all photos as one JSON array in `Listing.photos`. v2 moves them to `ListingPhoto`
  (one row per photo, with `position` and `caption`). The old column survives only as
  `legacyPhotos` until `scripts/migrate-legacy-photos.ts` has run.
- Multi-valued attributes get their own tables: amenities → `ListingAmenity`, spoken
  languages → `UserLanguage`, trip interests → `ItineraryInterest`, favourites → `SavedListing`,
  ticked checklist steps → `UserChecklistProgress`.

**2NF – no partial dependency on part of a composite key.**
- Every composite-key table is a pure association table (`ListingAmenity`, `SavedListing`,
  `UserLanguage`, `UserChecklistProgress`, `Block`, `ItineraryInterest`). Their only non-key
  columns (e.g. `SavedListing.createdAt`) describe the *pair*, not one half of it.

**3NF – no transitive dependencies.**
- Location facts live once: `Listing.cityId → City.countryId → Country.currency`. A listing
  does not repeat the city name or country.
- v1 had free-text `Country.name` / `City.name` typed by owners (duplicates and typos).
  v2 loads `Country → Region → City` from a dataset; forms only accept ids from these tables.
- Account data is split by role: `User` (login), `UserProfile` (relocation facts) and
  `BusinessProfile` (public business info). None of them repeats another's columns.
- Prices for estimates are keyed by `(country, city, category, tier)` in `CostEstimate`
  instead of being written into places or guide articles.

## 2. Intentional denormalization (and why)

| Column | Why it's duplicated | How it stays correct |
|---|---|---|
| `Listing.currency` | A listing's price must keep its currency even if the country's currency data changes. | Set from `Country.currency` when the listing is created; the owner can change it. |
| `Listing.currentOccupants` | Needed in every search and in the CHECK `currentOccupants <= capacityMax`; counting `MATCHED` requests on every query would be slow and couldn't be constrained. | Only changed inside the accept-request transaction (row lock + conditional update). Trigger `trg_listing_occupancy_bu` keeps `status` in sync. |
| `Conversation.lastMessageAt / lastMessagePreview / lastSenderId` | The inbox must sort and preview without reading MongoDB for every conversation. | Updated by `sendMessage()` right after the Mongo insert succeeds. |
| `RoommateRequest.openRequesterId` | Emulates a *partial unique index* (MySQL has none): one OPEN request per person per listing. | Maintained by triggers `trg_request_open_bi/bu`: equals `requesterId` while OPEN, otherwise NULL. |
| `ItineraryItem.title / lat / lng` | An itinerary must survive its POI being refreshed or purged from the cache. | Snapshot taken when the item is planned or swapped. |
| `POI.tags` (JSON) | Raw OpenStreetMap tags are only *displayed*, never filtered on. Everything we query (category, name, coordinates, opening hours, cuisine, price tier) is a real column. | Rewritten on every cache refresh. |
| `AuditLog.oldValue / newValue` (JSON) | A history record is a snapshot; it is never joined or filtered by content. | Written only by trigger `trg_listing_audit_au`. |

## 3. Keys and constraints

- **Primary keys:** surrogate `INT AUTO_INCREMENT` ids; composite PKs for association tables;
  natural PK for `Language(code)` and `ExchangeRate(base, quote)`.
- **Unique keys:** `User.email`, `Country.isoCode`, `Country.name`, `(Region.countryId, isoCode)`,
  `(City.countryId, regionId, name)`, `POI.osmId`, `(PoiQueryCache.areaKey, category)`,
  `(Conversation.userAId, userBId, contextKey)`, `(GuideArticle.countryId, slug)`,
  `Itinerary.shareToken`, `PasswordResetToken.tokenHash`, `(ListingView.listingId, viewerKey, viewedOn)`.
- **CHECK constraints (27):** prices/deposits ≥ 0, `capacityMin ≤ capacityMax`,
  `0 ≤ currentOccupants ≤ capacityMax`, latitude/longitude ranges, price tiers 1–4,
  `minPrice ≤ maxPrice`, trip days 1–30, budget > 0, budget split = 100 %, item cost ≥ 0 …
  (full list in [data-dictionary.md](data-dictionary.md)).
- **Triggers instead of CHECK where MySQL forbids it:** MySQL rejects CHECKs on columns that
  have `ON DELETE CASCADE` foreign keys, so "`userAId < userBId`" (Conversation) and
  "you cannot block yourself" (Block) are enforced by `BEFORE INSERT` triggers that `SIGNAL`.

## 4. ON DELETE rules

| Relationship | Rule | Reasoning |
|---|---|---|
| User → UserProfile, BusinessProfile, UserLanguage, tokens | CASCADE | Owned by the account. |
| User → Listing (owner) | CASCADE | Deleting a business removes its listings; the API also deletes stored photos. |
| Listing → ListingPhoto, ListingAmenity, SavedListing, ListingView, RoommateRequest | CASCADE | Meaningless without the listing. |
| Listing → Conversation | SET NULL | People should still be able to finish their chat. |
| Listing / POI → ItineraryItem | SET NULL | Trips keep the item with its snapshot title and cost. |
| City → Listing, Itinerary | RESTRICT | Never lose a location that is in use. |
| Country → City | RESTRICT | Same. |
| Region → City | SET NULL | A city can exist without a region. |
| User → Conversation (A or B) | CASCADE | The header goes; the API deletes the Mongo messages too. |
| User → Report (reporter, reported) | CASCADE | Reports about/by a deleted account are void. |
| User → Report.resolvedBy | SET NULL | Keep the moderation record if an admin account is removed. |
| Amenity → ListingAmenity | RESTRICT | Don't silently drop an amenity that listings use. |
| Country/City → guide and cost tables | CASCADE | Content belongs to its location. |

## 5. Integrity across the two databases

MongoDB has no foreign keys. The application keeps the logical references valid:
- Messages are inserted only after `loadConversationFor()` proved the MySQL conversation
  exists and the sender is a participant.
- Deleting an account deletes the user's conversations in MySQL (CASCADE) and then their
  message documents (`deleteMessagesOf`) and notifications (`deleteNotificationsOf`).
- Notifications are disposable (TTL 90 days), so a dangling `userId` is harmless.
