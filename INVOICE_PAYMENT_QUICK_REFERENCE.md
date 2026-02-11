# 💼 Invoice & Payment System - Quick Reference

## 🎯 Quick Start

### **For Providers** (Create Invoice)
```typescript
// 1. Create invoice
POST /api/invoices
{
  "jobId": "uuid-here",
  "amount": 500,
  "currency": "BWP",
  "paymentMethod": "cash",  // or "bank_transfer", "card"
  "description": "Labour cost for house cleaning",
  "notes": "Half payment on start, half on completion"
}

// 2. Send to requester
POST /api/invoices/{invoiceId}/send
// Requester gets notification

// 3. Wait for approval
GET /api/invoices/job/{jobId}
// Check status: "sent", "approved", or "declined"

// 4. If declined, edit
PATCH /api/invoices/{invoiceId}
{
  "amount": 450,
  "description": "Updated description"
}

// 5. Receive payment notification
// Once requester pays, you get notification

// 6. Start job
PATCH /api/jobs/{jobId}
{
  "status": "enroute"  // ✅ Now allowed (was blocked without payment)
}

// 7. Complete job
PATCH /api/jobs/{jobId}
{
  "status": "completed"  // ✅ Now allowed (was blocked without payment)
}
```

### **For Requesters** (Approve & Pay)
```typescript
// 1. You receive notification about new invoice
// GET /api/invoices/job/{jobId}
{
  "id": "invoice-uuid",
  "status": "sent",
  "amount": 500,
  "paymentMethod": "cash"
}

// 2. Approve invoice
POST /api/invoices/{invoiceId}/approve

// 3. Make payment

// For CASH:
POST /api/payments/{invoiceId}/mark-paid
{ "notes": "Paid cash on hand" }

// For BANK TRANSFER:
POST /api/payments/{invoiceId}/process
{
  "paymentMethod": "bank_transfer",
  "transactionId": "TRANSFER_REF_12345"
}

// For CARD:
POST /api/payments/{invoiceId}/process
{
  "paymentMethod": "card",
  "transactionId": "CHARGE_ID_stripe_12345"
}

// 4. Provider gets payment notification
// Provider can now start job
```

---

## 📊 Invoice Status Lifecycle

```
┌──────────┐
│  DRAFT   │  ← Provider creates here
└────┬─────┘
     │ Provider: "Send invoice"
     ▼
┌──────────┐
│  SENT    │  ← Requester gets notified
└────┬─────┘
     │
     ├─→ Requester: "Approve" → APPROVED
     │
     └─→ Requester: "Decline" → DRAFT (goes back)
           Provider must edit & resend
```

## 💳 Payment Status Flow

```
Invoice: APPROVED
     ↓
Payment Record Created (status: UNPAID)
     ↓
     ├─→ Cash: Mark as paid manually
     ├─→ Bank: Provide transaction ref
     └─→ Card: Charge immediately
     ↓
Payment Status: PAID
Invoice Status: PAID
Job Can Start & Complete ✓
```

---

## 🔑 Key Constraints

### **Cannot Start Job If**:
```typescript
❌ invoice === null or undefined
❌ invoice.status !== 'approved'
❌ payment === null or undefined
❌ payment.paymentStatus !== 'paid'
```

### **Cannot Complete Job If**:
```typescript
❌ payment.paymentStatus !== 'paid'
```

### **Cannot Apply To New Job If**:
```typescript
❌ provider has any incomplete jobs
   (status not 'completed' or 'cancelled')
```

---

## 📡 API Endpoints Quick Map

### **Invoice Endpoints**
| Method | Endpoint | Who | Purpose |
|--------|----------|-----|---------|
| POST | `/api/invoices` | Provider | Create new invoice |
| GET | `/api/invoices/:id` | Both | View invoice details |
| GET | `/api/invoices/job/:jobId` | Both | Get job's invoice |
| PATCH | `/api/invoices/:id` | Provider | Edit draft invoice |
| POST | `/api/invoices/:id/send` | Provider | Send to requester |
| POST | `/api/invoices/:id/approve` | Requester | Approve invoice |
| POST | `/api/invoices/:id/decline` | Requester | Decline & request changes |
| DELETE | `/api/invoices/:id` | Provider | Cancel draft invoice |
| GET | `/api/jobs/:jobId/invoice-status` | Both | Quick status check |

### **Payment Endpoints**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/payments/:invoiceId/process` | Process payment (card/bank) |
| POST | `/api/payments/:invoiceId/mark-paid` | Mark cash as paid |
| GET | `/api/payments/:paymentId` | View payment details |
| GET | `/api/payments/invoice/:invoiceId` | Get invoice's payment |
| GET | `/api/invoices/:id/payment-status` | Quick payment status |

---

## 🔔 Email Notifications

### **Automatic Emails Sent**

| When | To | Subject | Purpose |
|------|----|---------|----|
| Invoice Sent | Requester | "New Invoice for {jobTitle}" | Review & approve |
| Invoice Approved | Provider | "Invoice Approved!" | Can start job |
| Invoice Declined | Provider | "Invoice Changes Requested" | Edit & resubmit |
| Payment Received | Provider | "Payment Confirmation" | Job can proceed |
| Payment Overdue | Requester | "Payment Reminder" | Chase payment |

---

## 💾 Cache Keys

```typescript
// After invoice status change:
INVALIDATE: invoice:{invoiceId}
INVALIDATE: invoiceByJob:{jobId}

// After payment:
INVALIDATE: payment:{paymentId}
INVALIDATE: paymentByInvoice:{invoiceId}

// Full clear (if needed):
INVALIDATE: job:{jobId}:invoices:payments
```

---

## ⚠️ Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| `INVOICE_NOT_APPROVED` | Job can't start | Requester must approve invoice first |
| `PAYMENT_NOT_COMPLETED` | Job can't complete | Need to process payment |
| `INCOMPLETE_JOBS_EXIST` | Can't apply to new job | Must complete current jobs first |
| `UNAUTHORIZED` | Not allowed to do this | Check role (provider/requester) |
| `INVALID_STATUS_TRANSITION` | Can't change status | Check invoice/payment status |

---

## 🧪 Test Invoice Flow

```bash
# 1. Create invoice
curl -X POST http://localhost:3000/api/invoices \
  -H "Authorization: Bearer provider-token" \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "job-123",
    "amount": 500,
    "currency": "BWP",
    "paymentMethod": "cash"
  }'
# Response: { id: "invoice-123", status: "draft" }

# 2. Send to requester
curl -X POST http://localhost:3000/api/invoices/invoice-123/send \
  -H "Authorization: Bearer provider-token"
# Response: { status: "sent" }

# 3. Requester approves
curl -X POST http://localhost:3000/api/invoices/invoice-123/approve \
  -H "Authorization: Bearer requester-token"
# Response: { status: "approved" }

# 4. Mark cash as paid
curl -X POST http://localhost:3000/api/payments/invoice-123/mark-paid \
  -H "Authorization: Bearer requester-token" \
  -H "Content-Type: application/json" \
  -d '{ "notes": "Paid in person" }'
# Response: { status: "paid" }

# 5. Now can start job
curl -X PATCH http://localhost:3000/api/jobs/job-123 \
  -H "Authorization: Bearer provider-token" \
  -H "Content-Type: application/json" \
  -d '{ "status": "enroute" }'
# Response: ✅ Success (would have failed before payment)
```

---

## 🔐 Authorization Checks

```typescript
// Provider can:
✅ Create invoices for their accepted jobs
✅ Edit invoices in "draft" status
✅ Send invoices to requester
✅ Cancel "draft" invoices
❌ Cannot approve/decline (requester only)
❌ Cannot delete sent invoices

// Requester can:
✅ View invoices sent to them
✅ Approve invoices
✅ Decline invoices & request changes
✅ Process payments
❌ Cannot edit invoices
❌ Cannot send invoices

// Admin can:
✅ View all invoices/payments
✅ Override approvals (if implemented)
✅ Create/adjust invoices manually
✅ Cancel paid invoices (refund)
```

---

## 🛠️ Common Scenarios

### **Scenario: Provider wants to edit amount before sending**
```typescript
PATCH /api/invoices/{invoiceId}
{
  "amount": 450  // Changed mind about price
}
// ✅ Works only if status === "draft"
```

### **Scenario: Requester declines invoice**
```typescript
POST /api/invoices/{invoiceId}/decline
{
  "reason": "Please reduce labour cost by 20%"  // Optional
}
// Invoice reverts to "draft", provider can edit
```

### **Scenario: Provider has incomplete job, tries to apply to new one**
```typescript
POST /api/jobs/{newJobId}/apply
// ❌ Error: INCOMPLETE_JOBS_EXIST
// Solution: Complete current job first
```

### **Scenario: Job blocked from starting without invoice**
```typescript
PATCH /api/jobs/{jobId}
{ "status": "enroute" }
// ❌ Error: INVOICE_NOT_APPROVED
// Solution: Requester must approve invoice first
```

### **Scenario: Job blocked from completion without payment**
```typescript
PATCH /api/jobs/{jobId}
{ "status": "completed" }
// ❌ Error: PAYMENT_NOT_COMPLETED
// Solution: Provider must process payment first
```

---

## 📈 Database Schema Quick Reference

### **invoices table**
```sql
id (uuid)                  -- Primary key
jobId (uuid) UNIQUE        -- Links to job
providerId (uuid)          -- Who created it
requesterId (uuid)         -- Who approves it
status (enum)              -- draft, sent, approved, declined, paid, cancelled
amount (decimal)           -- Invoice amount
currency (text)            -- "BWP"
paymentMethod (enum)       -- cash, bank_transfer, card
description (text)         -- Work description
notes (text)              -- Additional info
sentAt (timestamp)        -- When sent to requester
approvedAt (timestamp)    -- When approved
declinedAt (timestamp)    -- When declined
paidAt (timestamp)        -- When payment received
expiresAt (timestamp)     -- 7 days after sentAt
createdAt (timestamp)
updatedAt (timestamp)
```

### **payments table**
```sql
id (uuid)                  -- Primary key
invoiceId (uuid) UNIQUE    -- Links to invoice
jobId (uuid)               -- Links to job
amount (decimal)           -- Payment amount
paymentMethod (enum)       -- How paid
paymentStatus (enum)       -- unpaid, paid
transactionId (text)       -- Reference for verification
notes (text)              -- Additional info
paidAt (timestamp)        -- When marked paid
createdAt (timestamp)
updatedAt (timestamp)
```

---

## 🚀 Performance Tips

1. **Cache invoice data**: 30-minute TTL for stability
2. **Cache payment data**: 5-minute TTL for freshness
3. **Index on jobId**: All payment/invoice queries filter by jobId
4. **Batch operations**: Get job details with relations in one query
5. **Queue notifications**: Don't wait for email to send

---

## 📝 Notes

- Invoice amounts are stored as DECIMAL for accuracy
- All timestamps are UTC
- Soft deletes: Use status='cancelled' instead of deleting
- Provider can only create 1 active invoice per job
- Payment record auto-creates when invoice approved
- Both parties get email notifications for status changes
