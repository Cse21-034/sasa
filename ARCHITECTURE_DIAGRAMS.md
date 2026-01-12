# 🎨 Notification System - Architecture Diagrams

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ARTISAN MARKETPLACE                              │
└─────────────────────────────────────────────────────────────────────────┘

                                 
┌──────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React)                                 │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Header Component                                                          │
│  ├─ [🔔] Bell Icon ← NotificationPanel Component                         │
│  │   └─ Shows unread count badge                                         │
│  │   └─ Opens dropdown on click                                          │
│  │                                                                         │
│  └─ Notification Dropdown                                                 │
│      ├─ List of notifications                                            │
│      ├─ Mark as read / Delete actions                                    │
│      └─ Click to navigate to job                                         │
│                                                                            │
│  useNotifications Hook                                                    │
│  ├─ Fetches notifications every 30 seconds                               │
│  ├─ Manages unread count                                                 │
│  └─ Handles mutations (read, delete)                                     │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘
                                  ↕
                            (HTTP REST API)
                                  ↕
┌──────────────────────────────────────────────────────────────────────────┐
│                          BACKEND (Node.js)                                │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  API Routes (notifications.routes.ts)                                     │
│  ├─ GET    /api/notifications                                            │
│  ├─ GET    /api/notifications/unread                                     │
│  ├─ GET    /api/notifications/unread/count                               │
│  ├─ PATCH  /api/notifications/:id/read                                   │
│  ├─ PATCH  /api/notifications/read-all                                   │
│  └─ DELETE /api/notifications/:id                                        │
│                                                                            │
│  Storage Layer (storage.ts)                                               │
│  ├─ getNotifications(userId)                                             │
│  ├─ getUnreadNotifications(userId)                                       │
│  ├─ getUnreadNotificationCount(userId)                                   │
│  ├─ createNotification(data)                                             │
│  ├─ markNotificationAsRead(id)                                           │
│  ├─ markAllNotificationsAsRead(userId)                                   │
│  └─ deleteNotification(id)                                               │
│                                                                            │
│  Notification Service (notification.service.ts)                           │
│  ├─ notifyProvidersOfNewJob()          [Main entry point]                │
│  ├─ isCompanyProvider()                [Helper]                          │
│  ├─ matchesProviderType()              [Helper]                          │
│  └─ notifyOnApplicationStatus()        [Future]                          │
│                                                                            │
│  Job Routes (jobs.routes.ts)                                              │
│  └─ POST /api/jobs                                                       │
│     └─ Calls: notificationService.notifyProvidersOfNewJob()              │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘
                                  ↕
                          (Drizzle ORM)
                                  ↕
┌──────────────────────────────────────────────────────────────────────────┐
│                       DATABASE (PostgreSQL)                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Tables:                                                                  │
│  ├─ notifications (NEW)                                                   │
│  │  ├─ id (UUID) PRIMARY KEY                                             │
│  │  ├─ recipientId (UUID) FOREIGN KEY → users                            │
│  │  ├─ jobId (UUID) FOREIGN KEY → jobs (nullable)                        │
│  │  ├─ type (ENUM) [job_posted, application_received, ...]              │
│  │  ├─ title (TEXT)                                                      │
│  │  ├─ message (TEXT)                                                    │
│  │  ├─ isRead (BOOLEAN)                                                  │
│  │  ├─ readAt (TIMESTAMP nullable)                                       │
│  │  └─ createdAt (TIMESTAMP)                                             │
│  │                                                                         │
│  │  Indexes:                                                             │
│  │  ├─ recipient_id (for user lookups)                                   │
│  │  ├─ is_read (for unread queries)                                      │
│  │  └─ created_at (for time-based sorting)                               │
│  │                                                                         │
│  ├─ users (existing)                                                     │
│  ├─ jobs (existing)                                                      │
│  ├─ providers (existing)                                                  │
│  └─ companies (existing)                                                 │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Job Posting → Notification Flow

```
STEP 1: Requester Posts Job
┌──────────────────────────────────┐
│ Service Requester                 │
│ - Logs in                         │
│ - Posts job:                      │
│   • Title: "Burst Toilet"        │
│   • Category: Plumbing (ID: 5)   │
│   • City: Gaborone               │
│   • Type: "both"                 │
│   • Urgency: "emergency"         │
└──────────────────────────────────┘
           ↓
     POST /api/jobs
           ↓

STEP 2: Job Saved
┌──────────────────────────────────┐
│ Database                          │
│ INSERT INTO jobs                  │
│ {                                 │
│   id: 'uuid',                    │
│   requesterId: 'uuid',           │
│   categoryId: 5,                 │
│   city: 'Gaborone',              │
│   title: 'Burst Toilet',         │
│   allowedProviderType: 'both',   │
│   ...                            │
│ }                                │
└──────────────────────────────────┘
           ↓
     Job created successfully
           ↓

STEP 3: Notification Service Triggered
┌──────────────────────────────────────────────────────┐
│ notifyProvidersOfNewJob({                            │
│   jobId: 'job-uuid',                                │
│   categoryId: 5,                                    │
│   city: 'Gaborone',                                 │
│   allowedProviderType: 'both',                      │
│   ...                                               │
│ })                                                   │
└──────────────────────────────────────────────────────┘
           ↓
     Query providers with categoryId 5
           ↓

STEP 4: Filter Providers
┌────────────────────────────────────────────────────────┐
│ For each provider matching category:                   │
│                                                        │
│ Provider 1 (John - Plumber, Individual)              │
│ ├─ In Gaborone? YES ✓                                 │
│ ├─ Individual or Company? Individual ✓                │
│ └─ Type matches "both"? YES ✓ → NOTIFY               │
│                                                        │
│ Provider 2 (ABC Plumbing - Company)                   │
│ ├─ In Gaborone? YES ✓                                 │
│ ├─ Individual or Company? Company ✓                   │
│ └─ Type matches "both"? YES ✓ → NOTIFY               │
│                                                        │
│ Provider 3 (Jane - Plumber, Individual)              │
│ ├─ In Gaborone? NO ✗                                  │
│ └─ In Francistown instead → SKIP (don't notify)      │
│                                                        │
│ Provider 4 (Electrician - Individual)                 │
│ ├─ Category match? NO ✗                               │
│ └─ Different category (Electrical) → SKIP             │
└────────────────────────────────────────────────────────┘
           ↓
  Create notifications
           ↓

STEP 5: Notifications Created in DB
┌─────────────────────────────────────────┐
│ INSERT INTO notifications (multiple):    │
│                                         │
│ 1. For John (Provider 1)               │
│    recipientId: 'john-uuid'            │
│    type: 'job_posted'                  │
│    title: '🚨 URGENT Job in Gaborone' │
│    message: 'Burst Toilet Repair...'   │
│                                         │
│ 2. For ABC Plumbing (Provider 2)       │
│    recipientId: 'abc-uuid'             │
│    type: 'job_posted'                  │
│    title: '🚨 URGENT Job in Gaborone' │
│    message: 'Burst Toilet Repair...'   │
│                                         │
│ [Providers 3 & 4 NOT notified]         │
└─────────────────────────────────────────┘
           ↓
    Notifications appear in app
           ↓

STEP 6: Provider Sees Notification
┌──────────────────────────────────┐
│ John (Plumber)                    │
│ - Logs in                         │
│ - Sees bell icon with "1"         │
│ - Clicks bell                     │
│ - Sees: "🚨 URGENT Job in ...     │
│ - Clicks notification             │
│ - Views job details               │
│ - Applies for job                 │
└──────────────────────────────────┘
```

---

## Filtering Logic Diagram

```
CATEGORY FILTER
┌─────────────────────────────────────────────────────┐
│ Job posted: categoryId = 5 (Plumbing)              │
│                                                     │
│ Query: WHERE serviceCategories CONTAINS 5          │
│                                                     │
│ Provider John:                                      │
│ serviceCategories: [1, 5, 8]  ← Includes 5 ✓      │
│                                                     │
│ Provider Jane (Electrician):                        │
│ serviceCategories: [2, 3, 4]  ← Doesn't include 5 │
│                                                     │
│ Result: ONLY John gets notified                    │
└─────────────────────────────────────────────────────┘

LOCATION FILTER
┌─────────────────────────────────────────────────────┐
│ Job posted: city = "Gaborone"                       │
│                                                     │
│ Query: WHERE approvedServiceAreas CONTAINS "Gaborone"
│                                                     │
│ Provider John:                                      │
│ approvedServiceAreas: ["Gaborone"]  ✓              │
│                                                     │
│ Provider Tom (based in Francistown):                │
│ approvedServiceAreas: ["Francistown"]              │
│                                                     │
│ Result: ONLY John gets notified                    │
└─────────────────────────────────────────────────────┘

PROVIDER TYPE FILTER
┌──────────────────────────────────────────────────┐
│ Job's allowedProviderType: "individual"          │
│                                                  │
│ Provider John:                                   │
│ isCompany: false ✓ → NOTIFY                     │
│                                                  │
│ Provider ABC Plumbing:                           │
│ isCompany: true ✗ → SKIP                        │
│                                                  │
│ ─────────────────────────────────────────────── │
│                                                  │
│ Job's allowedProviderType: "company"            │
│                                                  │
│ Provider John:                                   │
│ isCompany: false ✗ → SKIP                       │
│                                                  │
│ Provider ABC Plumbing:                           │
│ isCompany: true ✓ → NOTIFY                      │
│                                                  │
│ ─────────────────────────────────────────────── │
│                                                  │
│ Job's allowedProviderType: "both"               │
│                                                  │
│ Provider John:                                   │
│ isCompany: false ✓ → NOTIFY                     │
│                                                  │
│ Provider ABC Plumbing:                           │
│ isCompany: true ✓ → NOTIFY                      │
│                                                  │
│ (Everyone gets notified)                         │
└──────────────────────────────────────────────────┘
```

---

## API Call Sequence Diagram

```
Provider Client          Backend API           Database
     │                        │                    │
     │─ GET /api/jobs ────────→│                    │
     │                         │─ Query jobs ─────→│
     │                         │← Return jobs ─────│
     │← Display jobs ──────────│                    │
     │                         │                    │
     │─ POST /api/jobs/:id/apply ──→│              │
     │  (as Requester)         │                    │
     │                         │─ Create job ─────→│
     │                         │← Job created ─────│
     │                         │                    │
     │                         │─ Trigger notif ──→│
     │                         │  service           │
     │                         │                    │
     │                         │─ Query providers ─→│
     │                         │← Provider list ───│
     │                         │                    │
     │                         │─ Filter by ──────→│
     │                         │  category/city/type
     │                         │← Filtered list ───│
     │                         │                    │
     │                         │─ Create multiple ─→│
     │                         │  notifications     │
     │                         │← Confirm created ─│
     │                         │                    │
     │                         │← Return job ──────│
     │← Job posted ────────────│                    │
     │ (as Requester)          │                    │
     │                         │                    │
    [Provider logs in]         │                    │
     │                         │                    │
     │─ GET /api/notifications ──────→│            │
     │                         │─ Query notifs ───→│
     │                         │  WHERE            │
     │                         │  recipientId=... │
     │                         │← Return notifs ───│
     │← Show notification ─────│                    │
     │ bell with unread count  │                    │
     │                         │                    │
     │─ Click notification ────→│                    │
     │                         │─ Mark as read ───→│
     │                         │  UPDATE isRead ─→│
     │                         │← Success ─────────│
     │                         │  (readAt set)     │
     │← Navigate to job ───────│                    │
     │ (marked as read now)    │                    │
```

---

## Database Schema Diagram

```
┌────────────────────┐
│     users          │
├────────────────────┤
│ id (UUID) PK       │ ◄─────────────┐
│ name               │               │ 1
│ email              │               │
│ role               │               │ n
│ status             │               │
│ ...                │               │
└────────────────────┘               │
                                     │
                                     │
┌────────────────────┐      ┌──────────────────────┐
│     jobs           │      │   notifications      │
├────────────────────┤      ├──────────────────────┤
│ id (UUID) PK       │◄──┐  │ id (UUID) PK         │
│ requesterId (FK)   │   └──│ jobId (FK)           │
│ categoryId (FK)    │      │ recipientId (FK) ───→│
│ title              │      │ type (ENUM)          │
│ city               │      │ title                │
│ allowedProviderType│      │ message              │
│ urgency            │      │ isRead               │
│ createdAt          │      │ readAt               │
│ ...                │      │ createdAt            │
└────────────────────┘      └──────────────────────┘
                                     ▲
                                     │ 1
┌────────────────────┐               │ n
│   providers        │               │
├────────────────────┤      ┌────────┘
│ userId (UUID) PK   │──────│ recipientId (FK)
│ serviceCategories  │
│ approvedServiceAreas
│ primaryCity        │
│ ...                │
└────────────────────┘

┌────────────────────┐
│   companies        │
├────────────────────┤
│ userId (UUID) PK   │
│ companyName        │
│ ...                │
└────────────────────┘
```

---

## State Management Flow

```
React Component
│
├─ useNotifications() Hook
│  │
│  ├─ useQuery
│  │  │
│  │  └─ GET /api/notifications
│  │     │
│  │     └─ API calls storage.getNotifications()
│  │        │
│  │        └─ Database query
│  │           │
│  │           └─ Returns Notification[]
│  │
│  ├─ useQuery (unread count)
│  │  │
│  │  └─ GET /api/notifications/unread/count
│  │
│  ├─ useMutation (mark as read)
│  │  │
│  │  └─ PATCH /api/notifications/:id/read
│  │     │
│  │     └─ Invalidate queries
│  │
│  ├─ useMutation (delete)
│  │  │
│  │  └─ DELETE /api/notifications/:id
│  │     │
│  │     └─ Invalidate queries
│  │
│  └─ Return {
│     notifications,
│     unreadCount,
│     markAsRead(),
│     deleteNotification(),
│     ...
│  }
│
└─ Render NotificationPanel
   │
   └─ Display notifications
      with actions
```

---

## Error Handling Flow

```
API Request
│
├─ Authentication Check
│  └─ No token? → 401 Unauthorized
│
├─ Authorization Check (verifyAccess middleware)
│  └─ Account blocked? → 403 Forbidden
│
├─ Validation
│  └─ Invalid input? → 400 Bad Request
│
├─ Database Query
│  ├─ Success → 200 OK with data
│  │
│  └─ Error
│     ├─ Foreign key error? → 404 Not Found
│     ├─ Database down? → 500 Internal Server Error
│     └─ Log error → console.error()
│
└─ Response sent to client
   │
   ├─ Success: JSON with data
   ├─ Error: JSON with error message
   └─ Frontend handles gracefully
```

---

## Performance Characteristics

```
Query Time (Expected):
┌──────────────────────────────┬─────────────┐
│ Operation                    │ Time (ms)   │
├──────────────────────────────┼─────────────┤
│ Get all notifications        │ 15-25       │
│ Get unread count             │ 5-10        │
│ Mark as read                 │ 8-15        │
│ Create notification          │ 10-20       │
│ Notify job → 100 providers   │ 500-1000    │
└──────────────────────────────┴─────────────┘

Database Indexes:
┌─────────────────────────────────────────┐
│ CREATE INDEX idx_recipient_id           │
│ ON notifications(recipient_id);         │
│                                         │
│ CREATE INDEX idx_is_read                │
│ ON notifications(is_read);              │
│                                         │
│ CREATE INDEX idx_created_at             │
│ ON notifications(created_at);           │
└─────────────────────────────────────────┘

Scaling Numbers:
┌─────────────────┬──────────────────────┐
│ Active Users    │ Performance Impact    │
├─────────────────┼──────────────────────┤
│ 1,000           │ Excellent (no issues)│
│ 10,000          │ Good (still fast)    │
│ 100,000         │ Fair (consider Redis)│
│ 1,000,000       │ Needs archiving      │
└─────────────────┴──────────────────────┘
```

---

These diagrams provide a complete visual representation of how the notification system works end-to-end! 📊
