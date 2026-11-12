# Data dictionary

Generated from `information_schema` of the migrated database (`npx tsx scripts/docs/data-dictionary.ts`).

**37 tables**, 53 foreign keys, 27 CHECK constraints, 112 indexes, 2 views.

Key: **PK** primary key · **FK → T.c (rule)** foreign key with its ON DELETE rule · **UQ** part of a unique key · **IDX** indexed.

## Tables

- [Amenity](#amenity) — Amenity catalogue (wifi, washer …).
- [AuditLog](#auditlog) — Price/status history of listings, written by a trigger.
- [Bank](#bank) — Banks and student accounts per country.
- [Block](#block) — A user blocking another user (no messages either way).
- [BusinessProfile](#businessprofile) — Public profile of a BUSINESS account (1:1), verified flag set by admins.
- [ChecklistTemplate](#checklisttemplate) — First-week checklist steps per country/city.
- [City](#city) — Cities, linked to country and (optionally) region.
- [Conversation](#conversation) — Chat header between two users (optionally about a listing / request). Message bodies are in MongoDB.
- [CostEstimate](#costestimate) — Indicative prices per country/city, category and price tier.
- [Country](#country) — Countries with ISO code, currency and coordinates.
- [EmergencyNumber](#emergencynumber) — Emergency numbers per country.
- [ExchangeRate](#exchangerate) — Cached currency exchange rates (24 h).
- [GuideArticle](#guidearticle) — Settling-in guide articles (Markdown) per country/city.
- [Itinerary](#itinerary) — A generated trip plan (budget, split, style).
- [ItineraryInterest](#itineraryinterest) — Multi-valued interests of an itinerary (1NF).
- [ItineraryItem](#itineraryitem) — One stop of an itinerary (day, slot, cost, place).
- [Language](#language) — Language catalogue (ISO-ish codes).
- [Listing](#listing) — A place to live offered by a BUSINESS account.
- [ListingAmenity](#listingamenity) — M:N – amenities of a listing.
- [ListingPhoto](#listingphoto) — Photos of a listing (URL + storage key + order).
- [ListingView](#listingview) — One row per (listing, visitor, day) for unique daily view counts.
- [PasswordResetToken](#passwordresettoken) — One-time password-reset tokens (only the SHA-256 hash is stored).
- [POI](#poi) — Cached OpenStreetMap / Google places with derived price tier.
- [PoiQueryCache](#poiquerycache) — Which (area, category) place queries were fetched and when (7-day freshness).
- [Region](#region) — States / cantons / provinces of a country.
- [Report](#report) — Reports of users or listings, reviewed by admins.
- [RoommateRequest](#roommaterequest) — A USER asking to share a shareable listing (OPEN → MATCHED/CLOSED/WITHDRAWN).
- [SavedListing](#savedlisting) — M:N – a user's favourite listings.
- [SimPlan](#simplan) — Plans of a SIM provider.
- [SimProvider](#simprovider) — Mobile operators / MVNOs per country.
- [SupermarketChain](#supermarketchain) — Supermarket chains with a price tier per country.
- [TransportMode](#transportmode) — How public transport works per country (train, tram …).
- [TransportPass](#transportpass) — Passes and tickets per country or city.
- [User](#user) — Every account (USER, BUSINESS, ADMIN). Passwords are bcrypt hashes.
- [UserChecklistProgress](#userchecklistprogress) — M:N – which checklist steps a user ticked.
- [UserLanguage](#userlanguage) — M:N – languages a user speaks.
- [UserProfile](#userprofile) — Relocation profile of a USER (1:1): destination, budget, lifestyle used for matching.

## Amenity

Amenity catalogue (wifi, washer …).

| Column | Type | Null | Default | Keys / constraints |
|---|---|---|---|---|
| id | `int` | no |  | **PK**, auto_increment |
| code | `varchar(40)` | no |  | UQ |
| label | `varchar(60)` | no |  |  |

**Indexes:** `Amenity_code_key` (code) unique · `PRIMARY` (id) unique

## AuditLog

Price/status history of listings, written by a trigger.

| Column | Type | Null | Default | Keys / constraints |
|---|---|---|---|---|
| id | `bigint` | no |  | **PK**, auto_increment |
| tableName | `varchar(64)` | no |  | IDX |
| rowId | `int` | no |  |  |
| action | `varchar(20)` | no |  |  |
| oldValue | `json` | yes |  |  |
| newValue | `json` | yes |  |  |
| changedAt | `datetime(3)` | no | CURRENT_TIMESTAMP(3) |  |

**Indexes:** `AuditLog_tableName_rowId_changedAt_idx` (tableName,rowId,changedAt) · `PRIMARY` (id) unique

## Bank

Banks and student accounts per country.

| Column | Type | Null | Default | Keys / constraints |
|---|---|---|---|---|
| id | `int` | no |  | **PK**, auto_increment |
| countryId | `int` | no |  | FK → Country.id (CASCADE) |
| name | `varchar(80)` | no |  |  |
| kind | `varchar(40)` | no |  |  |
| studentAccount | `tinyint(1)` | no | 0 |  |
| monthlyFee | `decimal(8,2)` | yes |  |  |
| currency | `char(3)` | no |  |  |
| notes | `varchar(300)` | yes |  |  |
| website | `varchar(200)` | yes |  |  |

**Indexes:** `Bank_countryId_name_key` (countryId,name) unique · `PRIMARY` (id) unique

## Block

A user blocking another user (no messages either way).

| Column | Type | Null | Default | Keys / constraints |
|---|---|---|---|---|
| blockerId | `int` | no |  | **PK**, FK → User.id (CASCADE) |
| blockedId | `int` | no |  | **PK**, FK → User.id (CASCADE) |
| createdAt | `datetime(3)` | no | CURRENT_TIMESTAMP(3) |  |

**Indexes:** `Block_blockedId_idx` (blockedId) · `PRIMARY` (blockerId,blockedId) unique

## BusinessProfile

Public profile of a BUSINESS account (1:1), verified flag set by admins.

| Column | Type | Null | Default | Keys / constraints |
|---|---|---|---|---|
| userId | `int` | no |  | **PK**, FK → User.id (CASCADE) |
| displayName | `varchar(120)` | no |  |  |
| description | `varchar(1000)` | yes |  |  |
| isVerified | `tinyint(1)` | no | 0 |  |
| verifiedAt | `datetime(3)` | yes |  |  |
| updatedAt | `datetime(3)` | no | CURRENT_TIMESTAMP(3) |  |

**Indexes:** `PRIMARY` (userId) unique

## ChecklistTemplate

First-week checklist steps per country/city.

| Column | Type | Null | Default | Keys / constraints |
|---|---|---|---|---|
| id | `int` | no |  | **PK**, auto_increment |
| countryId | `int` | no |  | FK → Country.id (CASCADE) |
| cityId | `int` | yes |  | FK → City.id (CASCADE) |
| category | `enum('BASICS','HOUSING','HEALTHCARE','MONEY','GROCERIES','TRANSPORT','SIM','LEGAL','CULTURE')` | no |  |  |
| title | `varchar(160)` | no |  |  |
| description | `varchar(600)` | no |  |  |
| dueWithinDays | `smallint` | yes |  |  |
| link | `varchar(300)` | yes |  |  |
| position | `smallint` | no | 0 |  |

**Indexes:** `ChecklistTemplate_cityId_idx` (cityId) · `ChecklistTemplate_countryId_position_idx` (countryId,position) · `ChecklistTemplate_countryId_title_key` (countryId,title) unique · `PRIMARY` (id) unique

## City

Cities, linked to country and (optionally) region.

| Column | Type | Null | Default | Keys / constraints |
|---|---|---|---|---|
| id | `int` | no |  | **PK**, auto_increment |
| name | `varchar(120)` | no |  | IDX |
| countryId | `int` | no |  | FK → Country.id (RESTRICT) |
| lat | `double` | yes |  |  |
| lng | `double` | yes |  |  |
| regionId | `int` | yes |  | FK → Region.id (SET NULL) |

**Indexes:** `City_countryId_name_idx` (countryId,name) · `City_countryId_regionId_name_key` (countryId,regionId,name) unique · `City_name_idx` (name) · `City_regionId_name_idx` (regionId,name) · `PRIMARY` (id) unique

## Conversation

Chat header between two users (optionally about a listing / request). Message bodies are in MongoDB.

| Column | Type | Null | Default | Keys / constraints |
|---|---|---|---|---|
| id | `int` | no |  | **PK**, auto_increment |
| listingId | `int` | yes |  | FK → Listing.id (SET NULL) |
| userAId | `int` | no |  | FK → User.id (CASCADE) |
| userBId | `int` | no |  | FK → User.id (CASCADE) |
| createdAt | `datetime(3)` | no | CURRENT_TIMESTAMP(3) |  |
| contextKey | `int` | no | 0 |  |
| lastMessageAt | `datetime(3)` | no | CURRENT_TIMESTAMP(3) |  |
| lastMessagePreview | `varchar(160)` | yes |  |  |
| lastSenderId | `int` | yes |  |  |
| roommateRequestId | `int` | yes |  | FK → RoommateRequest.id (SET NULL) |

**Indexes:** `Conversation_listingId_idx` (listingId) · `Conversation_roommateRequestId_idx` (roommateRequestId) · `Conversation_userAId_lastMessageAt_idx` (userAId,lastMessageAt) · `Conversation_userAId_userBId_contextKey_key` (userAId,userBId,contextKey) unique · `Conversation_userBId_lastMessageAt_idx` (userBId,lastMessageAt) · `PRIMARY` (id) unique

## CostEstimate

Indicative prices per country/city, category and price tier.

| Column | Type | Null | Default | Keys / constraints |
|---|---|---|---|---|
| id | `int` | no |  | **PK**, auto_increment |
| countryId | `int` | no |  | FK → Country.id (CASCADE) |
| cityId | `int` | yes |  | FK → City.id (CASCADE) |
| category | `enum('RENT_SHARED_ROOM','RENT_STUDIO','RENT_ONE_BEDROOM','GROCERIES_MONTH','TRANSPORT_MONTH','TRANSPORT_DAY','PHONE_MONTH','MEAL','COFFEE','STAY_NIGHT','ATTRACTION_ENTRY')` | no |  |  |
| tier | `tinyint` | no | 0 |  |
| minPrice | `decimal(10,2)` | no |  |  |
| maxPrice | `decimal(10,2)` | no |  |  |
| currency | `char(3)` | no |  |  |
| source | `varchar(200)` | yes |  |  |
| updatedAt | `datetime(3)` | no | CURRENT_TIMESTAMP(3) |  |

**Indexes:** `CostEstimate_cityId_category_idx` (cityId,category) · `CostEstimate_countryId_cityId_category_tier_key` (countryId,cityId,category,tier) unique · `PRIMARY` (id) unique

**CHECK constraints:**
- `chk_cost_range`: `((minPrice >= 0) and (minPrice <= maxPrice))`
- `chk_cost_tier`: `(tier between 0 and 4)`

## Country

Countries with ISO code, currency and coordinates.

| Column | Type | Null | Default | Keys / constraints |
|---|---|---|---|---|
| id | `int` | no |  | **PK**, auto_increment |
| name | `varchar(100)` | no |  | UQ |
| currency | `char(3)` | no | USD |  |
| flag | `varchar(16)` | yes |  |  |
| isoCode | `char(2)` | no |  | UQ |
| lat | `double` | yes |  |  |
| lng | `double` | yes |  |  |
| phoneCode | `varchar(20)` | yes |  |  |

**Indexes:** `Country_isoCode_key` (isoCode) unique · `Country_name_key` (name) unique · `PRIMARY` (id) unique

## EmergencyNumber

Emergency numbers per country.

| Column | Type | Null | Default | Keys / constraints |
|---|---|---|---|---|
| id | `int` | no |  | **PK**, auto_increment |
| countryId | `int` | no |  | FK → Country.id (CASCADE) |
| service | `varchar(60)` | no |  |  |
| number | `varchar(20)` | no |  |  |
| notes | `varchar(200)` | yes |  |  |

**Indexes:** `EmergencyNumber_countryId_service_key` (countryId,service) unique · `PRIMARY` (id) unique

## ExchangeRate

Cached currency exchange rates (24 h).

| Column | Type | Null | Default | Keys / constraints |
|---|---|---|---|---|
| base | `char(3)` | no |  | **PK** |
| quote | `char(3)` | no |  | **PK** |
| rate | `decimal(18,8)` | no |  |  |
| fetchedAt | `datetime(3)` | no | CURRENT_TIMESTAMP(3) |  |

**Indexes:** `PRIMARY` (base,quote) unique

**CHECK constraints:**
- `chk_rate_positive`: `(rate > 0)`

## GuideArticle

Settling-in guide articles (Markdown) per country/city.

| Column | Type | Null | Default | Keys / constraints |
|---|---|---|---|---|
| id | `int` | no |  | **PK**, auto_increment |
| countryId | `int` | no |  | FK → Country.id (CASCADE) |
| cityId | `int` | yes |  | FK → City.id (CASCADE) |
| category | `enum('BASICS','HOUSING','HEALTHCARE','MONEY','GROCERIES','TRANSPORT','SIM','LEGAL','CULTURE')` | no |  |  |
| slug | `varchar(120)` | no |  |  |
| title | `varchar(160)` | no |  | IDX |
| summary | `varchar(400)` | no |  |  |
| body | `text` | no |  |  |
| sourceName | `varchar(120)` | yes |  |  |
| sourceUrl | `varchar(300)` | yes |  |  |
| position | `smallint` | no | 0 |  |
| updatedAt | `datetime(3)` | no | CURRENT_TIMESTAMP(3) |  |

**Indexes:** `GuideArticle_cityId_idx` (cityId) · `GuideArticle_countryId_category_position_idx` (countryId,category,position) · `GuideArticle_countryId_slug_key` (countryId,slug) unique · `GuideArticle_title_summary_body_idx` (title,summary,body) FULLTEXT · `PRIMARY` (id) unique

## Itinerary

A generated trip plan (budget, split, style).

| Column | Type | Null | Default | Keys / constraints |
|---|---|---|---|---|
| id | `int` | no |  | **PK**, auto_increment |
| userId | `int` | no |  | FK → User.id (CASCADE) |
| cityId | `int` | no |  | FK → City.id (RESTRICT) |
| days | `smallint` | no |  |  |
| peopleCount | `smallint` | no |  |  |
| budget | `decimal(10,2)` | no |  |  |
| createdAt | `datetime(3)` | no | CURRENT_TIMESTAMP(3) |  |
| currency | `char(3)` | no |  |  |
| minViableBudget | `decimal(10,2)` | yes |  |  |
| pace | `enum('RELAXED','NORMAL','PACKED')` | no | NORMAL |  |
| pctActivities | `tinyint` | no | 20 |  |
| pctFood | `tinyint` | no | 30 |  |
| pctStay | `tinyint` | no | 40 |  |
| pctTransport | `tinyint` | no | 10 |  |
| roomsNeeded | `smallint` | no | 1 |  |
| shareToken | `char(32)` | yes |  | UQ |
| startDate | `date` | yes |  |  |
| stayPreference | `enum('ANY','HOSTEL','HOTEL','APARTMENT')` | no | ANY |  |
| style | `enum('BUDGET','BALANCED','COMFORT')` | no | BALANCED |  |
| title | `varchar(120)` | no |  |  |
| updatedAt | `datetime(3)` | no | CURRENT_TIMESTAMP(3) |  |

**Indexes:** `Itinerary_cityId_idx` (cityId) · `Itinerary_shareToken_key` (shareToken) unique · `Itinerary_userId_createdAt_idx` (userId,createdAt) · `PRIMARY` (id) unique

**CHECK constraints:**
- `chk_itin_budget`: `(budget > 0)`
- `chk_itin_days`: `(days between 1 and 30)`
- `chk_itin_people`: `((peopleCount between 1 and 50) and (roomsNeeded between 1 and 50))`
- `chk_itin_split`: `((pctStay between 0 and 100) and (pctFood between 0 and 100) and (pctActivities between 0 and 100) and (pctTransport between 0 and 100) and ((((pctStay + pctFood) + pctActivities) + pctTransport) = 100))`

## ItineraryInterest

Multi-valued interests of an itinerary (1NF).

| Column | Type | Null | Default | Keys / constraints |
|---|---|---|---|---|
| itineraryId | `int` | no |  | **PK**, FK → Itinerary.id (CASCADE) |
| interest | `enum('CULTURE','FOOD','NATURE','NIGHTLIFE','SHOPPING','ADVENTURE','FAMILY')` | no |  | **PK** |

**Indexes:** `PRIMARY` (itineraryId,interest) unique

## ItineraryItem

One stop of an itinerary (day, slot, cost, place).

| Column | Type | Null | Default | Keys / constraints |
|---|---|---|---|---|
| id | `int` | no |  | **PK**, auto_increment |
| itineraryId | `int` | no |  | FK → Itinerary.id (CASCADE) |
| dayNumber | `smallint` | no |  |  |
| poiId | `int` | yes |  | FK → POI.id (SET NULL) |
| listingId | `int` | yes |  | FK → Listing.id (SET NULL) |
| timeSlot | `enum('STAY','MORNING','LUNCH','AFTERNOON','DINNER','EVENING')` | no |  |  |
| estimatedCost | `decimal(10,2)` | no |  |  |
| kind | `enum('STAY','FOOD','ACTIVITY','TRANSPORT')` | no |  |  |
| lat | `double` | yes |  |  |
| lng | `double` | yes |  |  |
| notes | `varchar(300)` | yes |  |  |
| position | `smallint` | no | 0 |  |
| title | `varchar(200)` | no |  |  |

**Indexes:** `ItineraryItem_itineraryId_dayNumber_position_idx` (itineraryId,dayNumber,position) · `ItineraryItem_listingId_idx` (listingId) · `ItineraryItem_poiId_idx` (poiId) · `PRIMARY` (id) unique

**CHECK constraints:**
- `chk_item_cost`: `(estimatedCost >= 0)`
- `chk_item_day`: `(dayNumber >= 1)`

## Language

Language catalogue (ISO-ish codes).

| Column | Type | Null | Default | Keys / constraints |
|---|---|---|---|---|
| code | `varchar(8)` | no |  | **PK** |
| name | `varchar(60)` | no |  | UQ |

**Indexes:** `Language_name_key` (name) unique · `PRIMARY` (code) unique

## Listing

A place to live offered by a BUSINESS account.

| Column | Type | Null | Default | Keys / constraints |
|---|---|---|---|---|
| id | `int` | no |  | **PK**, auto_increment |
| ownerId | `int` | no |  | FK → User.id (CASCADE) |
| cityId | `int` | no |  | FK → City.id (RESTRICT) |
| type | `enum('DORM','APARTMENT','STUDIO','SHARED_ROOM','PRIVATE_ROOM')` | no |  | IDX |
| title | `varchar(140)` | no |  | IDX |
| address | `varchar(255)` | no |  |  |
| price | `decimal(10,2)` | no |  |  |
| isShareable | `tinyint(1)` | no | 0 |  |
| legacyPhotos | `longtext` | yes |  |  |
| createdAt | `datetime(3)` | no | CURRENT_TIMESTAMP(3) |  |
| capacityMax | `smallint` | no | 1 |  |
| capacityMin | `smallint` | no | 1 |  |
| currency | `char(3)` | no | USD |  |
| currentOccupants | `smallint` | no | 0 |  |
| preference | `enum('ANYONE','FEMALE_ONLY','MALE_ONLY')` | no | ANYONE |  |
| availableFrom | `date` | yes |  | IDX |
| bathrooms | `smallint` | no | 1 |  |
| bedrooms | `smallint` | no | 1 |  |
| billsEstimate | `decimal(10,2)` | yes |  |  |
| deposit | `decimal(10,2)` | no | 0.00 |  |
| description | `text` | yes |  |  |
| furnished | `tinyint(1)` | no | 0 |  |
| guestsAllowed | `tinyint(1)` | no | 1 |  |
| lat | `double` | yes |  | IDX |
| lng | `double` | yes |  |  |
| minStayMonths | `smallint` | no | 1 |  |
| petsAllowed | `tinyint(1)` | no | 0 |  |
| sizeSqm | `smallint` | yes |  |  |
| smokingAllowed | `tinyint(1)` | no | 0 |  |
| status | `enum('ACTIVE','RENTED','ARCHIVED')` | no | ACTIVE | IDX |
| updatedAt | `datetime(3)` | no | CURRENT_TIMESTAMP(3) |  |
| utilitiesIncluded | `tinyint(1)` | no | 0 |  |

**Indexes:** `Listing_availableFrom_idx` (availableFrom) · `Listing_cityId_status_price_idx` (cityId,status,price) · `Listing_lat_lng_idx` (lat,lng) · `Listing_ownerId_status_idx` (ownerId,status) · `Listing_status_createdAt_idx` (status,createdAt) · `Listing_title_description_idx` (title,description) FULLTEXT · `Listing_type_idx` (type) · `PRIMARY` (id) unique

**CHECK constraints:**
- `chk_listing_bills`: `((billsEstimate is null) or (billsEstimate >= 0))`
- `chk_listing_capacity`: `((capacityMin >= 1) and (capacityMin <= capacityMax))`
- `chk_listing_deposit`: `(deposit >= 0)`
- `chk_listing_lat`: `((lat is null) or (lat between -(90) and 90))`
- `chk_listing_lng`: `((lng is null) or (lng between -(180) and 180))`
- `chk_listing_min_stay`: `(minStayMonths >= 1)`
- `chk_listing_occupants`: `((currentOccupants >= 0) and (currentOccupants <= capacityMax))`
- `chk_listing_price`: `(price >= 0)`
- `chk_listing_rooms`: `((bedrooms >= 0) and (bathrooms >= 0))`
- `chk_listing_size`: `((sizeSqm is null) or (sizeSqm > 0))`

## ListingAmenity

M:N – amenities of a listing.

| Column | Type | Null | Default | Keys / constraints |
|---|---|---|---|---|
| listingId | `int` | no |  | **PK**, FK → Listing.id (CASCADE) |
| amenityId | `int` | no |  | **PK**, FK → Amenity.id (RESTRICT) |

**Indexes:** `ListingAmenity_amenityId_idx` (amenityId) · `PRIMARY` (listingId,amenityId) unique

## ListingPhoto

Photos of a listing (URL + storage key + order).

| Column | Type | Null | Default | Keys / constraints |
|---|---|---|---|---|
| id | `int` | no |  | **PK**, auto_increment |
| listingId | `int` | no |  | FK → Listing.id (CASCADE) |
| url | `varchar(500)` | no |  |  |
| storageKey | `varchar(255)` | no |  |  |
| position | `smallint` | no | 0 |  |
| caption | `varchar(140)` | yes |  |  |
| createdAt | `datetime(3)` | no | CURRENT_TIMESTAMP(3) |  |

**Indexes:** `ListingPhoto_listingId_position_idx` (listingId,position) · `PRIMARY` (id) unique

## ListingView

One row per (listing, visitor, day) for unique daily view counts.

| Column | Type | Null | Default | Keys / constraints |
|---|---|---|---|---|
| id | `int` | no |  | **PK**, auto_increment |
| listingId | `int` | no |  | FK → Listing.id (CASCADE) |
| viewerId | `int` | yes |  | FK → User.id (SET NULL) |
| viewerKey | `char(64)` | no |  |  |
| viewedOn | `date` | no |  |  |
| viewedAt | `datetime(3)` | no | CURRENT_TIMESTAMP(3) |  |

**Indexes:** `ListingView_listingId_viewerKey_viewedOn_key` (listingId,viewerKey,viewedOn) unique · `ListingView_viewerId_viewedAt_idx` (viewerId,viewedAt) · `PRIMARY` (id) unique

## PasswordResetToken

One-time password-reset tokens (only the SHA-256 hash is stored).

| Column | Type | Null | Default | Keys / constraints |
|---|---|---|---|---|
| id | `int` | no |  | **PK**, auto_increment |
| userId | `int` | no |  | FK → User.id (CASCADE) |
| tokenHash | `char(64)` | no |  | UQ |
| expiresAt | `datetime(3)` | no |  |  |
| usedAt | `datetime(3)` | yes |  |  |
| createdAt | `datetime(3)` | no | CURRENT_TIMESTAMP(3) |  |

**Indexes:** `PasswordResetToken_tokenHash_key` (tokenHash) unique · `PasswordResetToken_userId_idx` (userId) · `PRIMARY` (id) unique

## POI

Cached OpenStreetMap / Google places with derived price tier.

| Column | Type | Null | Default | Keys / constraints |
|---|---|---|---|---|
| id | `int` | no |  | **PK**, auto_increment |
| cityId | `int` | yes |  | FK → City.id (SET NULL) |
| name | `varchar(200)` | no |  |  |
| category | `enum('RESTAURANT','CAFE','FAST_FOOD','SUPERMARKET','CONVENIENCE','HOSPITAL','CLINIC','PHARMACY','DOCTOR','BANK','ATM','TRANSIT','MOBILE_SHOP','LAUNDRY','GYM','UNIVERSITY','POST_OFFICE','POLICE','HOTEL','HOSTEL','GUEST_HOUSE','CAMP_SITE','ATTRACTION','MUSEUM','VIEWPOINT','GALLERY','HISTORIC','PARK','NIGHTLIFE','SHOPPING')` | no |  | IDX |
| address | `varchar(255)` | yes |  |  |
| lat | `double` | no |  | IDX |
| lng | `double` | no |  |  |
| priceTier | `tinyint` | yes |  |  |
| lastSyncedAt | `datetime(3)` | no | CURRENT_TIMESTAMP(3) |  |
| cuisine | `varchar(120)` | yes |  |  |
| openingHours | `varchar(255)` | yes |  |  |
| osmId | `varchar(64)` | no |  | UQ |
| tags | `json` | yes |  |  |
| website | `varchar(255)` | yes |  |  |

**Indexes:** `POI_category_lat_lng_idx` (category,lat,lng) · `POI_cityId_category_idx` (cityId,category) · `POI_lat_lng_idx` (lat,lng) · `POI_osmId_key` (osmId) unique · `PRIMARY` (id) unique

**CHECK constraints:**
- `chk_poi_lat`: `(lat between -(90) and 90)`
- `chk_poi_lng`: `(lng between -(180) and 180)`
- `chk_poi_tier`: `((priceTier is null) or (priceTier between 1 and 4))`

## PoiQueryCache

Which (area, category) place queries were fetched and when (7-day freshness).

| Column | Type | Null | Default | Keys / constraints |
|---|---|---|---|---|
| id | `int` | no |  | **PK**, auto_increment |
| areaKey | `varchar(64)` | no |  | IDX |
| category | `enum('RESTAURANT','CAFE','FAST_FOOD','SUPERMARKET','CONVENIENCE','HOSPITAL','CLINIC','PHARMACY','DOCTOR','BANK','ATM','TRANSIT','MOBILE_SHOP','LAUNDRY','GYM','UNIVERSITY','POST_OFFICE','POLICE','HOTEL','HOSTEL','GUEST_HOUSE','CAMP_SITE','ATTRACTION','MUSEUM','VIEWPOINT','GALLERY','HISTORIC','PARK','NIGHTLIFE','SHOPPING')` | no |  |  |
| resultCount | `int` | no | 0 |  |
| fetchedAt | `datetime(3)` | no | CURRENT_TIMESTAMP(3) |  |

**Indexes:** `PoiQueryCache_areaKey_category_key` (areaKey,category) unique · `PRIMARY` (id) unique

## Region

States / cantons / provinces of a country.

| Column | Type | Null | Default | Keys / constraints |
|---|---|---|---|---|
| id | `int` | no |  | **PK**, auto_increment |
| countryId | `int` | no |  | FK → Country.id (CASCADE) |
| isoCode | `varchar(10)` | no |  |  |
| name | `varchar(120)` | no |  |  |
| lat | `double` | yes |  |  |
| lng | `double` | yes |  |  |

**Indexes:** `PRIMARY` (id) unique · `Region_countryId_isoCode_key` (countryId,isoCode) unique · `Region_countryId_name_idx` (countryId,name)

## Report

Reports of users or listings, reviewed by admins.

| Column | Type | Null | Default | Keys / constraints |
|---|---|---|---|---|
| id | `int` | no |  | **PK**, auto_increment |
| reporterId | `int` | no |  | FK → User.id (CASCADE) |
| reportedUserId | `int` | yes |  | FK → User.id (CASCADE) |
| listingId | `int` | yes |  | FK → Listing.id (CASCADE) |
| reason | `varchar(60)` | no |  |  |
| details | `varchar(1000)` | yes |  |  |
| status | `enum('OPEN','REVIEWED','DISMISSED')` | no | OPEN | IDX |
| resolvedById | `int` | yes |  | FK → User.id (SET NULL) |
| createdAt | `datetime(3)` | no | CURRENT_TIMESTAMP(3) |  |
| resolvedAt | `datetime(3)` | yes |  |  |

**Indexes:** `PRIMARY` (id) unique · `Report_listingId_idx` (listingId) · `Report_reportedUserId_idx` (reportedUserId) · `Report_reporterId_idx` (reporterId) · `Report_resolvedById_idx` (resolvedById) · `Report_status_createdAt_idx` (status,createdAt)

## RoommateRequest

A USER asking to share a shareable listing (OPEN → MATCHED/CLOSED/WITHDRAWN).

| Column | Type | Null | Default | Keys / constraints |
|---|---|---|---|---|
| id | `int` | no |  | **PK**, auto_increment |
| listingId | `int` | no |  | FK → Listing.id (CASCADE) |
| requesterId | `int` | no |  | FK → User.id (CASCADE) |
| status | `enum('OPEN','MATCHED','CLOSED','WITHDRAWN')` | no | OPEN |  |
| createdAt | `datetime(3)` | no | CURRENT_TIMESTAMP(3) |  |
| budgetShare | `decimal(10,2)` | yes |  |  |
| decidedAt | `datetime(3)` | yes |  |  |
| message | `varchar(600)` | no |  |  |
| moveInDate | `date` | yes |  |  |
| openRequesterId | `int` | yes |  |  |
| updatedAt | `datetime(3)` | no | CURRENT_TIMESTAMP(3) |  |

**Indexes:** `PRIMARY` (id) unique · `RoommateRequest_listingId_openRequesterId_key` (listingId,openRequesterId) unique · `RoommateRequest_listingId_status_idx` (listingId,status) · `RoommateRequest_requesterId_status_idx` (requesterId,status)

**CHECK constraints:**
- `chk_request_budget`: `((budgetShare is null) or (budgetShare >= 0))`

## SavedListing

M:N – a user's favourite listings.

| Column | Type | Null | Default | Keys / constraints |
|---|---|---|---|---|
| userId | `int` | no |  | **PK**, FK → User.id (CASCADE) |
| listingId | `int` | no |  | **PK**, FK → Listing.id (CASCADE) |
| createdAt | `datetime(3)` | no | CURRENT_TIMESTAMP(3) |  |

**Indexes:** `PRIMARY` (userId,listingId) unique · `SavedListing_listingId_idx` (listingId)

## SimPlan

Plans of a SIM provider.

| Column | Type | Null | Default | Keys / constraints |
|---|---|---|---|---|
| id | `int` | no |  | **PK**, auto_increment |
| providerId | `int` | no |  | FK → SimProvider.id (CASCADE) |
| name | `varchar(100)` | no |  |  |
| kind | `enum('PREPAID','POSTPAID')` | no |  |  |
| priceMonthly | `decimal(8,2)` | no |  |  |
| currency | `char(3)` | no |  |  |
| dataGb | `decimal(6,1)` | yes |  |  |
| euRoaming | `tinyint(1)` | no | 0 |  |
| notes | `varchar(300)` | yes |  |  |

**Indexes:** `PRIMARY` (id) unique · `SimPlan_providerId_kind_idx` (providerId,kind) · `SimPlan_providerId_name_key` (providerId,name) unique

**CHECK constraints:**
- `chk_simplan_data`: `((dataGb is null) or (dataGb >= 0))`
- `chk_simplan_price`: `(priceMonthly >= 0)`

## SimProvider

Mobile operators / MVNOs per country.

| Column | Type | Null | Default | Keys / constraints |
|---|---|---|---|---|
| id | `int` | no |  | **PK**, auto_increment |
| countryId | `int` | no |  | FK → Country.id (CASCADE) |
| name | `varchar(80)` | no |  |  |
| isMvno | `tinyint(1)` | no | 0 |  |
| network | `varchar(80)` | yes |  |  |
| website | `varchar(200)` | yes |  |  |
| whereToBuy | `varchar(300)` | no |  |  |
| documentsNeeded | `varchar(300)` | no |  |  |
| studentTip | `varchar(300)` | yes |  |  |
| touristTip | `varchar(300)` | yes |  |  |

**Indexes:** `PRIMARY` (id) unique · `SimProvider_countryId_name_key` (countryId,name) unique

## SupermarketChain

Supermarket chains with a price tier per country.

| Column | Type | Null | Default | Keys / constraints |
|---|---|---|---|---|
| id | `int` | no |  | **PK**, auto_increment |
| countryId | `int` | no |  | FK → Country.id (CASCADE) |
| name | `varchar(80)` | no |  |  |
| priceTier | `tinyint` | no |  |  |
| notes | `varchar(300)` | yes |  |  |
| website | `varchar(200)` | yes |  |  |

**Indexes:** `PRIMARY` (id) unique · `SupermarketChain_countryId_name_key` (countryId,name) unique

**CHECK constraints:**
- `chk_market_tier`: `(priceTier between 1 and 4)`

## TransportMode

How public transport works per country (train, tram …).

| Column | Type | Null | Default | Keys / constraints |
|---|---|---|---|---|
| id | `int` | no |  | **PK**, auto_increment |
| countryId | `int` | no |  | FK → Country.id (CASCADE) |
| mode | `enum('TRAIN','TRAM','BUS','METRO','BOAT','CABLE_CAR','BIKE','WALK')` | no |  |  |
| title | `varchar(100)` | no |  |  |
| description | `varchar(1000)` | no |  |  |
| howToBuy | `varchar(600)` | yes |  |  |
| apps | `varchar(200)` | yes |  |  |
| priceRange | `varchar(120)` | yes |  |  |
| position | `smallint` | no | 0 |  |

**Indexes:** `PRIMARY` (id) unique · `TransportMode_countryId_mode_key` (countryId,mode) unique

## TransportPass

Passes and tickets per country or city.

| Column | Type | Null | Default | Keys / constraints |
|---|---|---|---|---|
| id | `int` | no |  | **PK**, auto_increment |
| countryId | `int` | no |  | FK → Country.id (CASCADE) |
| cityId | `int` | yes |  | FK → City.id (CASCADE) |
| name | `varchar(100)` | no |  |  |
| description | `varchar(600)` | no |  |  |
| price | `decimal(8,2)` | yes |  |  |
| currency | `char(3)` | no |  |  |
| validity | `varchar(80)` | no |  |  |
| audience | `enum('EVERYONE','YOUTH','STUDENT','TOURIST','SENIOR')` | no | EVERYONE |  |
| url | `varchar(300)` | yes |  |  |

**Indexes:** `PRIMARY` (id) unique · `TransportPass_cityId_idx` (cityId) · `TransportPass_countryId_audience_idx` (countryId,audience) · `TransportPass_countryId_name_key` (countryId,name) unique

## User

Every account (USER, BUSINESS, ADMIN). Passwords are bcrypt hashes.

| Column | Type | Null | Default | Keys / constraints |
|---|---|---|---|---|
| id | `int` | no |  | **PK**, auto_increment |
| name | `varchar(80)` | no |  |  |
| email | `varchar(191)` | no |  | UQ |
| passwordHash | `varchar(100)` | no |  |  |
| role | `enum('USER','BUSINESS','ADMIN')` | no | USER | IDX |
| createdAt | `datetime(3)` | no | CURRENT_TIMESTAMP(3) |  |
| isActive | `tinyint(1)` | no | 1 |  |
| onboardedAt | `datetime(3)` | yes |  |  |
| updatedAt | `datetime(3)` | no | CURRENT_TIMESTAMP(3) |  |

**Indexes:** `PRIMARY` (id) unique · `User_email_key` (email) unique · `User_role_isActive_idx` (role,isActive)

## UserChecklistProgress

M:N – which checklist steps a user ticked.

| Column | Type | Null | Default | Keys / constraints |
|---|---|---|---|---|
| userId | `int` | no |  | **PK**, FK → User.id (CASCADE) |
| itemId | `int` | no |  | **PK**, FK → ChecklistTemplate.id (CASCADE) |
| completedAt | `datetime(3)` | no | CURRENT_TIMESTAMP(3) |  |

**Indexes:** `PRIMARY` (userId,itemId) unique · `UserChecklistProgress_itemId_idx` (itemId)

## UserLanguage

M:N – languages a user speaks.

| Column | Type | Null | Default | Keys / constraints |
|---|---|---|---|---|
| userId | `int` | no |  | **PK**, FK → User.id (CASCADE) |
| languageCode | `varchar(8)` | no |  | **PK**, FK → Language.code (CASCADE) |

**Indexes:** `PRIMARY` (userId,languageCode) unique · `UserLanguage_languageCode_idx` (languageCode)

## UserProfile

Relocation profile of a USER (1:1): destination, budget, lifestyle used for matching.

| Column | Type | Null | Default | Keys / constraints |
|---|---|---|---|---|
| userId | `int` | no |  | **PK**, FK → User.id (CASCADE) |
| occupation | `enum('STUDENT','PROFESSIONAL','OTHER')` | no | OTHER |  |
| organization | `varchar(120)` | yes |  |  |
| destinationCityId | `int` | yes |  | FK → City.id (SET NULL) |
| budgetMonthly | `decimal(10,2)` | yes |  |  |
| budgetCurrency | `char(3)` | yes |  |  |
| moveInDate | `date` | yes |  |  |
| bio | `varchar(600)` | yes |  |  |
| gender | `enum('FEMALE','MALE','NON_BINARY','UNDISCLOSED')` | no | UNDISCLOSED |  |
| smoking | `enum('NON_SMOKER','OUTSIDE_ONLY','SMOKER')` | no | NON_SMOKER |  |
| hasPets | `tinyint(1)` | no | 0 |  |
| okWithPets | `tinyint(1)` | no | 1 |  |
| socialStyle | `enum('QUIET','BALANCED','SOCIAL')` | no | BALANCED |  |
| sleepSchedule | `enum('EARLY_BIRD','FLEXIBLE','NIGHT_OWL')` | no | FLEXIBLE |  |
| roommateGender | `enum('ANYONE','FEMALE_ONLY','MALE_ONLY')` | no | ANYONE |  |
| updatedAt | `datetime(3)` | no | CURRENT_TIMESTAMP(3) |  |

**Indexes:** `PRIMARY` (userId) unique · `UserProfile_destinationCityId_idx` (destinationCityId)

**CHECK constraints:**
- `chk_profile_budget`: `((budgetMonthly is null) or (budgetMonthly >= 0))`

## Views

- `v_listing_summary` – see docs/schema.sql and docs/report.md §6
- `v_roommate_compatibility` – see docs/schema.sql and docs/report.md §6
