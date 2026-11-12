# NoSQL design (MongoDB)

The course requires SQL **plus** a NoSQL or vector database, with the choice justified by the
data. Nira keeps everything relational in MySQL and puts two kinds of data in MongoDB.

## Why these two, and not more

| Data | Shape and access pattern | Why MongoDB fits |
|---|---|---|
| **Chat message bodies** (`messages`) | Append-only, high volume, never updated except `readAt`, always read by one key (a conversation) in insertion order, paged with "give me everything after id X". | One collection, one compound index `(conversationId, _id)`; ObjectIds are time-ordered so "after X" is an index range scan. No joins needed; documents can grow new fields (attachments, reactions) without migrations. |
| **Notifications** (`notifications`) | Short-lived, schema varies by type (`data` payload), read only by the recipient, safe to lose. | TTL index deletes them automatically after 90 days; flexible `data` object; aggregation for per-type stats. |

Everything with relationships, constraints or transactions stays in MySQL — including the
**conversation header** (participants, listing, uniqueness of a pair, blocks). That split gives
the inbox SQL-level integrity (`UNIQUE(userAId, userBId, contextKey)`, CASCADE on account
deletion, a block check join) while message bodies scale independently.

## Collections

### `messages`
```json
{
  "_id": ObjectId("…"),          // time-ordered; doubles as the polling cursor
  "conversationId": 12,          // logical FK → MySQL Conversation.id
  "senderId": 7,                 // logical FK → MySQL User.id
  "text": "Is the room still available?",
  "sentAt": ISODate("2026-11-12T09:04:00Z"),
  "readAt": null                 // set when the other participant opens the thread
}
```
Indexes (created in `src/lib/mongo/client.ts`):
- `{ conversationId: 1, _id: 1 }` — thread loading and `?after=<id>` polling.
- `{ conversationId: 1, senderId: 1 }` with `partialFilterExpression: { readAt: null }` —
  a **partial index** containing only unread messages, so unread counters stay tiny.
- `{ sentAt: -1 }` — admin analytics.

### `notifications`
```json
{
  "_id": ObjectId("…"),
  "userId": 7,
  "type": "ROOMMATE_REQUEST",    // REQUEST_ACCEPTED, LISTING_RENTED, …
  "title": "New roommate request",
  "body": "Aarav wants to share …",
  "link": "/business/listings/3/requests",
  "data": { },                   // free-form, depends on type
  "createdAt": ISODate("…"),
  "readAt": null
}
```
Indexes: `{ userId: 1, createdAt: -1 }` and a **TTL index** `{ createdAt: 1 }` with
`expireAfterSeconds = 7 776 000` (90 days).

## Aggregation pipelines used by the app

**Unread count per conversation** (inbox badges, `src/lib/mongo/chat.ts → unreadCounts`)
```js
db.messages.aggregate([
  { $match: { conversationId: { $in: [1, 2, 3] }, readAt: null, senderId: { $ne: 7 } } },
  { $group: { _id: "$conversationId", count: { $sum: 1 } } }
])
```

**Messages per day with distinct senders** (admin overview, `messagesPerDay`)
```js
db.messages.aggregate([
  { $match: { sentAt: { $gte: ISODate("…14 days ago…") } } },
  { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$sentAt" } },
              messages: { $sum: 1 }, senderSet: { $addToSet: "$senderId" } } },
  { $project: { messages: 1, senders: { $size: "$senderSet" } } },
  { $sort: { _id: 1 } }
])
```

**Notifications by type with unread totals** (`notificationStats`)
```js
db.notifications.aggregate([
  { $match: { userId: 7 } },
  { $group: { _id: "$type", total: { $sum: 1 },
              unread: { $sum: { $cond: [{ $eq: ["$readAt", null] }, 1, 0] } } } },
  { $sort: { total: -1 } }
])
```

## Retrieval strategy

- **Open a thread:** `find({ conversationId }).sort({ _id: -1 }).limit(200)` then reverse
  (newest 200, shown oldest → newest), then `updateMany` unread → read.
- **Poll every 3 s:** `find({ conversationId, _id: { $gt: lastId } }).sort({ _id: 1 })` —
  returns only new messages; the client pauses polling while the tab is hidden.
- **Send:** authorise against MySQL (participant? blocked?) → `insertOne` in Mongo → update
  the MySQL header (`lastMessageAt`, preview) so the inbox can sort without Mongo.

## Consistency

Writes touch MySQL and MongoDB, which cannot share a transaction. The order is chosen so a
failure never leaves a broken state the user can see: the header is created first (empty
conversations are harmless), the message second, and the header's preview only after the
message insert succeeded. Account deletion removes Mongo documents explicitly (see
[normalization.md §5](normalization.md#5-integrity-across-the-two-databases)).

## Running MongoDB

`docker compose up -d` starts `mongo:7`. Without Docker, `npm run mongo:local` starts a
persistent local server (via `mongodb-memory-server`) on port 27018 with data in `.mongo-data/`.
