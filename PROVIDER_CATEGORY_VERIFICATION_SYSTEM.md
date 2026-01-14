# Service Provider Category Verification & Job Visibility System

## Overview

This document describes the complete implementation of a **Service Provider Category Verification & Job Visibility System** that restricts service providers to only viewing and accepting jobs for categories they are verified in, while allowing skill expansion through an admin-approved verification process.

## Problem Statement Addressed

Previously, service providers could:
- Freely select job categories without verification
- View and accept jobs outside their actual skills
- Example: A plumber could accept an electrician job

This system enforces strict category verification to ensure only qualified providers accept jobs in their verified categories.

## System Architecture

### 1. Data Model

#### New Table: `provider_category_verifications`
Tracks verification status for each provider-category combination.

**Fields:**
- `id`: UUID primary key
- `provider_id`: UUID reference to users table (provider)
- `category_id`: Integer reference to categories table
- `status`: ENUM ('pending', 'approved', 'rejected')
- `documents`: JSONB array of {name, url} objects
- `rejection_reason`: Text (for rejected verifications)
- `reviewed_by`: UUID reference to reviewer (admin)
- `reviewed_at`: Timestamp of review
- `created_at`: Timestamp of creation
- `updated_at`: Timestamp of last update

**Unique Constraint:** (provider_id, category_id) - ensures one verification record per provider-category pair

#### Modified Table: `providers`
- `registeredCategories`: Categories selected at signup (now all start as pending)
- `additionalCategories`: Categories added via category addition requests

### 2. Verification Flow

#### Phase 1: Service Provider Registration (Signup)
1. Provider signs up and selects 1+ service categories
2. System creates `provider_category_verifications` records for each selected category
3. Status: **'pending'** (waiting for admin review)
4. Categories are **NOT YET APPROVED** for job visibility
5. Provider cannot see/accept jobs yet

```typescript
// During signup, for each selected category:
await storage.createProviderCategoryVerification(
  userId,
  categoryId,
  [] // Documents submitted in next phase
);
```

#### Phase 2: Document Submission (Provider)
1. Provider submits verification documents for each category
   - Certificates
   - Trade licenses
   - Enrollment letters
   - Accreditation proof
2. Documents linked to specific category
3. Status remains **'pending'**

**Endpoint:**
```
POST /api/provider/category-verifications/:categoryId/submit-documents
Body: { documents: [{name, url}, ...] }
```

#### Phase 3: Admin Verification Review
Admin dashboard displays:
- Provider details
- Selected categories with pending status
- Uploaded documents per category

**Admin Actions:**
1. **Approve** → Category status → **'approved'** → Provider can see/accept jobs
2. **Reject** → Category status → **'rejected'** → Rejection reason stored → Provider must reapply

**Endpoint:**
```
PATCH /api/admin/provider-category-verifications/:providerId/:categoryId
Body: { 
  status: 'approved' | 'rejected',
  rejectionReason: 'optional reason for rejection'
}
```

#### Phase 4: Category Addition After Registration (Skill Expansion)
1. Provider requests to add new category from profile
2. Provider uploads verification documents for new category
3. Creates new `provider_category_verifications` record with status **'pending'**
4. Admin reviews and approves/rejects
5. Upon approval, category becomes active

**Endpoint:**
```
POST /api/categories/request-addition
Body: {
  categoryId: number,
  documents: [{name, url}, ...]
}
```

## Job Visibility & Acceptance Rules (Critical)

### Job Visibility Filtering

Providers see jobs ONLY matching:
1. **Approved Categories** - Must have verified status = 'approved'
2. **Approved Cities** - Must be in provider's approved service areas
3. **Correct Provider Type** - Must match job's allowedProviderType
4. **Open Status** - Jobs with status 'open' or 'pending_selection'

**Implementation Location:** `GET /api/jobs`

```typescript
// Get ONLY approved categories
const approvedCategories = await storage.getApprovedCategoriesForProvider(providerId);

// Filter jobs
const visibleJobs = allJobs.filter(job => {
  const inApprovedCategory = approvedCategories.includes(job.categoryId);
  const inApprovedCity = approvedCities.includes(job.city);
  const matchesProviderType = job.allowedProviderType === 'both' || job.allowedProviderType === providerType;
  const isOpenForApplications = job.status === 'open' || job.status === 'pending_selection';
  
  return inApprovedCategory && inApprovedCity && matchesProviderType && isOpenForApplications;
});
```

### Job Application Blocking

When provider attempts to apply for a job (`POST /api/jobs/:id/apply`):

1. **Verify City Access** - Must be approved for job's city
2. **Verify Category Access** - CRITICAL: Must have approved status for job's category
3. **Verify Job Status** - Job must be open for applications
4. **Verify Application Limit** - Max 4 providers per job

**Code:**
```typescript
// CRITICAL verification
const approvedCategories = await storage.getApprovedCategoriesForProvider(providerId);
if (!approvedCategories.includes(job.categoryId)) {
  return res.status(403).json({ 
    message: 'You are not verified to accept jobs in this category.' 
  });
}
```

## API Endpoints

### Provider Endpoints

#### Get Category Verifications
```
GET /api/provider/category-verifications
Response: [
  {
    id: uuid,
    providerId: uuid,
    categoryId: number,
    status: 'pending' | 'approved' | 'rejected',
    documents: [{name, url}, ...],
    rejectionReason?: string,
    reviewedBy?: uuid,
    reviewedAt?: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp
  }
]
```

#### Submit Verification Documents
```
POST /api/provider/category-verifications/:categoryId/submit-documents
Request Body: {
  documents: [
    { name: string, url: string },
    ...
  ]
}
Response: { message, verification }
```

#### Get Approved Categories
```
GET /api/provider/approved-categories
Response: { approvedCategories: number[] }
```

### Admin Endpoints

#### List Pending Verifications
```
GET /api/admin/provider-category-verifications
Response: [
  {
    ...verification fields,
    provider: { id, name, email, ... },
    category: { id, name, description, ... }
  }
]
```

#### Review Verification
```
PATCH /api/admin/provider-category-verifications/:providerId/:categoryId
Request Body: {
  status: 'approved' | 'rejected',
  rejectionReason?: string (required if rejected)
}
Response: { message, verification }
```

## Storage Methods

### IStorage Interface
```typescript
// Create/Read
createProviderCategoryVerification(providerId, categoryId, documents)
getProviderCategoryVerifications(providerId)
getProviderCategoryVerification(providerId, categoryId)
getApprovedCategoriesForProvider(providerId)
getAllPendingCategoryVerifications()

// Update
updateProviderCategoryVerificationStatus(providerId, categoryId, status, reviewerId, rejectionReason?)
```

## Verification Service Methods

### VerificationService
```typescript
// Submit documents
submitCategoryVerificationDocuments(providerId, categoryId, documents)

// Admin review
getPendingProviderCategoryVerifications()
approveCategoryVerification(providerId, categoryId, adminId)
rejectCategoryVerification(providerId, categoryId, adminId, rejectionReason)
```

## Database Migration

Run the migration to create the new table:
```bash
npm run db:push
```

This will execute `drizzle/0002_provider_category_verification.sql`

## Notifications

Providers receive notifications at key verification events:

### Notification Types
- `category_request_approved` - Category verification approved
- `category_request_rejected` - Category verification rejected
- `new_verification` - When admin receives documents for review

### Notification Creation
```typescript
// When admin approves
await notificationService.notifyRecipient(
  providerId,
  'category_request_approved',
  'Category Verification Approved',
  `Your verification for the "Plumbing" category has been approved!`
);

// When admin rejects
await notificationService.notifyRecipient(
  providerId,
  'category_request_rejected',
  'Category Verification Rejected',
  `Your verification was rejected. Reason: Documents not valid for this category.`
);
```

## Frontend Implementation

### Provider Views Needed

#### 1. Provider Signup
- Multi-select checkboxes for service categories
- Display selected categories with "Pending Verification" status
- Explanation that documents must be uploaded before accessing jobs

#### 2. Category Verification Upload
- List of pending categories
- File upload for each category
- Status display (pending/approved/rejected)
- Rejection reason display for rejected categories
- Approved categories list

#### 3. Job Browsing
- Show only jobs matching approved categories
- Display message if no approved categories yet
- Show approval status in job filter

#### 4. Category Addition Request
- Button to "Add New Category"
- Category selector
- Document upload
- Request history showing status

### Admin Views Needed

#### 1. Provider Verification Dashboard
- List of all pending category verifications
- Provider name, email
- Category name
- Document preview (links to uploaded files)
- Approval/Rejection buttons
- Rejection reason input field

#### 2. Verification Status Tracking
- Filter by status (pending/approved/rejected)
- Sort by date submitted
- Search by provider name
- Bulk actions (if needed)

## Key Security & Validation Points

1. **Frontend Validation**
   - Validate documents before upload
   - Show file size limits
   - Confirm action before rejecting

2. **Backend Validation**
   - Verify provider is requesting their own data
   - Validate category IDs exist
   - Ensure admin role for approval endpoints
   - Check job category in approved list before accepting

3. **Data Integrity**
   - Unique constraint on (provider_id, category_id)
   - Cascade delete when provider deleted
   - Timestamp tracking for audit trail
   - Admin review tracking for accountability

## Success Criteria

✅ Service providers **cannot see** jobs outside approved categories
✅ Service providers **cannot apply** for jobs outside approved categories
✅ Providers start with **pending** status for signup categories
✅ Admin can **approve or reject** verifications
✅ Providers receive **notifications** on verification decisions
✅ Providers can **add new categories** after signup
✅ All **category verification is audited** (reviewer, timestamp, reason)
✅ System **reflects real-world** trade certification workflows

## Testing Checklist

- [ ] Provider signup creates pending category verifications
- [ ] Provider document upload updates verification
- [ ] Admin sees pending verifications
- [ ] Admin approval makes categories visible for jobs
- [ ] Admin rejection prevents category usage
- [ ] Provider cannot apply for unapproved categories
- [ ] Provider cannot see unapproved category jobs
- [ ] Provider gets notifications on approval/rejection
- [ ] Category addition request follows same flow
- [ ] Rejected category can be reapplied
- [ ] Migration runs successfully
- [ ] Database indexes work for performance

## Related Files

**Schema:**
- `shared/schema.ts` - Tables, enums, relations, schemas, types

**Storage:**
- `server/storage.ts` - IStorage interface and DatabaseStorage implementation

**Services:**
- `server/services/verification.service.ts` - Verification business logic
- `server/services/notification.service.ts` - Notification handling

**Routes:**
- `server/routes/provider.routes.ts` - Provider verification endpoints
- `server/routes/admin.routes.ts` - Admin verification endpoints
- `server/routes/jobs.routes.ts` - Job visibility filtering
- `server/routes/auth.routes.ts` - Signup flow

**Database:**
- `drizzle/0002_provider_category_verification.sql` - Migration

## Future Enhancements

1. **Bulk Category Verification** - Admin bulk approve/reject
2. **Category Expiration** - Require periodic re-verification
3. **Category Tiers** - Basic, Advanced, Expert levels
4. **Provider Audit Log** - Track all verification changes
5. **Document History** - Keep revision history of submissions
6. **Email Notifications** - Send emails on verification changes
7. **Dashboard Analytics** - Verification approval rates, average review time
8. **Automatic Expiration** - Mark verifications as expired after 12 months
