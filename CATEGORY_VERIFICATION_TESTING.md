# Category Verification Testing Guide

## What Was Fixed

The category verification submission endpoint now properly **creates** a new verification record on first submission instead of returning an error. Previously it only worked for updating existing records.

## How to Test

### Step 1: Provider Side - Submit Category Verification Request

1. **Login as a service provider**
   - Email: provider@example.com (or your provider account)
   - Go to Profile page

2. **Find the "Category Verifications" section**
   - Should show any previously requested categories (if any)
   - Should have a "Request New Category" button

3. **Request a new category:**
   - Click "Request New Category"
   - Select one or more categories from the dialog
   - Upload verification documents (images, PDFs, certificates)
   - Click "Submit Request"

4. **Expected Result:**
   - Should see toast notification: "Request Submitted"
   - Notification text: "Your category verification request(s) have been submitted for admin approval."
   - The dialog should close
   - Your request should appear in the "Verification Requests" section as "Pending"

### Step 2: Admin Side - Review & Approve Request

1. **Login as an admin**
   - Email: admin@example.com (or your admin account)
   - Go to Admin Dashboard

2. **Navigate to Category Verifications**
   - Look for "Provider Category Verifications" or similar section
   - Should list all pending requests from providers

3. **Review the request:**
   - See provider name and email
   - See requested category
   - See uploaded documents

4. **Approve or Reject:**
   - Click "Approve" to add category to provider's verified list
   - OR Click "Reject" and provide reason

5. **Expected Result:**
   - Request status changes to "Approved" or "Rejected"
   - Provider receives notification of decision
   - If approved, category becomes available in their profile

### Step 3: Provider Side - Verify Category Added

1. **Login as provider again**
2. **Check Profile → Category Verifications:**
   - Should see the approved category in "Verified Categories" section
   - Request should show as "Approved" in "Verification Requests" history

3. **Check job listings:**
   - Jobs in the approved category should now be visible
   - Provider can apply for jobs in that category

## Troubleshooting

### Issue: Still seeing "Profile updated successfully" instead of verification success

- Make sure you're clicking the button in the **Category Verification dialog**
- The button text should be "Submit Request" (not "Save Profile")
- Check browser console for any error messages

### Issue: Admin doesn't see the pending request

**Check:**
1. Are you logged in as an admin?
2. Do you have admin role in the system?
3. Is the request marked as "pending" status?
4. Try refreshing the admin page

**If still not working:**
- Check server logs for errors
- Verify the provider actually clicked "Submit Request" (not main profile save)
- Check if documents were successfully uploaded

### Issue: Can't upload documents

- Documents must be less than 10MB each
- Common formats: PDF, JPG, PNG, DOC, DOCX
- Make sure you have file upload permissions

## Database Verification

To manually check if the record was created, you can query the database:

```sql
-- Check if verification record exists
SELECT * FROM provider_category_verifications 
WHERE provider_id = '{provider_user_id}' 
ORDER BY created_at DESC;

-- Check for pending requests
SELECT * FROM provider_category_verifications 
WHERE status = 'pending' 
ORDER BY created_at DESC;
```

## Expected Database State

After provider submits a category verification request:

| Column | Value |
|--------|-------|
| id | UUID (auto-generated) |
| provider_id | Provider's user ID |
| category_id | Category they requested |
| documents | JSON array of {name, url} objects |
| status | 'pending' |
| reviewed_by | NULL (until admin reviews) |
| reviewed_at | NULL (until admin reviews) |
| created_at | Submission timestamp |
| updated_at | Submission timestamp |

After admin approves:

| Column | Value |
|--------|-------|
| status | 'approved' |
| reviewed_by | Admin's user ID |
| reviewed_at | Approval timestamp |
| updated_at | Approval timestamp |

## API Endpoints

If testing manually with API calls:

### Provider submits request
```bash
POST /api/provider/category-verifications/{categoryId}/submit-documents
Authorization: Bearer {token}
Content-Type: application/json

{
  "documents": [
    {"name": "certificate.pdf", "url": "https://..."},
    {"name": "license.jpg", "url": "https://..."}
  ]
}
```

### Admin gets pending requests
```bash
GET /api/admin/provider-category-verifications
Authorization: Bearer {admin_token}
```

### Admin approves request
```bash
PATCH /api/admin/provider-category-verifications/{providerId}/{categoryId}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "action": "approve"
}
```

### Admin rejects request
```bash
PATCH /api/admin/provider-category-verifications/{providerId}/{categoryId}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "action": "reject",
  "reason": "Documents don't meet requirements"
}
```
