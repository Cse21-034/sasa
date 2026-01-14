# Category Management System - Architecture & Flow Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐         ┌──────────────────┐              │
│  │   Signup Page    │         │  Profile Page    │              │
│  │  (Registration)  │         │  (Category Mgmt) │              │
│  └────────┬─────────┘         └────────┬─────────┘              │
│           │                            │                         │
│           └────────────┬───────────────┘                         │
│                        │                                         │
│           ┌────────────▼──────────────┐                         │
│           │ CategorySelector Component│                         │
│           │  (Fetch & Display)        │                         │
│           └──────────┬─────────────────┘                         │
│                      │                                           │
└──────────────────────┼───────────────────────────────────────────┘
                       │
                       │ HTTP API Calls
                       │
┌──────────────────────┼───────────────────────────────────────────┐
│                      │         API LAYER (Backend Routes)         │
├──────────────────────┼───────────────────────────────────────────┤
│                      │                                             │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │           PUBLIC ROUTES (categories.routes.ts)          │    │
│  │                                                          │    │
│  │  GET /api/categories                                    │    │
│  │    └─> List all available categories                    │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │      PROVIDER ROUTES (categories.routes.ts)             │    │
│  │                                                          │    │
│  │  POST /api/categories/request-addition                  │    │
│  │    └─> Create category request (with docs)             │    │
│  │                                                          │    │
│  │  GET /api/categories/requests/pending                   │    │
│  │    └─> Get provider's pending requests                  │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │       ADMIN ROUTES (admin.routes.ts)                    │    │
│  │                                                          │    │
│  │  GET /api/admin/categories/requests/pending             │    │
│  │    └─> List all pending requests                        │    │
│  │                                                          │    │
│  │  POST /api/admin/categories/requests/:id/approve        │    │
│  │    └─> Approve request & add category                  │    │
│  │                                                          │    │
│  │  POST /api/admin/categories/requests/:id/reject         │    │
│  │    └─> Reject request & notify provider                │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                    │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         │ Service Call
                         │
┌────────────────────────┼─────────────────────────────────────────┐
│                        │    SERVICE LAYER (category.service.ts)  │
├────────────────────────┼─────────────────────────────────────────┤
│                        │                                          │
│    CategoryService                                                │
│    ├─ createCategoryAdditionRequest()                            │
│    ├─ getCategoryAdditionRequest()                               │
│    ├─ getPendingCategoryAdditionRequests()                       │
│    ├─ getPendingCategoryAdditionRequestsForProvider()            │
│    ├─ approveCategoryAdditionRequest()  ──┐                     │
│    └─ rejectCategoryAdditionRequest()  ──┐│                     │
│                                           ││ Creates Notification
└───────────────────────┬──────────────────┬┼────────────────────┘
                        │                  │                       
                        │ Storage Call     │ Notification Call    
                        │                  │                       
┌───────────────────────┼──────────────────┼────────────────────┐
│                       │                  │                    │
│    STORAGE LAYER      │                  │  NOTIFICATION SRV  │
│ (storage.ts)          │                  │  (notification)    │
│                       │                  │                    │
│  ├─ create...         ▼                  │  Sends:            │
│  ├─ get...       [Database Ops]         │  - category_request│
│  ├─ update...                           │  - approved        │
│  └─ getPending...                       │  - rejected        │
│                                         │                    │
└─────────────────────┬─────────────────┬─┴──────────────────┐
                      │                 │                    │
┌─────────────────────┼────────────────┬┴──────────────────┐ │
│                     │                │                   │ │
│    DATABASE         │                │   NOTIFICATIONS   │ │
│  (PostgreSQL)       │                │     TABLE         │ │
│                     │                │                   │ │
│  Tables:            ▼                └──────────────────►│ │
│  ├─ providers                                            │ │
│  │  ├─ registeredCategories                             │ │
│  │  └─ additionalCategories                             │ │
│  │                                                      │ │
│  ├─ categoryAdditionRequests                            │ │
│  │  ├─ providerId                                       │ │
│  │  ├─ categoryId                                       │ │
│  │  ├─ status: pending|approved|rejected                │ │
│  │  ├─ documents                                        │ │
│  │  └─ reviewed metadata                                │ │
│  │                                                      │ │
│  ├─ categories                                          │ │
│  │  ├─ id, name, description                            │ │
│  │  └─ icon                                             │ │
│  │                                                      │ │
│  └─ notifications                                       │ │
│     └─ recipientId, type, title, message                │ │
│                                                         │ │
└─────────────────────────────────────────────────────────┘ │
```

## Registration Flow Sequence Diagram

```
Provider                 Client App              Backend
  │                         │                       │
  ├─────[Visit Signup]──────►│                       │
  │                         │                       │
  │                         ├─[GET /api/categories]─►│
  │                         │                       │
  │                         │◄─[Category List]──────┤
  │                         │                       │
  ├─[Select Categories]────►│                       │
  │                         │                       │
  ├─[Enter Details]────────►│                       │
  │                         │                       │
  │                         ├─[POST /api/auth/signup]─►│
  │                         │ (with serviceCategories) │
  │                         │                        │
  │                         │                    [Validate]
  │                         │                    [Create User]
  │                         │                    [Create Provider with]
  │                         │                     registeredCategories
  │                         │◄─[Token + User]────┤
  │                         │                       │
  │◄─[Login + Redirect]────┤                       │
  │                         │                       │
```

## Category Addition Request Flow Sequence Diagram

```
Provider                Client App              Backend              Admin
  │                         │                       │                  │
  ├─[View Profile]─────────►│                       │                  │
  │                         │                       │                  │
  │                   [Click "Add Category"]        │                  │
  │                         │                       │                  │
  │                         ├─[GET /api/categories]─►│                  │
  │                         │                       │                  │
  │                         │◄─[Available Categories]┤                  │
  │                         │                       │                  │
  ├─[Select Category]──────►│                       │                  │
  │ [Upload Documents]      │                       │                  │
  │                         │                       │                  │
  │                  [Click "Request"]              │                  │
  │                         │                       │                  │
  │                         ├─[POST /api/categories│                  │
  │                         │  /request-addition]──►│                  │
  │                         │                       │                  │
  │                         │                    [Create Request]      │
  │                         │                    [Send Notification]──►│
  │                         │                       │     │              │
  │                         │◄─[Success Message]────┤     │              │
  │                         │                       │     │              │
  │◄─[Request Created]─────┤                       │     │              │
  │ [Status: Pending]       │                       │     │              │
  │                         │                       │     │              │
  │                         │                       │     ├─[Notification]
  │                         │                       │     │ ["New request"]
  │                         │                       │     │
  │                         │                  [Admin logs in]
  │                         │                       │     │
  │                         │                  [View Dashboard]
  │                         │                       │     │
  │                         │                       ├─[GET /api/admin/]
  │                         │                       │    categories/
  │                         │                       │    requests/pending
  │                         │                       │     │
  │                         │                  [Review Request]
  │                         │                  [Check Documents]
  │                         │                       │     │
  │                    [Admin decides to APPROVE]   │     │
  │                         │                       │     │
  │                         │                       ├─[POST /api/admin/]
  │                         │                       │  categories/
  │                         │                       │  requests/:id/approve
  │                         │                       │     │
  │                         │                    [Update Provider]
  │                         │                    [Add to additionalCategories]
  │                         │                    [Create Notification]──┐
  │                         │                       │     │               │
  │                    [Provider logs in]           │     │               │
  │ [Opens App]                                     │     │               │
  │                         │                       │     │               │
  │                    [Receives Notification]◄─────┴─────┴───────────┘
  │ [Category Approved!]    │                       │
  │ [Can now accept jobs]   │                       │
  │
```

## Data State Diagram - Provider Categories

```
Provider at Signup:
┌─────────────────────┐
│ registeredCategories│
│  [1, 3, 5]          │  ← Selected at signup
└─────────────────────┘
│
└──> Provider verified (Admin approves identity docs)
     Provider can see jobs in categories 1, 3, 5
     
     
After 6 months - Provider wants to expand:
┌─────────────────────┐
│ registeredCategories│
│  [1, 3, 5]          │  ← Original categories
└─────────────────────┘
             +
┌─────────────────────┐
│ additionalCategories│
│  []                 │  ← Empty (no requests yet)
└─────────────────────┘

                  +

┌──────────────────────────────┐
│ categoryAdditionRequests      │
│                              │
│ Request #1:                  │
│  - categoryId: 7 (Plumbing)  │
│  - status: pending           │
│  - documents: [...]          │
│  - createdAt: 2024-01-14     │
└──────────────────────────────┘


Admin approves Request #1:
┌─────────────────────┐
│ registeredCategories│
│  [1, 3, 5]          │  ← Original categories (unchanged)
└─────────────────────┘
             +
┌─────────────────────┐
│ additionalCategories│
│  [7]                │  ← Plumbing added!
└─────────────────────┘

Provider can now see jobs in categories 1, 3, 5, and 7!
```

## Request Status Lifecycle

```
         ┌──────────────┐
         │   PENDING    │
         │ (Submitted)  │
         └────┬─────────┘
              │
              ├─────────────┬──────────────┐
              │             │              │
              │ (Admin      │ (Admin       │
              │  Approves)  │  Rejects)    │
              │             │              │
              ▼             ▼              │
        ┌──────────┐  ┌──────────┐        │
        │ APPROVED │  │ REJECTED │        │
        │          │  │  + Reason│        │
        └──────────┘  └──────────┘        │
              │              │             │
              │              │             │
     [Category Added] [Notify Provider]   │
     [Notify Provider]                    │
              │              │             │
              ▼              ▼             │
         [User Notified]                 │
                                        │
         (No further action possible)◄──┴──


Provider Perspective:
1. Can see "Request Status: Pending" in profile
2. Can submit new request for different category
3. Cannot modify or cancel pending request
4. Receives notification when decision made
5. New category available immediately if approved
```

## Integration Points

```
Auth System (Existing)
        │
        ├─► Signup Flow
        │       └─► Now requires serviceCategories
        │           └─► Validated before provider creation
        │
        └─► User Token
                └─► Used for all protected endpoints


Job System (Existing)
        │
        └─► Job Listings
                └─► Filter by provider.registeredCategories 
                    OR provider.additionalCategories
                └─► Provider can only apply to matching jobs


Notification System (Existing)
        │
        ├─► Category Request Events
        │   ├─ category_request_received (to admin)
        │   ├─ category_request_approved (to provider)
        │   └─ category_request_rejected (to provider)
        │
        └─► Integrated with existing notification table


Verification System (Existing)
        │
        └─► Phase 2 (Document Verification)
                └─► Can now require docs per category
                └─► Sync with category addition requests
```

## Error States

```
Provider tries to request category:
├─ Already has category → 400 Bad Request
├─ Duplicate pending request → 400 Bad Request  
├─ Invalid categoryId → 400 Bad Request
├─ No documents uploaded → 400 Bad Request
├─ Document upload fails → 400/500 Error
└─ Success → 201 Created + notification


Admin tries to approve request:
├─ Request not found → 404 Not Found
├─ Request already approved/rejected → 400 Bad Request
├─ Database error → 500 Server Error
└─ Success → 200 OK + provider notified


Admin tries to reject request:
├─ Missing rejection reason → 400 Bad Request
├─ Request not found → 404 Not Found
└─ Success → 200 OK + provider notified with reason
```

## Security Boundaries

```
Public Access:
├─ GET /api/categories
└─ POST /api/auth/signup

Provider Access (Role check):
├─ POST /api/categories/request-addition
└─ GET /api/categories/requests/pending

Admin Access (Role check):
├─ GET /api/admin/categories/requests/pending
├─ POST /api/admin/categories/requests/:id/approve
└─ POST /api/admin/categories/requests/:id/reject

Database Constraints:
├─ Foreign keys prevent orphaned records
├─ Cascading deletes clean up on provider deletion
└─ JSONB constraints ensure valid categories
```
