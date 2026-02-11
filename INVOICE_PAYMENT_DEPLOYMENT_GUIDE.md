# 🚀 Invoice & Payment System - Deployment & Testing Guide

## 📦 Pre-Deployment Checklist

### **Environment Setup**
- [ ] Database migration file `0003_invoices_and_payments.sql` ready
- [ ] Environment variables configured:
  ```
  DATABASE_URL=postgresql://...
  REDIS_URL=redis://... (or Upstash URL)
  RESEND_API_KEY=re_... (for email notifications)
  NODE_ENV=production
  ```
- [ ] TypeScript compiles without errors
- [ ] All tests pass
- [ ] No breaking changes in existing code

### **Code Changes Reviewed**
- [ ] ✅ shared/schema.ts - Types & validation
- [ ] ✅ server/storage.ts - Data access layer
- [ ] ✅ server/routes/invoices.routes.ts - Invoice API
- [ ] ✅ server/routes/payments.routes.ts - Payment API
- [ ] ✅ server/routes/jobs.routes.ts - Job workflow enforcement
- [ ] ✅ server/services/cache.service.ts - Caching logic
- [ ] ✅ server/services/email-queue.service.ts - Email queuing
- [ ] ✅ server/services/email.service.ts - Email templates

---

## 🗄️ Database Migration

### **Step 1: Backup Current Database**
```bash
# Create backup before migration
pg_dump $DATABASE_URL > backup_before_invoices_$(date +%Y%m%d_%H%M%S).sql
```

### **Step 2: Run Migration**

**Option A: Using Drizzle CLI**
```bash
# In project root
npm run db:migrate
# or
npx drizzle-kit migrate
```

**Option B: Manual SQL Execution**
```bash
# Connect to your database
psql $DATABASE_URL < drizzle/0003_invoices_and_payments.sql
```

**Option C: Using GUI (pgAdmin/DBeaver)**
1. Open query editor
2. Copy contents of `drizzle/0003_invoices_and_payments.sql`
3. Execute the SQL

### **Step 3: Verify Migration**
```sql
-- Check if tables exist
\dt invoices payments

-- Check table structure
\d invoices
\d payments

-- Verify indexes
SELECT * FROM pg_indexes 
WHERE tablename IN ('invoices', 'payments');

-- Verify enum types created
SELECT typname FROM pg_type 
WHERE typname IN ('payment_method', 'invoice_status', 'payment_status');
```

### **Step 4: Verify Data Integrity**
```sql
-- Check for any existing invoices (should be 0 initially)
SELECT COUNT(*) FROM invoices;

-- Check for any existing payments (should be 0 initially)
SELECT COUNT(*) FROM payments;

-- Check jobs were updated correctly
SELECT id, "invoiceId", "invoiceStatus", "paymentStatus" 
FROM jobs 
LIMIT 5;

-- Verify constraints
SELECT constraint_name, table_name 
FROM information_schema.table_constraints 
WHERE constraint_type = 'UNIQUE' 
AND table_name IN ('invoices', 'payments');
```

---

## 🧪 Testing Strategy

### **Unit Tests** (If applicable)

```typescript
// Test invoice creation
describe('createInvoice', () => {
  it('should create invoice with draft status', async () => {
    const invoice = await storage.createInvoice({
      jobId: 'job-1',
      providerId: 'provider-1',
      requesterId: 'requester-1',
      amount: 500,
      paymentMethod: 'cash',
      currency: 'BWP'
    });
    
    expect(invoice.status).toBe('draft');
    expect(invoice.invoiceId).toBeDefined();
  });
});

// Test payment creation
describe('createPayment', () => {
  it('should create payment record when invoice approved', async () => {
    const payment = await storage.createPayment({
      invoiceId: 'invoice-1',
      jobId: 'job-1',
      amount: 500,
      paymentMethod: 'cash'
    });
    
    expect(payment.paymentStatus).toBe('unpaid');
  });
});
```

### **Integration Tests - Invoice Workflow**

**Test Case 1: Complete Invoice Flow**
```bash
# 1. Test: Create invoice
POST /api/invoices
Headers: Authorization: Bearer {provider-token}
Body: {
  "jobId": "test-job-1",
  "amount": 500,
  "currency": "BWP",
  "paymentMethod": "cash",
  "description": "Test work"
}
Expected: 201, invoice with status="draft"

# 2. Test: Get invoice
GET /api/invoices/{invoiceId}
Expected: 200, all invoice details

# 3. Test: Send invoice
POST /api/invoices/{invoiceId}/send
Headers: Authorization: Bearer {provider-token}
Expected: 200, status="sent"

# 4. Test: Requester receives notification
Check notification/email queue
Expected: Email sent to requester

# 5. Test: Approve invoice
POST /api/invoices/{invoiceId}/approve
Headers: Authorization: Bearer {requester-token}
Expected: 200, status="approved"

# 6. Test: Provider receives approval notification
Check notification/email queue
Expected: Email sent to provider

# 7. Test: Get payment status
GET /api/invoices/{invoiceId}/payment-status
Expected: 200, payment record created with status="unpaid"
```

**Test Case 2: Decline & Resubmit**
```bash
# 1. Test: Create invoice
...same as above...

# 2. Test: Send invoice
...same as above...

# 3. Test: Decline invoice
POST /api/invoices/{invoiceId}/decline
Headers: Authorization: Bearer {requester-token}
Body: { "reason": "Please reduce cost" }
Expected: 200, status="draft"

# 4. Test: Edit invoice amount
PATCH /api/invoices/{invoiceId}
Headers: Authorization: Bearer {provider-token}
Body: { "amount": 400 }
Expected: 200, new amount reflected

# 5. Test: Resend invoice
POST /api/invoices/{invoiceId}/send
Expected: 200, status="sent" (sentAt timestamp updated)
```

### **Integration Tests - Payment Processing**

**Test Case 3: Cash Payment**
```bash
# 1. Setup: Create and approve invoice
...complete invoice workflow above...

# 2. Test: Mark cash as paid
POST /api/payments/{invoiceId}/mark-paid
Headers: Authorization: Bearer {requester-token}
Body: { "notes": "Paid in cash" }
Expected: 200, paymentStatus="paid"

# 3. Test: Invoice status updated
GET /api/invoices/{invoiceId}
Expected: status="paid"

# 4. Test: Job paymentStatus updated
GET /api/jobs/{jobId}
Expected: paymentStatus="paid"

# 5. Test: Provider receives payment notification
Check email queue
Expected: Email with payment confirmation
```

**Test Case 4: Bank Transfer Payment**
```bash
# After invoice approved:

POST /api/payments/{invoiceId}/process
Headers: Authorization: Bearer {requester-token}
Body: {
  "paymentMethod": "bank_transfer",
  "transactionId": "REF_BANK_12345"
}
Expected: 200, paymentStatus="paid", transactionId stored

# Verify in database
SELECT transactionId FROM payments WHERE invoiceId='{invoiceId}'
Expected: "REF_BANK_12345"
```

**Test Case 5: Card Payment**
```bash
# After invoice approved:

POST /api/payments/{invoiceId}/process
Headers: Authorization: Bearer {requester-token}
Body: {
  "paymentMethod": "card",
  "transactionId": "CHARGE_STRIPE_12345"
}
Expected: 200, paymentStatus="paid", transactionId stored
```

### **Integration Tests - Job Workflow**

**Test Case 6: Job Start Blocked Without Invoce**
```bash
# 1. Setup: Create job, provider accepted, NO invoice

# 2. Test: Try to start job
PATCH /api/jobs/{jobId}
Headers: Authorization: Bearer {provider-token}
Body: { "status": "enroute" }
Expected: 400, error code: INVOICE_NOT_APPROVED

# 3. Setup: Create and approve invoice

# 4. Test: Now try to start job
PATCH /api/jobs/{jobId}
Headers: Authorization: Bearer {provider-token}
Body: { "status": "enroute" }
Expected: 200 (OR still blocked if payment not done)
```

**Test Case 7: Job Completion Blocked Without Payment**
```bash
# 1. Setup: Invoice approved, payment NOT made

# 2. Test: Try to complete job
PATCH /api/jobs/{jobId}
Headers: Authorization: Bearer {provider-token}
Body: { "status": "completed" }
Expected: 400, error code: PAYMENT_NOT_COMPLETED

# 3. Setup: Process payment

# 4. Test: Now try to complete job
PATCH /api/jobs/{jobId}
Headers: Authorization: Bearer {provider-token}
Body: { "status": "completed" }
Expected: 200, status="completed"
```

**Test Case 8: Provider Job Application Blocked**
```bash
# 1. Setup: Provider has active job with status="onsite"

# 2. Test: Try to apply for new job
POST /api/jobs/{newJobId}/apply
Headers: Authorization: Bearer {provider-token}
Expected: 400, error code: INCOMPLETE_JOBS_EXIST

# 3. Setup: Complete the active job (status="completed")

# 4. Test: Now can apply for new job
POST /api/jobs/{newJobId}/apply
Expected: 200, application created
```

### **Stress Tests**

**Test Case 9: Multiple Invoices Per Provider**
```bash
# Should only allow 1 active (non-declined) invoice per job
POST /api/invoices
Body: { "jobId": "job-1", amount: 500 }
Expected: 201

POST /api/invoices
Body: { "jobId": "job-1", amount: 600 }
Expected: 400, error: "Already have active invoice for this job"
```

**Test Case 10: Concurrent Payments**
```bash
# Simulate two payment requests simultaneously
# Should handle race condition gracefully
Thread 1: POST /api/payments/{invoiceId}/process
Thread 2: POST /api/payments/{invoiceId}/process
Expected: 1 succeeds, 1 fails with "Already paid" or similar
```

### **Authorization Tests**

**Test Case 11: Authorization Checks**
```bash
# Provider trying to approve invoice (not allowed)
POST /api/invoices/{invoiceId}/approve
Headers: Authorization: Bearer {provider-token}
Expected: 401 or 403, error: UNAUTHORIZED

# Requester trying to send invoice (not allowed)
POST /api/invoices/{invoiceId}/send
Headers: Authorization: Bearer {requester-token}
Expected: 401 or 403, error: UNAUTHORIZED

# Provider trying to process payment (not allowed)
POST /api/payments/{invoiceId}/process
Headers: Authorization: Bearer {provider-token}
Expected: 401 or 403, error: UNAUTHORIZED
```

### **Edge Cases**

**Test Case 12: Invoice Expiration**
```bash
# Create invoice, don't approve for 7 days
# After 7 days, should not be approvable (optional)
GET /api/invoices/{invoiceId}
Expected: status="expired" or expiresAt < now
```

**Test Case 13: Decline After Payment Started**
```bash
# Invoice approved -> Payment record created -> Try to decline
POST /api/invoices/{invoiceId}/decline
Expected: Error - "Cannot decline paid/processing invoice"
OR
Expected: 200 - Allow decline but mark as dispute
```

**Test Case 14: Edit Approved Invoice**
```bash
# Approved invoice is read-only
PATCH /api/invoices/{invoiceId}
Body: { "amount": 600 }
Expected: 400, error: "Cannot edit approved invoice"
```

---

## 📊 Performance Testing

### **Load Test: Invoice Creation**
```bash
# Test with Apache Bench or similar
ab -n 100 -c 10 -p invoice.json http://localhost:3000/api/invoices

Expected:
- Requests/sec: > 50
- Mean latency: < 200ms
- Error rate: 0%
```

### **Load Test: Invoice Queries**
```bash
# Test getting invoice by jobId
ab -n 1000 -c 50 http://localhost:3000/api/invoices/job/{jobId}

Expected (with Redis cache):
- First request: ~50ms (cache miss)
- Subsequent: < 10ms (cache hit)
- Cache hit rate: > 95%
```

### **Database Performance**
```sql
-- Check indexes are being used
EXPLAIN ANALYZE
SELECT * FROM invoices WHERE "jobId" = 'job-1';

-- Should show "Index Scan" not "Seq Scan"

-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE query LIKE '%invoices%' OR query LIKE '%payments%'
ORDER BY mean_exec_time DESC;

-- All queries should complete in < 50ms
```

---

## 🔄 Rollback Plan

If major issues encountered:

### **Option 1: Database Rollback**
```bash
# Restore from backup
psql $DATABASE_URL < backup_before_invoices_YYYYMMDD_HHMMSS.sql

# OR manually run reverse migration
psql $DATABASE_URL << SQL
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS invoices;
DROP TYPE IF EXISTS payment_status;
DROP TYPE IF EXISTS invoice_status;
DROP TYPE IF EXISTS payment_method;
ALTER TABLE jobs DROP COLUMN IF EXISTS "invoiceId";
ALTER TABLE jobs DROP COLUMN IF EXISTS "invoiceStatus";
ALTER TABLE jobs DROP COLUMN IF EXISTS "paymentStatus";
SQL
```

### **Option 2: Code Rollback**
```bash
# Revert the code changes
git revert {commit-hash}
npm install
npm run build
npm run start
```

### **Option 3: Disable Routes (Quick Fix)**
```typescript
// In server/routes.ts, temporarily comment:
// registerInvoiceRoutes(app);
// registerPaymentRoutes(app);

// This allows the app to run without the new features
// while you investigate issues
```

---

## 📋 Post-Deployment Validation

### **Immediate Checks (First 1 hour)**
- [ ] Application starts without errors
- [ ] Database connection successful
- [ ] Redis/cache connection successful
- [ ] Email service initialized
- [ ] All endpoints accessible (return 401 if not authenticated, not 500)

```bash
# Quick health check
curl http://localhost:3000/api/invoices -H "Authorization: Bearer invalid"
# Should return 401, not 500 or connection error
```

### **Functional Checks (First 24 hours)**
- [ ] Can create invoice
- [ ] Can send invoice
- [ ] Can approve invoice
- [ ] Can process payment
- [ ] Can complete job after payment
- [ ] Provider blocked from new jobs
- [ ] Notifications/emails sent
- [ ] Cache is working

### **Data Integrity Checks**
```sql
-- Check for orphaned records
SELECT COUNT(*) FROM invoices WHERE "jobId" NOT IN (SELECT id FROM jobs);
-- Should be 0

-- Check for orphaned payments
SELECT COUNT(*) FROM payments WHERE "invoiceId" NOT IN (SELECT id FROM invoices);
-- Should be 0

-- Check status consistency (approved invoices should have payments)
SELECT i.id, p.id FROM invoices i
LEFT JOIN payments p ON i.id = p."invoiceId"
WHERE i.status = 'approved' AND p.id IS NULL;
-- Should be few or 0 (only recently approved)
```

### **Performance Baselines**
```sql
-- Log slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE query LIKE '%invoices%' OR query LIKE '%payments%'
ORDER BY mean_exec_time DESC
LIMIT 10;

-- All should be < 50ms mean time
```

---

## 🐛 Troubleshooting

### **Issue: "relation "invoices" does not exist"**
- **Cause**: Migration not run
- **Solution**: Run Drizzle migration or manual SQL

### **Issue: Enum type errors**
- **Cause**: Enum types not created
- **Solution**: Check if SQL migration completed successfully

### **Issue: Emails not sending**
- **Cause**: RESEND_API_KEY not configured or invalid
- **Solution**: Check `.env` file, verify API key in Resend dashboard

### **Issue: Cache not working**
- **Cause**: Redis connection failed
- **Solution**: Check REDIS_URL, verify Redis running

### **Issue: Job workflow blocking unexpectedly**
- **Cause**: Database data inconsistent
- **Solution**: Check job, invoice, and payment records are linked correctly

### **Issue: Authorization denied for valid user**
- **Cause**: User role mismatch in token
- **Solution**: Verify JWT token contains correct userId and role

---

## 📈 Monitoring Setup

### **Key Metrics to Monitor**

1. **Invoice Creation Rate**
   - Alert if drops by > 50% (indicates bug)
   - Alert if exceeds 10/minute (spam check)

2. **Payment Success Rate**
   - Should be > 95%
   - Investigate failures < 90%

3. **Email Queue**
   - Monitor queue length (should be < 100)
   - Monitor processing time (should be < 10 seconds)

4. **Database Performance**
   - Monitor query latency (should be < 100ms)
   - Monitor connection pool (should have available connections)
   - Monitor disk space (migration increases ~50MB)

5. **Cache Hit Rate**
   - Should be > 80% after warm-up period
   - Low hit rate indicates cache invalidation issues

### **Logging Points**
- Invoice creation with amount
- Invoice approval with userId
- Payment processing with method
- Job start/completion with invoice/payment status
- Authorization failures with reason
- Cache hits/misses
- Email queue additions/completions

---

## ✅ Final Verification

Once deployment complete, verify with checklist:

```
Deployment Verification Checklist
==================================

□ Database migration ran successfully
□ All tables created with correct schema
□ No application startup errors
□ Invoice API endpoints responding
□ Payment API endpoints responding
□ Job workflow enforcing invoice requirement
□ Job workflow enforcing payment requirement
□ Provider job blocking working
□ Notifications/emails being sent
□ Cache working (redis connected)
□ Authorization checks working
□ No breaking changes to existing features
□ Database backups created
□ Monitoring/alerts configured
□ Documentation updated
□ Team notified of changes

Total: ___/13 items completed
```

---

## 📞 Support & Escalation

If critical issues:

1. **Immediate action**: Revert code changes
2. **Communicate**: Notify team of rollback
3. **Investigate**: Check error logs and database
4. **Plan**: Determine if database rollback needed
5. **Test fixes**: Verify in staging first
6. **Redeploy**: Once fixes verified

Contact: [Backend Lead] if urgent
