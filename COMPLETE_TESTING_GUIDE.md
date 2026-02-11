# 🧪 End-to-End Testing Guide - Invoice & Payment System

Complete testing guide for verifying the invoice and payment system works correctly.

---

## 📋 Test Setup

### Prerequisites
1. Database migration run: `drizzle migrate`
2. Backend server running: `npm run dev` (server)
3. Frontend running: `npm run dev` (client)
4. Two test accounts (provider and requester)
5. A job with provider already assigned

### Test Data
- Provider: `provider@test.com`
- Requester: `requester@test.com`
- Job ID: Will be created during test

---

## 🎬 End-to-End Test Scenarios

### **Scenario 1: Complete Invoice & Payment Flow (Cash)**

#### Step 1: Create Job (Requester)
```
1. Login as requester (requester@test.com)
2. Navigate to "Post Job"
3. Fill job form:
   - Title: "House Painting"
   - Description: "Paint living room and master bedroom"
   - Category: "Home Repairs"
   - Location: "Gaborone"
4. Click "Post Job"
5. Job created with status: "open"
6. Note the Job ID
```

#### Step 2: Provider Applies
```
1. Login as provider (provider@test.com)
2. Navigate to "Browse Jobs"
3. Find "House Painting" job
4. Click "Apply for Job"
5. Enter message: "I can complete this in 2 days"
6. Click "Submit Application"
7. Status shows "Application Pending"
```

#### Step 3: Requester Selects Provider
```
1. Login as requester
2. Go to job detail page
3. In "Provider Applications" section
4. Click "Select Provider" on provider's application
5. Confirm selection
6. Job status changes to: "accepted"
```

#### Step 4: Provider Creates Invoice
```
1. Login as provider
2. Go to job detail page
3. Scroll to "Invoice & Payment Status" section
4. In Invoice tab, fill InvoiceForm:
   - Amount: 1500 (for the painting job)
   - Payment Method: "Cash (Manual Confirmation)"
   - Description: "Labour for painting 2 rooms including material"
   - Notes: "Payment due after completion"
5. Click "Create Invoice"
   ✅ Invoice appears in status
   ✅ Status shows "Invoice Draft"
   ✅ Toast: "Invoice created successfully"
```

#### Step 5: Provider Sends Invoice
```
Expected: Invoice card shows its draft state
1. Find "Send to Requester" button (in the invoice card)
   Note: Might be automatically sent or shown as separate action
2. Invoice status changes to "sent"
   ✅ Toast: "Invoice sent"
   ✅ Requester receives email notification
```

#### Step 6: Requester Reviews and Approves Invoice
```
1. Login as requester
2. Go to job detail page
3. See InvoiceApproval component showing:
   - Amount: P1500.00
   - Method: Cash
   - Description: "Labour for painting..."
   - Status badge: "Sent"
4. Click "Approve Invoice"
   ✅ Status changes to "Approved" (green badge)
   ✅ Toast: "Invoice approved. You can now proceed with payment"
   ✅ Provider receives email: "Invoice Approved!"
```

#### Step 7: View Payment Status
```
1. Requester sees PaymentForm component
2. Shows:
   - Amount Due: P1500.00
   - Payment Method: Cash (Manual Confirmation)
3. Instructions: "Please arrange to pay the provider in cash..."
```

#### Step 8: Requester Confirms Cash Payment
```
1. Click "Confirm Cash Payment"
2. Dialog appears: "Confirm that you have paid P1500.00..."
3. Notes field (optional): "Paid on 11 Feb 2024"
4. Click "Confirm Payment in dialog
   ✅ Status changes to "Paid" (green badge)
   ✅ Toast: "Payment marked as completed"
   ✅ Provider receives email: "Payment Confirmation"
```

#### Step 9: Provider Can Now Start/Complete Job
```
1. Login as provider
2. Go to job detail page
3. In "Update Job Status" section
4. Click "En Route" (was previously disabled)
   ✅ Job status changes to "enroute"
5. Click "On Site"
   ✅ Job status changes to "onsite"
6. Click "Mark as Complete"
   ✅ Job status changes to "completed"
   ✅ Requester can now rate provider
```

#### ✅ Scenario 1 Expected Results
- ✅ Invoice created and sent
- ✅ Invoice approved by requester
- ✅ Payment recorded as paid
- ✅ Both parties notified via email
- ✅ Job can be completed
- ✅ No messages like "INVOICE_NOT_APPROVED" or "PAYMENT_NOT_COMPLETED"

---

### **Scenario 2: Decline and Resubmit Invoice**

#### Step 1-5: Same as Scenario 1 (up to invoice sent)

#### Step 6: Requester Declines Invoice
```
1. Login as requester
2. Go to job detail page
3. In InvoiceApproval component
4. Click "Request Changes"
5. Dialog appears
6. Enter reason: "Please reduce the cost to P1200"
7. Click "Request Changes"
   ✅ Invoice status reverts to "Draft"
   ✅ Toast: "Invoice declined..."
   ✅ Provider receives email: "Invoice Changes Requested"
```

#### Step 7: Provider Edits Invoice
```
1. Login as provider
2. Go to job detail page
3. InvoiceForm shows "Edit Invoice" (was "Create Invoice")
4. Amount field changed to: 1200
5. Click "Update Invoice"
   ✅ Updated amount shown
   ✅ Toast: "Invoice updated successfully"
```

#### Step 8: Provider Resends Invoice
```
1. Find "Send to Requester" button again
2. Click to send updated invoice
   ✅ Status changes back to "sent"
   ✅ Requester gets notification about updated invoice
```

#### Step 9: Requester Approves Updated Invoice
```
Same as Scenario 1 Step 6, but new amount (P1200)
```

#### ✅ Scenario 2 Expected Results
- ✅ Invoice declined successfully
- ✅ Provider can edit and resubmit
- ✅ Requester can approve new version
- ✅ Workflow continues as expected

---

### **Scenario 3: Card Payment**

#### Step 1-6: Same as Scenario 1 (up to invoice approved)

#### Step 7: Process Card Payment
```
1. Login as requester
2. Go to job detail page
3. PaymentForm shows card payment fields
4. Card Transaction ID field appears
5. Enter: "CHARGE_STRIPE_ch_1234567890"
6. Click "Process Card Payment"
   ✅ Payment status changes to "Paid"
   ✅ Toast: "Payment processed successfully"
   ✅ Provider notified
```

#### ✅ Scenario 3 Expected Results
- ✅ Card payment processed
- ✅ Transaction ID stored
- ✅ Job eligible for completion

---

### **Scenario 4: Bank Transfer Payment**

#### Step 1-6: Same as Scenario 1 (up to invoice approved)

#### Step 7: Process Bank Transfer
```
1. Login as requester
2. Go to job detail page
3. PaymentForm shows bank transfer fields
4. Bank Reference field appears
5. Enter: "REF_BANK_20240211_001"
6. Click "Confirm Bank Transfer"
   ✅ Payment status changes to "Paid"
   ✅ Toast: "Payment processed successfully"
   ✅ Reference stored in database
```

#### ✅ Scenario 4 Expected Results
- ✅ Bank transfer processed
- ✅ Reference number stored
- ✅ Job eligible for completion

---

### **Scenario 5: Provider Blocked from New Applications**

#### Setup
```
1. Job A: Provider is assigned, status "onsite" (incomplete)
2. Job B: New job posted, provider wants to apply
```

#### Test
```
1. Login as provider
2. Go to Job B detail page
3. Try to click "Apply for Job"
4. Click "Apply for Job"
5. Submit application
   ❌ Error message: "INCOMPLETE_JOBS_EXIST"
   ❌ Toast: "Provider has incomplete jobs"
   ❌ Application not created
```

#### After Completing Job A
```
1. On Job A: Click "Mark as Complete"
   ✅ Job A status changes to "completed"
2. Go back to Job B
3. Apply for Job"
   ✅ Application succeeds now
   ✅ Application created
```

#### ✅ Scenario 5 Expected Results
- ✅ Provider blocked from new applications when incomplete jobs exist
- ✅ Can apply once current jobs completed
- ✅ Proper error messages shown

---

### **Scenario 6: Job Start Blocked Without Invoice**

#### Setup
```
1. Job created and provider assigned
2. NO invoice created yet
```

#### Test
```
1. Login as provider
2. Go to job detail page
3. In "Update Job Status" section
4. Try to click "En Route" button
   ❌ Button disabled OR error appears: "INVOICE_NOT_APPROVED"
   ❌ Toast: "Invoice must be approved before starting job"
   ❌ Status not changed
```

#### After Invoice Approved
```
1. Complete invoice workflow (approve)
2. Go back to "Update Job Status"
3. Click "En Route"
   ✅ Status changes to "enroute"
   ✅ Can proceed with job
```

#### ✅ Scenario 6 Expected Results
- ✅ Job start blocked without approved invoice
- ✅ Clear error message provided
- ✅ Works after invoice approved

---

### **Scenario 7: Job Completion Blocked Without Payment**

#### Setup
```
1. Job with approved invoice
2. NO payment made yet
```

#### Test
```
1. Provider status: "onsite"
2. In "Update Job Status" section
3. Try to click "Mark as Complete"
   ❌ Button disabled OR error: "PAYMENT_NOT_COMPLETED"
   ❌ Toast: "Payment must be received before completing job"
   ❌ Status not changed to "completed"
```

#### After Payment Made
```
1. Requester processes payment (any method)
2. Provider goes back to job
3. Click "Mark as Complete"
   ✅ Status changes to "completed"
   ✅ Can now rate provider
```

#### ✅ Scenario 7 Expected Results
- ✅ Job completion blocked without payment
- ✅ Clear error message
- ✅ Works after payment

---

### **Scenario 8: Email Notifications**

#### Emails to Check

**1. Invoice Sent Email** (Requester receives)
```
Subject: "New Invoice for House Painting"
From: noreply@jobtrade.ift.com
Content includes:
- Provider name
- Job title
- Invoice amount (P1500)
- Action: "Review Invoice" link
- Instructions to approve or decline
```

**2. Invoice Approved Email** (Provider receives)
```
Subject: "Invoice Approved!"
From: noreply@jobtrade.ift.com
Content includes:
- Requester confirmed approval
- Job title
- Invoice amount
- Action: "You can now start the job"
```

**3. Invoice Declined Email** (Provider receives)
```
Subject: "Invoice Changes Requested"
From: noreply@jobtrade.ift.com
Content includes:
- Requester declined
- Optional reason text
- Amount
- Action: "Revise and resubmit"
```

**4. Payment Received Email** (Provider receives)
```
Subject: "Payment Confirmation"
From: noreply@jobtrade.ift.com
Content includes:
- Payment confirmed
- Job title
- Amount (P1500)
- Payment method used
- Action: "Start the job"
```

#### ✅ Scenario 8 Expected Results
- ✅ All 4 emails sent at correct times
- ✅ Emails contain correct information
- ✅ Emails have proper branding
- ✅ Links/instructions clear

---

## 🔍 API Response Testing

### Invoice Endpoints

**Create Invoice**
```bash
POST /api/invoices
Headers: Authorization: Bearer {provider-token}
Body: {
  "jobId": "xyz",
  "amount": 1500,
  "currency": "BWP",
  "paymentMethod": "cash",
  "description": "Labour...",
  "notes": "Payment due..."
}

Expected Response (201):
{
  "id": "inv-123",
  "status": "draft",
  "amount": 1500,
  "createdAt": "2024-02-11..."
}
```

**Get Invoice Status**
```bash
GET /api/jobs/{jobId}/invoice-status
Expected Response (200):
{
  "hasInvoice": true,
  "status": "approved",
  "amount": 1500
}
```

**Approve Invoice**
```bash
POST /api/invoices/{invoiceId}/approve
Headers: Authorization: Bearer {requester-token}

Expected Response (200):
{
  "status": "approved",
  "approvedAt": "2024-02-11..."
}
```

### Payment Endpoints

**Process Payment (Cash)**
```bash
POST /api/payments/{invoiceId}/mark-paid
Headers: Authorization: Bearer {requester-token}
Body: {
  "notes": "Paid in person"
}

Expected Response (200):
{
  "id": "pay-123",
  "paymentStatus": "paid",
  "paidAt": "2024-02-11..."
}
```

**Check Payment Status**
```bash
GET /api/invoices/{invoiceId}/payment-status
Expected Response (200):
{
  "hasPayment": true,
  "status": "paid",
  "amount": 1500,
  "method": "cash"
}
```

---

## ✅ Frontend Component Testing

### InvoiceForm
- [ ] Form renders with correct fields
- [ ] Amount validation (no zero/negative)
- [ ] Payment method dropdown works
- [ ] Form submit creates invoice
- [ ] Success toast appears
- [ ] Form clears after submit
- [ ] Cannot create duplicate invoice

### InvoiceApproval  
- [ ] Shows invoice details
- [ ] Status badge displays correctly
- [ ] Approve button works
- [ ] Decline button opens dialog
- [ ] Decline reason optional
- [ ] Status updates after action
- [ ] Success toast appears

### PaymentForm
- [ ] Shows invoice amount
- [ ] Three payment methods displays correctly
- [ ] Cash: Confirm payment flow
- [ ] Card: Requires transaction ID
- [ ] Bank: Requires reference number
- [ ] Validation prevents submission without required fields
- [ ] Status updates after payment

### JobInvoicePaymentStatus
- [ ] Shows "No invoice" when none
- [ ] Shows draft with gray icon
- [ ] Shows sent with blue icon
- [ ] Shows approved with green icon
- [ ] Shows declined with red icon
- [ ] Shows paid with green icon
- [ ] Shows amounts correctly
- [ ] Displays payment method

### Job Detail Integration
- [ ] Status section appears when provider assigned
- [ ] provider sees InvoiceForm
- [ ] Requester sees InvoiceApproval and PaymentForm
- [ ] Components have correct spacing
- [ ] Mobile responsive on all devices

---

## 🐛 Error Testing

### Authorization Errors
- [ ] Non-provider cannot create invoice (401)
- [ ] Non-requester cannot approve (401)
- [ ] Non-requester cannot process payment (401)

### Validation Errors
- [ ] Negative amount rejected
- [ ] Zero amount rejected
- [ ] Card payment without transaction ID rejected
- [ ] Bank payment without reference rejected

### State Errors
- [ ] Cannot edit non-draft invoice (400)
- [ ] Cannot approve non-sent invoice (400)
- [ ] Cannot pay non-approved invoice (400)
- [ ] Cannot start without approved invoice (400)
- [ ] Cannot complete without payment (400)

### Not Found Errors
- [ ] Invalid invoice ID returns 404
- [ ] Invalid payment ID returns 404
- [ ] Invalid job ID returns 404

---

## 📊 Performance Testing

### Response Times
- [ ] Invoice creation: < 500ms
- [ ] Invoice approval: < 500ms
- [ ] Payment processing: < 500ms
- [ ] Status queries: < 100ms (from cache)

### Cache Testing
- [ ] First invoice query: ~50ms (cache miss)
- [ ] Second invoice query: < 10ms (cache hit)
- [ ] Cache invalidates on status change
- [ ] Payment cache expires correctly (5 min)
- [ ] Invoice cache expires correctly (30 min)

### Database Testing
- [ ] Proper indexes used (EXPLAIN ANALYZE)
- [ ] No N+1 queries
- [ ] Foreign keys maintained
- [ ] Referential integrity preserved

---

## ✨ Final Checklist

### Before Going to Production
- [ ] All scenarios tested and working
- [ ] All API endpoints responding correctly
- [ ] All frontend components rendering
- [ ] Emails sending with correct content
- [ ] Cache working properly
- [ ] Authorization enforced
- [ ] Error messages helpful
- [ ] Mobile responsive
- [ ] Performance acceptable
- [ ] Database indexes created
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Documentation complete

### After Deployment
- [ ] Monitor email delivery
- [ ] Check database for orphaned records
- [ ] Verify cache hit rates
- [ ] Monitor API response times
- [ ] Check error logs for issues
- [ ] Verify email templates render
- [ ] Test with real payment data
- [ ] Monitor user feedback

---

## 📞 Troubleshooting

**Invoice not showing after creation?**
- Check browser console for errors
- Verify backend is running
- Check network tab for API response
- Refresh page

**Cannot approve invoice?**
- Check user is logged in as requester
- Check invoice status is "sent"
- Verify authorization token valid
- Check email in user record matches requester

**Payment not processing?**
- Check invoice status is "approved"
- Verify transaction ID entered correctly (for card/bank)
- Check Redis connection
- Check email service configured

**Email not arriving?**
- Check RESEND_API_KEY configured
- Check email spelling
- Check spam folder
- Check email logs in Resend dashboard

---

**Complete test coverage ensures production-ready system!**
