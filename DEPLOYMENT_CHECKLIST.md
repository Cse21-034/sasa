# 🚀 Production Deployment Checklist

## Before You Deploy

### ✅ Code Quality (5 minutes)
- [ ] Run `npm run check` - No TypeScript errors
- [ ] Run `npm run build` - Build completes successfully
- [ ] No console errors in browser (F12)
- [ ] All recent fixes verified working locally

### 🔐 Security Fixes (20 minutes)

#### JWT Secret
- [ ] Generate new secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Copy the output
- [ ] Save safely (don't commit to git)
- [ ] Will add to Render environment variables

#### CORS Configuration
- [ ] Know your Vercel frontend URL (e.g., `jobtradesasa.vercel.app`)
- [ ] Update `server/index.ts` line ~29-33 with your domain
- [ ] Remove `localhost` URLs from production config
- [ ] File: `server/index.ts` - Update this section:

```typescript
// CHANGE FROM:
'https://sasa-indol.vercel.app' // Change this

// TO:
'https://your-actual-vercel-domain.vercel.app' // Your domain
```

#### Environment Validation
- [ ] Create `server/config.ts` (see PRODUCTION_DEPLOYMENT_QUICK_FIX.md)
- [ ] Update `server/index.ts` to call `validateProductionEnvironment()`

### 📦 Deployment Configuration (5 minutes)

#### Render Backend Setup
Go to https://dashboard.render.com

New PostgreSQL Database:
- [ ] Create database (name: `jobtradesasa-db`)
- [ ] Save connection string to `DATABASE_URL`

New Web Service:
- [ ] Connect GitHub repository
- [ ] Set Build Command: `npm run build`
- [ ] Set Start Command: `node dist/index.js`

Environment Variables (Add these):
```
NODE_ENV = production
DATABASE_URL = [Paste PostgreSQL connection string]
JWT_SECRET = [Paste generated secret from above]
PORT = 5000
```

#### Vercel Frontend Setup
Go to https://vercel.com

Import Repository:
- [ ] Connect GitHub repo
- [ ] Framework: Other (Vite)
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist/public`

Environment Variables:
```
VITE_API_URL = [Your Render backend URL, e.g., https://jobtradesasa-api.onrender.com]
```

### 🧪 Pre-Deployment Tests (15 minutes)

**Locally (before pushing):**
- [ ] `npm run dev` starts without errors
- [ ] Can login successfully
- [ ] Can browse jobs
- [ ] Can view supplier details
- [ ] Can view promotions (FIX #2)
- [ ] Profile update works (FIX #1)
- [ ] Admin reports display (FIX #3)
- [ ] Job details page loads (FIX #4 - formatPula)

**Database:**
- [ ] Can connect to PostgreSQL
- [ ] Migrations run successfully: `npm run db:push`
- [ ] Tables created in database

### 📤 Git Commit (5 minutes)
```bash
# Review changes
git status

# Verify files to commit
git diff

# Commit with message
git add .
git commit -m "Production deployment: security fixes, env validation, CORS update"

# Push to main
git push origin main
```

### 🚀 Deploy (10 minutes)

**Render Deployment:**
1. Go to Render Dashboard
2. Watch deployment logs
3. [ ] Build completes successfully
4. [ ] Service shows "Live"
5. [ ] Copy your backend URL (e.g., `https://jobtradesasa-api.onrender.com`)

**Vercel Deployment:**
1. Go to Vercel Dashboard
2. Watch build logs
3. [ ] Build completes successfully
4. [ ] Deployment shows "Ready"
5. [ ] Copy your frontend URL (e.g., `https://jobtradesasa.vercel.app`)

### ✔️ Post-Deployment Verification (10 minutes)

**Test Backend Health:**
```bash
# Replace with your actual backend URL
curl https://your-render-backend.com/api/jobs
# Should return JSON array of jobs (not error)
```

**Test Frontend:**
1. [ ] Visit your Vercel URL in browser
2. [ ] Page loads without errors
3. [ ] Can login with test account
4. [ ] Can browse jobs
5. [ ] Can view supplier details
6. [ ] Profile updates work
7. [ ] Admin dashboard loads
8. [ ] Admin reports show data

**Check CORS:**
```bash
curl -i https://your-backend.com/api/jobs
# Should see: Access-Control-Allow-Origin header in response
```

**Monitor Logs:**
- [ ] Render dashboard - No error logs
- [ ] Vercel dashboard - No build errors
- [ ] Browser console (F12) - No errors

### 🔄 Optional Post-Deployment (Recommended)

- [ ] Set up error tracking (Sentry)
- [ ] Set up database backups (Neon auto-backup)
- [ ] Set up uptime monitoring
- [ ] Create admin account for production
- [ ] Disable test/seed data in production
- [ ] Set up analytics
- [ ] Configure email notifications

---

## 🎯 Critical Commands Reference

### If Deployment Fails

**Check Render Logs:**
```
1. Go to Render Dashboard
2. Click on your service
3. Click "Logs"
4. Look for red error messages
```

**Re-run Database Migrations:**
```bash
npm run db:push --force
```

**Check Environment Variables:**
```
1. Render Dashboard → Service → Environment
2. Verify: NODE_ENV, DATABASE_URL, JWT_SECRET are set
3. Delete service and re-deploy if needed
```

### If Frontend Can't Connect to Backend

**1. Check CORS:**
- Make sure backend URL is in `VITE_API_URL`
- Make sure frontend URL is in backend CORS

**2. Check Network:**
- Can you ping the backend? `curl https://backend-url.com`
- Is backend service "Live" on Render?

**3. Check Environment Variables:**
- Frontend: `VITE_API_URL` should point to backend
- Backend: CORS should include frontend domain

---

## 📊 Status Tracking

| Component | Local Dev | Staging | Production |
|-----------|-----------|---------|------------|
| Frontend | ✅ | [ ] | [ ] |
| Backend | ✅ | [ ] | [ ] |
| Database | ✅ | [ ] | [ ] |
| Auth | ✅ | [ ] | [ ] |
| Jobs | ✅ | [ ] | [ ] |
| Suppliers | ✅ | [ ] | [ ] |
| Admin | ✅ | [ ] | [ ] |

---

## 🆘 Troubleshooting

### Problem: "Invalid JWT Secret"
**Solution:** Make sure `JWT_SECRET` is set in Render environment variables

### Problem: "CORS error in browser"
**Solution:** Check backend CORS config has your Vercel domain

### Problem: "Database connection failed"
**Solution:** Verify `DATABASE_URL` is correct in Render environment

### Problem: "Frontend shows 404 after login"
**Solution:** Check `VITE_API_URL` in Vercel matches your Render backend URL

### Problem: "Page loads but shows errors in console"
**Solution:** Open DevTools (F12), check Network tab, see what API calls fail

---

## ⏰ Timeline

```
Start → Review Checklist (5 min)
      → Make Code Changes (10 min)
      → Set Up Render (10 min)
      → Set Up Vercel (10 min)
      → Local Testing (15 min)
      → Git Push (5 min)
      → Monitor Deployments (15 min)
      → Post-Deployment Tests (10 min)
      → DONE! 🎉

Total: ~1.5 - 2 hours
```

---

## 📋 Important URLs to Save

```
GitHub: https://github.com/[your-username]/jobtradesasa
Render Dashboard: https://dashboard.render.com
Vercel Dashboard: https://vercel.com
Database (Neon): https://console.neon.tech

Backend (After Deploy): [You'll get this from Render]
Frontend (After Deploy): [You'll get this from Vercel]
Admin Login: [Your admin email] / [Your password]
```

---

## ✨ That's It!

Follow this checklist step-by-step and your app will be production-ready in 2 hours.

**Remember:**
- ✅ Don't commit secrets to Git
- ✅ Use environment variables for sensitive data
- ✅ Test thoroughly before going live
- ✅ Monitor logs after deployment
- ✅ Have a rollback plan ready

---

**Good luck with your deployment! 🚀**

*Last Updated: November 13, 2025*
