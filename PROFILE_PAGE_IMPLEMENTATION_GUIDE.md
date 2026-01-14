# Category Addition Request UI - Profile Page Implementation Guide

## Overview
This document provides implementation guidance for the remaining profile page updates needed to complete the category management system.

## Components to Create/Update

### 1. CategoryAdditionRequestDialog Component
**File**: `client/src/components/category-addition-request-dialog.tsx`

Purpose: Modal/dialog for providers to request a new category

Features:
- Category selector (excluding already-owned categories)
- Document upload interface
- Form validation
- Success/error feedback

```typescript
interface CategoryAdditionRequestDialogProps {
  providerId: string;
  existingCategories: number[]; // registered + additional
  onSuccess: () => void;
  onError: (error: string) => void;
}

// Key functionality:
// 1. Load available categories
// 2. Filter out categories provider already has
// 3. Show document upload interface
// 4. Call POST /api/categories/request-addition on submit
// 5. Handle success/error responses
```

### 2. ProviderCategoriesSection Component
**File**: `client/src/components/provider-categories-section.tsx`

Purpose: Display provider's categories in profile

Features:
- Show registered categories (with "Initial" badge)
- Show additional categories (with "Additional" badge)
- Show pending requests with status
- Show approval/rejection reasons
- Open dialog to request new category

```typescript
interface ProviderCategoriesSectionProps {
  registeredCategories: number[];
  additionalCategories: number[];
  pendingRequests: CategoryAdditionRequest[];
  allCategories: Category[];
  onRequestNew: () => void;
  isEditable: boolean;
}

// Display structure:
// [Registered Categories]
// - Show each with badge and description
// 
// [Additional Categories]
// - Show each with badge and description
//
// [Pending Requests]
// - Show category name
// - Show submission date
// - Show status (pending/approved/rejected)
// - Show rejection reason if rejected
//
// [Action Button]
// - "Request New Category" button
```

### 3. CategoryAdditionRequestsList Component
**File**: `client/src/components/category-addition-requests-list.tsx`

Purpose: Display history of category requests

Features:
- Tabular view of all requests
- Filter by status (pending, approved, rejected)
- Show request date, category, status, reason
- Sort options

## Profile Page Integration

Update `client/src/pages/provider/profile.tsx`:

```typescript
import { ProviderCategoriesSection } from '@/components/provider-categories-section';
import { CategoryAdditionRequestDialog } from '@/components/category-addition-request-dialog';

// In the profile render:
<Card>
  <CardHeader>
    <CardTitle>Service Categories</CardTitle>
  </CardHeader>
  <CardContent>
    <ProviderCategoriesSection
      registeredCategories={provider.registeredCategories}
      additionalCategories={provider.additionalCategories}
      pendingRequests={pendingRequests}
      allCategories={categories}
      onRequestNew={handleOpenDialog}
      isEditable={isOwnProfile}
    />
  </CardContent>
</Card>

{showCategoryDialog && (
  <CategoryAdditionRequestDialog
    providerId={userId}
    existingCategories={[
      ...provider.registeredCategories,
      ...provider.additionalCategories
    ]}
    onSuccess={handleRequestSuccess}
    onError={handleRequestError}
  />
)}
```

## API Integration Points

### Fetch Provider's Pending Requests
```typescript
// GET /api/categories/requests/pending
const pendingRequests = await apiRequest('GET', '/api/categories/requests/pending');
```

### Create Category Request
```typescript
// POST /api/categories/request-addition
const response = await apiRequest('POST', '/api/categories/request-addition', {
  categoryId: selectedCategoryId,
  documents: uploadedDocuments
});
```

### Fetch All Categories (for dropdown)
```typescript
// GET /api/categories
const categories = await apiRequest('GET', '/api/categories');
```

## Document Upload Handling

### Multi-File Upload Component
```typescript
interface DocumentUploadProps {
  onDocumentsSelected: (documents: File[]) => void;
  maxFiles?: number;
  allowedTypes?: string[];
  maxFileSize?: number; // in bytes
}

// Features:
// 1. Drag and drop support
// 2. File type validation
// 3. File size validation
// 4. Preview before upload
// 5. Remove individual files
// 6. Show upload progress

// Files should be converted to Base64 before sending:
const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};
```

## Admin Dashboard Update

**File**: `client/src/pages/admin/category-requests.tsx` (NEW)

Purpose: Admin interface for managing category addition requests

Features:
- Table of pending requests with sorting/filtering
- Provider information (name, email, rating)
- Category information
- Document viewer/download
- Approve/Reject buttons
- Rejection reason input
- Request history (approved/rejected)

```typescript
// Components to use:
// - Table with columns:
//   - Provider Name
//   - Provider Rating
//   - Requested Category
//   - Submission Date
//   - Status
//   - Actions
// 
// Modal for viewing documents:
//   - Show uploaded documents
//   - Allow download
//   - Show file info (size, type, upload date)
//
// Approve/Reject Modal:
//   - Confirmation message
//   - Rejection reason text area (required for reject)
//   - Action buttons
```

## State Management

Consider using React hooks for:
- `usePendingCategoryRequests()`: Fetch pending requests for current provider
- `useAllCategories()`: Fetch all categories
- `useCategoryAdditionRequest()`: Single request operations
- `useAdminCategoryRequests()`: Admin view operations

Or integrate with existing state management solution if available.

## Validation Rules

1. **Category Selection**:
   - Provider cannot request a category they already have
   - Only one pending request per category per provider
   - Category must exist in system

2. **Document Upload**:
   - At least 1 document required
   - Max file size: 10MB per document
   - Allowed types: PDF, PNG, JPG, JPEG, GIF, DOC, DOCX
   - Total upload size: 50MB max

3. **Status Rules**:
   - Pending requests cannot be modified
   - Can submit new request after rejection
   - Approved categories are permanent

## Notification Integration

Ensure notifications are displayed:
- `category_request_received`: Admin notifications (optional bell icon)
- `category_request_approved`: Provider sees success notification
- `category_request_rejected`: Provider sees error notification with reason

## Error Handling

Common errors to handle:
- Duplicate category request (400)
- Category already owned (400)
- Invalid category ID (400)
- Document upload failed (400/500)
- Admin approval/rejection failed (500)
- Network errors

## Accessibility Requirements

- ARIA labels for all interactive elements
- Keyboard navigation support
- Screen reader friendly
- Color not sole indicator of status
- Sufficient contrast ratios

## Testing Checklist

- [ ] Provider can request new category
- [ ] Provider cannot request duplicate category
- [ ] Provider cannot request own category
- [ ] Documents upload correctly
- [ ] Admin sees pending requests
- [ ] Admin can approve request
- [ ] Admin can reject with reason
- [ ] Provider notified on approval
- [ ] Provider notified on rejection with reason
- [ ] Category added to provider after approval
- [ ] Category appears in job listings after approval
- [ ] Provider cannot accept jobs in category until approved
