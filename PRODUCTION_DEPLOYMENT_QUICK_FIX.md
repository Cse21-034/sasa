# Production Deployment Quick Fix Guide

## 🔴 CRITICAL FIXES (Do These First)

### Fix #1: Update JWT Secret Environment Variable

**Current Issue:** Using default secret in production  
**Fix:** Add to your production environment

**On Render Dashboard:**
1. Go to your service → Environment
2. Add new variable:
```
JWT_SECRET=your_very_long_random_secret_key_minimum_32_characters_for_production_use
```

**Generate a strong secret:**
```bash
# On your local machine
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### Fix #2: Update CORS Configuration for Production

**File:** `server/index.ts`

**Before (Current):**
```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5000',
    'https://sasa-indol.vercel.app'
  ],
  credentials: true
}));
```

**After (Production-Ready):**
```typescript
const CORS_ORIGINS = process.env.NODE_ENV === 'production'
  ? [process.env.VERCEL_URL || 'https://your-production-domain.com']
  : [
      'http://localhost:5173',
      'http://localhost:5000'
    ];

app.use(cors({
  origin: CORS_ORIGINS,
  credentials: true
}));
```

**On Render Dashboard:**
Add environment variable:
```
VERCEL_URL=https://your-actual-vercel-domain.com
```

---

### Fix #3: Add Environment Variable Validation

**Create new file:** `server/config.ts`

```typescript
export function validateProductionEnvironment() {
  const requiredVars = ['DATABASE_URL', 'JWT_SECRET'];
  
  if (process.env.NODE_ENV === 'production') {
    const missing = requiredVars.filter(v => !process.env[v]);
    
    if (missing.length > 0) {
      throw new Error(
        `❌ Missing required production environment variables: ${missing.join(', ')}`
      );
    }
  }
}
```

**Update `server/index.ts`:**
```typescript
import { validateProductionEnvironment } from './config';

(async () => {
  validateProductionEnvironment();
  
  const server = await registerRoutes(app);
  // ... rest of code
})();
```

---

## 🟡 RECOMMENDED (Before Production)

### Add Rate Limiting

**Install:**
```bash
npm install express-rate-limit
```

**File:** `server/index.ts`

```typescript
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
});

app.use('/api/', apiLimiter);
```

---

### Add Security Headers

**Install:**
```bash
npm install helmet
```

**File:** `server/index.ts`

```typescript
import helmet from 'helmet';

app.use(helmet());
```

---

## 📋 ENVIRONMENT VARIABLES CHECKLIST

### On Render (Backend)

```
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host/db
JWT_SECRET=your_strong_random_secret_here
PORT=5000
```

### On Vercel (Frontend)

```
VITE_API_URL=https://your-render-backend-url.com
```

---

## ✅ Pre-Deployment Verification

Run these commands locally:

```bash
# 1. Type check
npm run check

# 2. Build
npm run build

# 3. Verify build output
ls -la dist/

# 4. Check for errors
npm run check 2>&1 | grep -i error
```

---

## 🚀 Deployment Order

1. **Update environment variables** on Render/Vercel first
2. **Fix code** (apply the critical fixes above)
3. **Push to GitHub:**
```bash
git add .
git commit -m "Production security fixes: JWT secret, CORS, env validation"
git push origin main
```
4. **Render will auto-deploy** (monitor the deployment)
5. **Vercel will auto-deploy** (or trigger manually)
6. **Test in production**

---

## 🧪 Production Testing

After deployment, verify:

```bash
# 1. Check health
curl https://your-render-backend.com/api/health

# 2. Test login
curl -X POST https://your-render-backend.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# 3. Check CORS headers
curl -i https://your-render-backend.com/api/auth/login

# 4. Test frontend
Visit https://your-vercel-domain.com in browser
Login and verify all 3 recently fixed features:
- Supplier profile updates
- Promotions display
- Admin reports
```

---

## ⚠️ DO NOT FORGET

- [ ] Generate strong `JWT_SECRET`
- [ ] Update `VERCEL_URL` in Render config
- [ ] Set `NODE_ENV=production`
- [ ] Test after deployment
- [ ] Monitor logs for errors

