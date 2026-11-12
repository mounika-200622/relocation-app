# ER diagram

Relational part (MySQL). Every table of `prisma/schema.prisma` appears below; attributes are
trimmed to keys and the most important columns — the full list is in
[data-dictionary.md](data-dictionary.md). MongoDB collections are shown at the end.

GitHub renders the Mermaid diagrams directly. To export a PNG:
`npx -y @mermaid-js/mermaid-cli -i docs/er-diagram.md -o docs/er-diagram.png`.

## 1. Accounts, locations and listings

```mermaid
erDiagram
    User ||--o| UserProfile : "has (1:1)"
    User ||--o| BusinessProfile : "has (1:1)"
    User ||--o{ UserLanguage : speaks
    Language ||--o{ UserLanguage : "spoken by"
    User ||--o{ PasswordResetToken : requests
    User ||--o{ Listing : owns
    Country ||--o{ Region : contains
    Country ||--o{ City : contains
    Region |o--o{ City : groups
    City ||--o{ Listing : "located in"
    City |o--o{ UserProfile : "destination of"
    Country |o--o{ UserProfile : "home country of"
    Listing ||--o{ ListingPhoto : has
    Listing ||--o{ ListingAmenity : offers
    Amenity ||--o{ ListingAmenity : "offered by"
    User ||--o{ SavedListing : saves
    Listing ||--o{ SavedListing : "saved by"
    Listing ||--o{ ListingView : "viewed"
    User |o--o{ ListingView : views

    User {
        int id PK
        varchar email UK
        varchar passwordHash "bcrypt"
        enum role "USER|BUSINESS|ADMIN"
        bool isActive
        datetime onboardedAt
    }
    UserProfile {
        int userId PK,FK
        enum occupation
        int destinationCityId FK
        int homeCountryId FK "for the currency converter"
        decimal budgetMonthly
        char budgetCurrency
        date moveInDate
        enum gender
        enum smoking
        bool hasPets
        bool okWithPets
        enum socialStyle
        enum sleepSchedule
        enum roommateGender
    }
    BusinessProfile {
        int userId PK,FK
        varchar displayName
        bool isVerified
    }
    Language {
        varchar code PK
        varchar name UK
    }
    UserLanguage {
        int userId PK,FK
        varchar languageCode PK,FK
    }
    PasswordResetToken {
        int id PK
        int userId FK
        char tokenHash UK
        datetime expiresAt
        datetime usedAt
    }
    Country {
        int id PK
        char isoCode UK
        varchar name UK
        char currency
        varchar photoUrl "real photo (Wikimedia Commons)"
        varchar photoCredit
    }
    Region {
        int id PK
        int countryId FK
        varchar isoCode
        varchar name
    }
    City {
        int id PK
        int countryId FK
        int regionId FK
        varchar name
        double lat
        double lng
        varchar photoUrl
        varchar photoCredit
    }
    Listing {
        int id PK
        int ownerId FK
        int cityId FK
        enum type
        enum status "ACTIVE|RENTED|ARCHIVED"
        varchar title
        text description "FULLTEXT"
        decimal price "CHECK >= 0"
        char currency
        bool isShareable
        smallint capacityMin
        smallint capacityMax "CHECK min <= max"
        smallint currentOccupants "CHECK <= max"
        enum genderPreference
        double lat
        double lng
    }
    ListingPhoto {
        int id PK
        int listingId FK
        varchar url
        varchar storageKey
        smallint position
        varchar credit "author · licence · file"
    }
    Amenity {
        int id PK
        varchar code UK
        varchar label
    }
    ListingAmenity {
        int listingId PK,FK
        int amenityId PK,FK
    }
    SavedListing {
        int userId PK,FK
        int listingId PK,FK
    }
    ListingView {
        int id PK
        int listingId FK
        int viewerId FK
        char viewerKey
        date viewedOn
    }
```

## 2. Roommates, chat headers and moderation

```mermaid
erDiagram
    Listing ||--o{ RoommateRequest : "receives"
    User ||--o{ RoommateRequest : "sends"
    User ||--o{ Conversation : "is userA"
    User ||--o{ Conversation : "is userB"
    Listing |o--o{ Conversation : "about"
    RoommateRequest |o--o{ Conversation : "about"
    User ||--o{ Block : blocks
    User ||--o{ Block : "is blocked"
    User ||--o{ Report : files
    User |o--o{ Report : "is reported"
    Listing |o--o{ Report : "is reported"
    User |o--o{ Report : resolves
    Listing ||--o{ AuditLog : "history (trigger)"

    RoommateRequest {
        int id PK
        int listingId FK
        int requesterId FK
        enum status "OPEN|MATCHED|CLOSED|WITHDRAWN"
        varchar message
        date moveInDate
        decimal budgetShare
        int openRequesterId "UNIQUE(listingId, openRequesterId)"
    }
    Conversation {
        int id PK
        int userAId FK "always < userBId"
        int userBId FK
        int listingId FK
        int roommateRequestId FK
        int contextKey "UNIQUE(userAId,userBId,contextKey)"
        datetime lastMessageAt
        varchar lastMessagePreview
    }
    Block {
        int blockerId PK,FK
        int blockedId PK,FK
    }
    Report {
        int id PK
        int reporterId FK
        int reportedUserId FK
        int listingId FK
        varchar reason
        enum status
        int resolvedById FK
    }
    AuditLog {
        bigint id PK
        varchar tableName
        int rowId
        json oldValue
        json newValue
        datetime changedAt
    }
```

## 3. Places, prices and the settling-in guide

```mermaid
erDiagram
    City |o--o{ POI : "cached in"
    Country ||--o{ CostEstimate : "prices"
    City |o--o{ CostEstimate : "city prices"
    Country ||--o{ GuideArticle : has
    City |o--o{ GuideArticle : "city-specific"
    Country ||--o{ ChecklistTemplate : has
    ChecklistTemplate ||--o{ UserChecklistProgress : "ticked in"
    User ||--o{ UserChecklistProgress : ticks
    Country ||--o{ SimProvider : has
    SimProvider ||--o{ SimPlan : offers
    Country ||--o{ TransportMode : has
    Country ||--o{ RideService : "taxis & ride apps"
    Country ||--o{ TransportPass : has
    City |o--o{ TransportPass : "city pass"
    Country ||--o{ EmergencyNumber : has
    Country ||--o{ SupermarketChain : has
    Country ||--o{ Bank : has

    POI {
        int id PK
        varchar osmId UK
        int cityId FK
        enum category
        varchar name
        double lat
        double lng
        tinyint priceTier "CHECK 1..4"
        json tags
        datetime lastSyncedAt
    }
    PoiQueryCache {
        int id PK
        varchar areaKey "UNIQUE(areaKey, category)"
        enum category
        datetime fetchedAt
    }
    CostEstimate {
        int id PK
        int countryId FK
        int cityId FK
        enum category
        tinyint tier
        decimal minPrice "CHECK min <= max"
        decimal maxPrice
        char currency
    }
    ExchangeRate {
        char base PK
        char quote PK
        decimal rate
        datetime fetchedAt
    }
    GuideArticle {
        int id PK
        int countryId FK
        enum category
        varchar slug "UNIQUE(countryId, slug)"
        varchar title "FULLTEXT"
        text body
        varchar sourceUrl
    }
    ChecklistTemplate {
        int id PK
        int countryId FK
        varchar title
        smallint dueWithinDays
    }
    UserChecklistProgress {
        int userId PK,FK
        int itemId PK,FK
        datetime completedAt
    }
    SimProvider {
        int id PK
        int countryId FK
        varchar name
        bool isMvno
    }
    SimPlan {
        int id PK
        int providerId FK
        enum kind
        decimal priceMonthly
        decimal dataGb "NULL = unlimited"
    }
    TransportMode {
        int id PK
        int countryId FK
        enum mode
    }
    RideService {
        int id PK
        int countryId FK
        varchar name "UK with countryId"
        enum kind "RIDE_HAILING, TAXI, BIKE_SHARE, SCOOTER"
        varchar deepLink "CHECK: needs website or deepLink"
    }
    TransportPass {
        int id PK
        int countryId FK
        int cityId FK
        decimal price
        enum audience
    }
    EmergencyNumber {
        int id PK
        int countryId FK
        varchar service
        varchar number
    }
    SupermarketChain {
        int id PK
        int countryId FK
        tinyint priceTier
    }
    Bank {
        int id PK
        int countryId FK
        bool studentAccount
    }
```

## 4. Trip planner

```mermaid
erDiagram
    User ||--o{ Itinerary : plans
    City ||--o{ Itinerary : "destination"
    Itinerary ||--o{ ItineraryInterest : has
    Itinerary ||--o{ ItineraryItem : contains
    POI |o--o{ ItineraryItem : "visited"
    Listing |o--o{ ItineraryItem : "stayed at"

    Itinerary {
        int id PK
        int userId FK
        int cityId FK
        smallint days "CHECK 1..30"
        smallint peopleCount
        decimal budget "CHECK > 0"
        char currency
        tinyint pctStay "CHECK sum of pct = 100"
        tinyint pctFood
        tinyint pctActivities
        tinyint pctTransport
        char shareToken UK
    }
    ItineraryInterest {
        int itineraryId PK,FK
        enum interest PK
    }
    ItineraryItem {
        int id PK
        int itineraryId FK
        smallint dayNumber
        enum timeSlot
        enum kind
        int poiId FK
        int listingId FK
        decimal estimatedCost "CHECK >= 0"
    }
```

## 5. MongoDB (NoSQL) collections

```mermaid
erDiagram
    Conversation ||--o{ messages : "conversationId (logical FK)"
    User ||--o{ notifications : "userId (logical FK)"
    messages {
        ObjectId _id PK
        int conversationId "index (conversationId, _id)"
        int senderId
        string text
        date sentAt
        date readAt "partial index on unread"
    }
    notifications {
        ObjectId _id PK
        int userId "index (userId, createdAt)"
        string type
        string title
        object data "shape depends on type"
        date createdAt "TTL 90 days"
        date readAt
    }
```
