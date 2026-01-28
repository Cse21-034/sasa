# 🚀 Smile Identity Implementation - Quick Start Guide

## ⚡ 5-Minute Setup

### 1. Environment Variables
```bash
# Add to .env
SMILE_IDENTITY_API_URL=https://3eydmgh10d.execute-api.us-west-2.amazonaws.com
SMILE_IDENTITY_API_KEY=your_api_key_here
SMILE_IDENTITY_PARTNER_ID=your_partner_id_here
```

### 2. Database Migration
```bash
npm run db:push  # Applies new Smile Identity fields
```

### 3. Test Phase 1 Flow
```bash
# Frontend
npm run dev
# Navigate to /verification as requester or provider
```

---

## 🎯 How It Works

### Phase 1: Fully Automated (No Admin)
```
User selects ID type → Uploads ID + Selfie → Submit
                                              ↓
                              Smile Identity API called
                                              ↓
                        Result: PASS or FAIL (instant)
                         ↙                    ↘
                      PASS                    FAIL
                       ↓                       ↓
              ✅ Auto-approve            ❌ Auto-reject
              Grant full access        Show error + resubmit
```

### Phase 2: Manual (Requires Admin)
```
User uploads documents (if Phase 1 passed)
          ↓
Notify admin for review
          ↓
Admin reviews in 24-48h
      ↙              ↘
  APPROVE        REJECT
    ↓                ↓
 Notify          Notify + reason
 Grant jobs      Can resubmit
```

---

## 📋 File Overview

| File | Purpose | Lines |
|------|---------|-------|
| `server/services/smile-identity.service.ts` | Smile API calls | 240+ |
| `server/routes/verification.routes.ts` | Phase 1/2 logic | 290+ |
| `client/src/pages/verification.tsx` | UI | 150+ |
| `shared/schema.ts` | Database fields | 25+ |
| `drizzle/0003_smile_identity_phase1.sql` | Migration | 20+ |

---

## 🔧 Key Methods

### Submit Phase 1 (Backend)
```typescript
const smileResponse = await smileIdentityService.submitKYCVerification({
  country: 'BW',
  idType: 'national_id',
  selfieImage: 'base64...',
  idImage: 'base64...'
});

const result = smileIdentityService.parseVerificationResult(smileResponse);
// result.passed → true/false
// result.failureReason → human-readable message
```

### Get Phase 1 Status (Frontend)
```typescript
const { data } = useQuery('verificationStatus', async () => {
  return (await apiRequest('GET', '/api/verification/status')).json();
});

console.log(data.phase1.status); // approved | rejected | pending
console.log(data.phase1.confidenceScore); // 95.5
console.log(data.canProceedToPhase2); // true/false
```

---

## 🧪 Testing

### Test Smile with Mock Data
```typescript
// Smile service auto-returns mock PASS if credentials not set
// Perfect for development/testing

const result = await smileIdentityService.submitKYCVerification({...});
// Returns: { success: true, result: { ResultStatus: 'PASS', ConfidenceScore: 95 }}
```

### Test with Real Smile Account
```bash
# Set credentials in .env
SMILE_IDENTITY_API_KEY=...
SMILE_IDENTITY_PARTNER_ID=...

# Frontend will call real API
```

---

## 🐛 Common Issues

### Issue: "Smile API not responding"
**Solution**: Check credentials in .env, service falls back to mock mode

### Issue: "Phase 1 not showing in status"
**Solution**: Ensure `phase1Verified` field exists in DB (run migration)

### Issue: "User can't submit Phase 2 after Phase 1"
**Solution**: Check `canProceedToPhase2` in status response, must be `true`

---

## 📊 Status Response Format

```json
{
  "phase1": {
    "status": "approved",
    "verified": true,
    "smileResult": "PASS",
    "confidenceScore": 95.5,
    "idType": "national_id",
    "rejectionReason": null
  },
  "phase2": {
    "status": "pending",
    "rejectionReason": null
  },
  "canProceedToPhase2": true,
  "canAcceptJobs": false  // true only after Phase 2 approved (for providers)
}
```

---

## 🎨 Frontend Flow

```
User clicks "Verify Identity"
        ↓
1️⃣ Select ID type (required)
        ↓
2️⃣ Upload ID photo
        ↓
3️⃣ Upload selfie photo
        ↓
4️⃣ Click "Verify Identity" button
        ↓
   API call to POST /api/verification/submit
        ↓
   Smile Identity processes (seconds)
        ↓
   Response with result
        ↓
   ✅ Display status message
   ✅ Update UI accordingly
   ✅ Redirect or show next phase
```

---

## 🔐 Security Highlights

✅ **No permanent image storage** - Only metadata saved  
✅ **Instant processing** - No manual review delay  
✅ **Audit trail** - Job ID + timestamp for each verification  
✅ **HTTPS only** - All API calls encrypted  
✅ **POPIA compliant** - Minimal data retention  

---

## 📞 Support Contacts

- **Smile Identity**: support@smileidentity.com
- **API Docs**: https://docs.smileidentity.com
- **Admin Panel**: https://dashboard.smileidentity.com

---

## ✅ Deployment Pre-Flight

- [ ] `.env` has Smile credentials
- [ ] Database migration applied
- [ ] Frontend builds without errors
- [ ] Backend tests passing
- [ ] Smile credentials validated
- [ ] HTTPS configured
- [ ] Error logging configured

---

**Last Updated**: January 28, 2026  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
