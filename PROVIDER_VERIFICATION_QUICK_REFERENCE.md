# Service Provider Category Verification - Quick Reference

## 🚀 Quick Start

### For Providers
1. **Sign Up** → Select service categories
2. **Verify** → Upload verification documents for each category
3. **Wait** → Admin reviews your documents (24-48 hours typical)
4. **Access** → Once approved, browse and apply for jobs in that category
5. **Expand** → Request additional categories anytime

### For Admins
1. **Dashboard** → Go to `/api/admin/provider-category-verifications`
2. **Review** → Check pending verifications with documents
3. **Decide** → Approve or reject with reason
4. **Notify** → Provider gets instant notification
5. **Track** → All decisions logged for audit

---

## 🔗 Key API Endpoints

### Provider Verification Endpoints
```
GET  /api/provider/category-verifications
     Get all your verification statuses

POST /api/provider/category-verifications/:categoryId/submit-documents
     Submit verification documents

GET  /api/provider/approved-categories
     Get your approved categories (used for job filtering)
```

### Admin Verification Endpoints
```
GET  /api/admin/provider-category-verifications
     List all pending verifications

PATCH /api/admin/provider-category-verifications/:providerId/:categoryId
      Approve or reject verification
      Body: { status: 'approved'|'rejected', rejectionReason?: 'reason' }
```

### Job Endpoints (Modified)
```
GET  /api/jobs
     Now ONLY shows jobs matching approved categories

POST /api/jobs/:id/apply
     Now VALIDATES provider has approved category for job
```

---

## 📊 Verification Status Values

| Status | Meaning | Action |
|--------|---------|--------|
| `pending` | Waiting for admin review | Provider awaits decision |
| `approved` | Category verified | Provider can see/accept jobs |
| `rejected` | Did not meet requirements | Provider can reapply |

---

## 🔐 Critical Security Rules

1. **Providers can ONLY see jobs in approved categories**
2. **Providers can ONLY apply for jobs in approved categories**
3. **Admin approval is required for each category**
4. **All decisions are permanently logged**
5. **Rejection reasons are stored and visible to provider**

---

## 📱 Verification Document Types

Providers should upload:
- Professional certifications
- Trade licenses
- Course completion letters
- Accreditation documents
- Proof of experience
- Portfolio examples

---

## 🔄 Typical Timeline

| Phase | Time | Actor | Action |
|-------|------|-------|--------|
| 1 | Signup | Provider | Select categories |
| 2 | 1-2 days | Provider | Upload documents |
| 3 | 24-48 hrs | Admin | Review & approve/reject |
| 4 | Instant | System | Notify provider |
| 5 | Immediate | Provider | Can access jobs (if approved) |

---

## ✅ What Providers See After Approval

After a provider's category is **approved**:
- ✅ Can see jobs in that category
- ✅ Can apply for those jobs
- ✅ Can be selected for those jobs
- ✅ Can add more categories anytime

If a category is **rejected**:
- ❌ Cannot see jobs in that category
- ❌ Cannot apply for those jobs
- ✅ Can upload new documents and reapply

---

## 📊 Database Tables

### `provider_category_verifications`
```
id              UUID (primary key)
provider_id     UUID (→ users)
category_id     INT (→ categories)
status          ENUM: pending|approved|rejected
documents       JSONB: [{name, url}, ...]
rejection_reason TEXT (nullable)
reviewed_by     UUID (→ users, nullable)
reviewed_at     TIMESTAMP (nullable)
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

---

## 🎯 Testing Tips

**Test Provider Flow:**
1. Create new provider account
2. Select 2-3 categories at signup
3. Check verifications are `pending`
4. Upload mock documents
5. As admin, approve 1 category, reject 1
6. As provider, verify you see jobs only in approved category
7. Try to apply for rejected category job → should fail

**Test Admin Flow:**
1. As admin, get pending verifications
2. Verify document links are accessible
3. Approve/reject with reasons
4. Check provider gets notification
5. Verify provider's job list updates

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Provider sees no jobs | Check `getApprovedCategoriesForProvider()` returns categories |
| Cannot upload documents | Ensure document URLs are valid and accessible |
| Admin can't see pending | Check database has pending verifications |
| Job filtering not working | Verify provider role matches and approved categories populated |
| Notifications not sent | Check notification service integration |

---

## 📝 Key Files

| File | Purpose |
|------|---------|
| `shared/schema.ts` | Data models & validation schemas |
| `server/storage.ts` | Database access layer |
| `server/services/verification.service.ts` | Business logic |
| `server/routes/provider.routes.ts` | Provider endpoints |
| `server/routes/admin.routes.ts` | Admin endpoints |
| `server/routes/jobs.routes.ts` | Job access control |
| `drizzle/0002_provider_category_verification.sql` | Database migration |

---

## 🚀 Deployment

```bash
# 1. Run migration
npm run db:push

# 2. Check types
npm run check

# 3. Build
npm run build

# 4. Deploy code

# 5. Test endpoints
curl http://localhost:3000/api/admin/provider-category-verifications
```

---

## 📞 Common Questions

**Q: Can a provider have multiple approved categories?**
A: Yes, each category is verified independently. A provider can have some approved, some pending, some rejected.

**Q: What happens if admin rejects a category?**
A: Provider gets rejection reason. They can upload new documents and request review again.

**Q: Can providers add categories after signup?**
A: Yes, via POST `/api/categories/request-addition`. Same verification flow applies.

**Q: How long is verification valid?**
A: Currently indefinite. Future enhancement could add expiration dates.

**Q: Can admin change a decision later?**
A: Currently no, but this is an easy enhancement if needed.

**Q: What if provider has no approved categories?**
A: They see no jobs and get helpful message "Verification pending - check back when approved".

---

## 🎓 Learning Resources

- Full architecture: `PROVIDER_CATEGORY_VERIFICATION_SYSTEM.md`
- Implementation details: `PROVIDER_VERIFICATION_IMPLEMENTATION_COMPLETE.md`
- API documentation: Check each route file for endpoint details
- Database design: See `shared/schema.ts` for table definitions

---

## ✨ Features at a Glance

✅ Strict category-based job access control
✅ Multi-step verification process
✅ Admin review dashboard
✅ Real-time notifications
✅ Document management
✅ Audit trail of all decisions
✅ Rejection reasons
✅ Category expansion after signup
✅ Security enforced at multiple levels
✅ Production-ready code

---

**System Status: READY FOR PRODUCTION** ✅
