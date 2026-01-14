# Frontend Category Verification - Quick Testing Guide

## What's New

### For Service Providers:
1. **Profile Page** → "Category Verifications" section
   - View your current verified categories (green badges)
   - See all verification requests (pending/approved/rejected)
   - Click "Request New Category" button to add new categories

2. **Request New Category Dialog**
   - Select a category from dropdown
   - Upload verification documents
   - Click "Submit Request"
   - Track status in your profile

### For Admins:
1. **Admin Dashboard** → New "Category Verifications" menu item
   - Shows pending verification count
   - Lists all pending provider requests

2. **Review Modal**
   - Click "Review" on any request
   - View provider details, category, and documents
   - Add admin notes (optional)
   - Click "Approve" or "Reject"
   - If rejecting, reason is required

## Testing Steps

### Provider Testing:
```
1. Log in as service provider
2. Go to Profile page
3. Scroll to "Category Verifications" section
4. Click "Request New Category"
5. Select a category (e.g., "Plumbing" if not already in your profile)
6. Click file input and select document(s)
7. Click "Submit Request"
8. Verify request appears as "pending" in verification list
9. Log out
```

### Admin Testing:
```
1. Log in as admin
2. Go to Admin Dashboard
3. Click "Category Verifications" card
4. See list of pending requests
5. Click "Review" on any request
6. View provider and category details
7. View uploaded documents (clickable links)
8. Add optional notes
9. Click "Approve" or "Reject"
10. If rejecting, enter rejection reason
11. Verify status updates in list
12. Verify notifications sent to provider
```

## Files Modified

| File | Changes |
|------|---------|
| `client/src/pages/profile.tsx` | Added category verification section, dialog, and document upload handler |
| `client/src/pages/admin/index.tsx` | Added category verifications menu item and fetch stats |
| `client/src/pages/admin/category-verifications.tsx` | NEW - Complete admin dashboard page |
| `client/src/App.tsx` | Added route and import for category verifications page |

## API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/provider/category-verifications` | GET | Fetch provider's verification requests |
| `/api/provider/category-verifications/:categoryId/submit-documents` | POST | Submit new category verification |
| `/api/admin/provider-category-verifications` | GET | Fetch pending verifications for admin |
| `/api/admin/provider-category-verifications/:providerId/:categoryId` | PATCH | Approve/reject verification |

## Visual Elements

### Provider Profile Section:
```
┌─ Category Verifications ────────────────────────────────┐
│ Categories you are verified to work in.                  │
│ Request verification for new categories.                 │
│                                      [+ Request New Cat]  │
│                                                          │
│ Verified Categories:                                    │
│ ✓ Plumbing    ✓ Electrical    ✓ Carpentry              │
│                                                          │
│ Verification Requests:                                  │
│ ⏳ HVAC Services        Pending      [Nov 15, 2024]     │
│ ✓ Painting Services    Approved     [Nov 10, 2024]     │
│ ✗ Masonry Services     Rejected     [Nov 8, 2024]      │
│                        Reason: License not verified     │
└───────────────────────────────────────────────────────┘
```

### Admin Dashboard:
```
⚙ CATEGORY VERIFICATIONS
Review and approve provider requests for category verification.

[⚠] Pending Requests: 3

┌─ John Doe (john@email.com) ──────────────────────────────┐
│ Plumbing          [3 docs]        Nov 15, 2024  [Review] │
└───────────────────────────────────────────────────────────┘
┌─ Jane Smith (jane@email.com) ─────────────────────────────┐
│ Electrical        [2 docs]        Nov 14, 2024  [Review] │
└───────────────────────────────────────────────────────────┘
```

## Status Indicators

| Status | Icon | Color | Meaning |
|--------|------|-------|---------|
| Pending | ⏳ | Yellow | Awaiting admin review |
| Approved | ✓ | Green | Category verified, can accept jobs |
| Rejected | ✗ | Red | Category not verified, reason provided |

## Form Validation

### Provider Request Form:
- Category: Required, must select from dropdown
- Documents: Required, at least 1 document needed
- File size: Max 10MB per document
- All fields must be filled to enable submit

### Admin Review:
- Rejection requires reason to be filled
- Approval allows optional notes
- Both actions notify the provider

## Notifications

**Provider Receives:**
- "Your category verification request has been submitted for admin approval." (on submit)
- "Your category verification for [Category] has been approved." (on approval)
- "Your category verification for [Category] has been rejected. Reason: [text]" (on rejection)

**Admin Receives:**
- "Category Approved" toast on approve action
- "Category Rejected" toast on reject action
- List auto-refreshes every 15 seconds

## Data Flow

```
Provider:
  1. Opens Profile → Sees Category Verifications section
  2. Clicks "Request New Category" → Dialog opens
  3. Selects category & uploads documents → Form validates
  4. Clicks Submit → Documents uploaded, request created
  5. Request goes into "pending" status
  6. Waits for admin review

Admin:
  1. Opens Admin Dashboard → Sees pending count badge
  2. Clicks Category Verifications → List loads (auto-refreshes)
  3. Clicks Review on request → Modal opens with full details
  4. Reviews provider, category, documents
  5. Clicks Approve or Reject → Status changes, notification sent
  6. Provider sees updated status in their profile
```

## Browser Support
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (responsive design)

## Performance Notes
- List auto-refreshes every 15 seconds (admin side)
- Documents uploaded as base64 (no file server needed)
- Lazy loading of category verifications on profile load
- Pagination: None (assumes < 100 pending requests for admin list)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Dropdown shows no categories | Check that not all categories are already requested |
| Documents not uploading | Check file size (max 10MB) |
| Admin list not updating | Browser cache - refresh page or wait 15 seconds |
| "Please upload at least one document" | Add documents before clicking submit |
| Rejection error | Ensure rejection reason is filled |

## Build & Deploy

```bash
# Build
npm run build

# Deploy
# Frontend files in: dist/public
# Backend files in: dist/index.js
```

## Verification Checklist Before Going Live

- [ ] Test provider can request new categories
- [ ] Test document upload with various file types
- [ ] Test admin can approve verification
- [ ] Test admin can reject with reason
- [ ] Test provider sees updated status
- [ ] Test job filtering respects approved categories
- [ ] Test rejection reasons display in provider profile
- [ ] Test admin notification badges update
- [ ] Test on mobile devices
- [ ] Test with multiple concurrent users
