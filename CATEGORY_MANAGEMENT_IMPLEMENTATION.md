# Category Management System Implementation

## Overview
Implemented a comprehensive category management system that allows service providers to register with specific categories at signup and request additional categories later, with admin review and approval workflows.

## Key Changes Made

### 1. Database Schema Updates (`shared/schema.ts`)

#### New Tables and Fields:
- **`categoryAdditionRequests` table**: Tracks category addition requests from providers
  - `id` (UUID): Primary key
  - `providerId` (UUID): Reference to service provider
  - `categoryId` (number): Category being requested
  - `documents` (JSONB): Supporting documents for verification
  - `status` (enum): 'pending', 'approved', 'rejected'
  - `reviewedBy`, `reviewedAt`, `rejectionReason`: Admin review metadata

#### Updated Provider Table:
- Replaced `serviceCategories` field with two fields:
  - `registeredCategories`: Categories verified at signup
  - `additionalCategories`: Categories approved after signup

#### New Enums:
- `categoryRequestStatusEnum`: 'pending' | 'approved' | 'rejected'
- Updated `notificationTypeEnum` with new notification types:
  - 'category_request_received'
  - 'category_request_approved'
  - 'category_request_rejected'

#### Updated Schemas:
- `individualSignupSchema`: Added `serviceCategories` array
- `insertCategoryAdditionRequestSchema`: New schema for category requests

### 2. Backend Services and Routes

#### New Category Service (`server/services/category.service.ts`)
Methods:
- `createCategoryAdditionRequest()`: Create new request
- `getCategoryAdditionRequest()`: Retrieve specific request
- `getPendingCategoryAdditionRequests()`: Get all pending requests (admin)
- `getPendingCategoryAdditionRequestsForProvider()`: Get provider's pending requests
- `approveCategoryAdditionRequest()`: Approve and update provider categories
- `rejectCategoryAdditionRequest()`: Reject with reason

#### New Category Routes (`server/routes/categories.routes.ts`)
Public Routes:
- `GET /api/categories`: List all available categories

Provider Routes (Protected):
- `POST /api/categories/request-addition`: Create category request
- `GET /api/categories/requests/pending`: Get provider's pending requests

#### Updated Admin Routes (`server/routes/admin.routes.ts`)
New admin endpoints:
- `GET /api/admin/categories/requests/pending`: List all pending requests
- `POST /api/admin/categories/requests/:id/approve`: Approve request
- `POST /api/admin/categories/requests/:id/reject`: Reject with reason

#### Updated Storage Layer (`server/storage.ts`)
New methods:
- `createCategoryAdditionRequest()`
- `getCategoryAdditionRequest()`
- `getPendingCategoryAdditionRequests()`
- `getPendingCategoryAdditionRequestsForProvider()`
- `updateCategoryAdditionRequestStatus()`
- `getCategory()`: Retrieve category by ID

### 3. Authentication & Registration Updates

#### Updated Signup Flow (`server/routes/auth.routes.ts`)
- Providers now required to select at least one category during signup
- Categories extracted from request and passed to provider creation
- Provider created with `registeredCategories` populated
- `additionalCategories` initialized as empty array

#### Provider Creation
```typescript
await storage.createProvider({
  userId: user.id,
  registeredCategories: serviceCategories || [],
  additionalCategories: [],
  primaryCity,
  approvedServiceAreas: [primaryCity],
  serviceAreaRadiusMeters: 10000,
});
```

### 4. Frontend Components

#### New CategorySelector Component (`client/src/components/category-selector.tsx`)
- Fetches categories from `/api/categories`
- Displays categories in grid layout
- Allows multi-select with checkboxes
- Shows validation alerts
- Supports required/optional mode

#### Updated Signup Page (`client/src/pages/auth/signup.tsx`)
- Imports and uses `CategorySelector` component
- Adds `selectedCategories` state
- For individual providers: shows category selector after city selection
- For company providers: shows category selector after company details
- Validates that providers select at least one category before submission
- Passes categories to signup payload as `serviceCategories`

## User Flows

### Service Provider Registration Flow
1. **Signup**: Provider registers with name, email, password, city, and **service categories**
2. **Email Verification**: Verify email address
3. **Identity Verification (Phase 1)**: Upload ID documents
4. **Category Documents (Phase 2)**: Upload documents proving expertise in selected categories
5. **Admin Review**: Admin verifies identity and documents
6. **Activation**: Provider can view jobs in registered categories only

### Category Addition Request Flow
1. **Request Creation**: Provider clicks "Add New Category" in profile
2. **Document Upload**: Provider selects category and uploads supporting documents
3. **Admin Notification**: Admin receives notification of new request
4. **Admin Review**: Admin reviews documents and decides to approve/reject
5. **Provider Notification**: Provider notified of decision
6. **Category Addition**: If approved, category added to `additionalCategories`
7. **Access**: Provider can now see jobs in both registered and additional categories

### Admin Management Flow
1. **View Requests**: Admin views pending category addition requests
2. **Review Documents**: Admin reviews supporting documents
3. **Decision**: Approve or reject with optional reason
4. **Notification**: Provider automatically notified
5. **Category Update**: System updates provider's categories if approved

## Notifications

New notification types trigger:
- `category_request_received`: When provider submits request (admin notification)
- `category_request_approved`: When admin approves request (provider notification)
- `category_request_rejected`: When admin rejects request (provider notification)

## Data Integrity

- Categories stored separately (registered vs additional) for audit trail
- Request history maintained in `categoryAdditionRequests` table
- Admin reviews tracked with `reviewedBy`, `reviewedAt`, `rejectionReason`
- Prevents duplicate category requests for same category

## API Contracts

### Request Category Addition
```typescript
POST /api/categories/request-addition
{
  categoryId: number,
  documents: [{ name: string, url: string }]
}
```

### Admin Approve/Reject
```typescript
POST /api/admin/categories/requests/:id/approve
POST /api/admin/categories/requests/:id/reject
{
  rejectionReason?: string  // Required for reject
}
```

## Migration Considerations

- Existing providers with empty `serviceCategories` should be reviewed
- Run migration to ensure provider records have initialized `additionalCategories`
- Existing registered categories can be mapped to `registeredCategories` during migration

## Next Steps

### Remaining Tasks:
1. **Profile Page Updates**: 
   - Add "Request New Category" section in provider profile
   - Show registered categories vs additional categories
   - Display pending requests with status
   - Allow document upload for new requests

2. **Admin Dashboard Updates**:
   - Create admin view for pending category requests
   - Show provider information and document previews
   - Implement approve/reject UI with reason field

3. **Verification Flow Integration**:
   - Phase 2 of verification should collect documents per category
   - Match submitted documents to categories claimed

4. **Testing**:
   - Test provider signup with category selection
   - Test category request workflow
   - Test admin approval/rejection
   - Test notification delivery
   - Test access control (provider can only see jobs in their categories)

## Files Modified

### Backend:
- `shared/schema.ts`: Schema updates
- `server/storage.ts`: Storage methods
- `server/routes/auth.routes.ts`: Registration flow
- `server/routes.ts`: Route registration
- `server/routes/admin.routes.ts`: Admin category management
- `server/services/category.service.ts`: NEW - Category service
- `server/routes/categories.routes.ts`: NEW - Category routes
- `server/services/index.ts`: Export new service

### Frontend:
- `client/src/pages/auth/signup.tsx`: Registration UI updates
- `client/src/components/category-selector.tsx`: NEW - Category selector component
