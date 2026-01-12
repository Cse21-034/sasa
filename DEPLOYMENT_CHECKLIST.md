# Deployment & Integration Checklist

## ✅ Pre-Integration Checklist

### Code Review
- [x] All 8 languages have complete translations (200+ keys)
- [x] Country code picker component fully functional
- [x] Phone input group component properly integrated
- [x] Database schema updated with new fields
- [x] Validation schemas updated for new fields
- [x] No TypeScript errors
- [x] No ESLint warnings

### Documentation
- [x] IMPLEMENTATION_SUMMARY.md - Overview and statistics
- [x] MULTI_LANGUAGE_IMPLEMENTATION.md - Detailed guide
- [x] I18N_QUICK_REFERENCE.md - Quick start guide
- [x] IMPLEMENTATION_EXAMPLES.md - Code examples
- [x] This checklist document

---

## 🔧 Integration Steps (In Order)

### Step 1: Database Migration
- [ ] Review migration file (auto-generated)
- [ ] Backup current database
- [ ] Run migration: `npm run db:migrate`
- [ ] Verify new fields in database using `npm run db:studio`
- [ ] Confirm default values (+267 for all phone fields)

**Expected Columns Added**:
- `users.phone_country_code` (text, default "+267")
- `users.phone_country` (text, default "Botswana")
- `companies.company_phone_country_code` (text, default "+267")
- `companies.company_phone_country` (text, default "Botswana")
- `suppliers.company_phone_country_code` (text, default "+267")
- `suppliers.company_phone_country` (text, default "Botswana")

### Step 2: Update Authentication Routes
- [ ] Open `server/routes/auth.routes.ts`
- [ ] Update signup handler to accept `phoneCountryCode` and `phoneCountry`
- [ ] Update user creation to store phone country fields
- [ ] Test: POST `/api/auth/signup` with country code data

**Code to Update**:
```typescript
// Accept from request
const { phone, phoneCountryCode, phoneCountry } = req.body;

// Store in database
const user = await storage.createUser({
  phone,
  phoneCountryCode,
  phoneCountry,
  // ... other fields
});
```

### Step 3: Update Profile Routes
- [ ] Open `server/routes/user.routes.ts`
- [ ] Add endpoint to update phone with country code
- [ ] Test: PUT `/api/users/:id` with phone data

**Code to Add**:
```typescript
export async function updateUserPhone(req: Request, res: Response) {
  const { phone, phoneCountryCode, phoneCountry } = req.body;
  const user = await storage.updateUser(req.user.id, {
    phone,
    phoneCountryCode,
    phoneCountry,
  });
  res.json({ user });
}
```

### Step 4: Update Signup Forms (Frontend)
- [ ] Update `client/src/pages/auth/signup.tsx`
  - [ ] Import `PhoneInputGroup`
  - [ ] Replace phone input field
  - [ ] Add country code state
  - [ ] Update form submission

- [ ] Update `client/src/pages/auth/supplier-signup.tsx`
  - [ ] Add personal phone country code
  - [ ] Add company phone country code
  - [ ] Use `PhoneInputGroup` for both

- [ ] Update `client/src/pages/auth/company-signup.tsx`
  - [ ] Add company phone country code
  - [ ] Use `PhoneInputGroup`

**Example Change**:
```tsx
// OLD
<Input type="tel" placeholder="+267..." value={phone} onChange={setPhone} />

// NEW
<PhoneInputGroup
  value={phone}
  countryCode={countryCode}
  onPhoneChange={setPhone}
  onCountryCodeChange={setCountryCode}
/>
```

### Step 5: Update Profile Edit Forms
- [ ] Update user profile page
- [ ] Add ability to change phone country code
- [ ] Update profile settings
- [ ] Test phone update with different countries

### Step 6: Add Language Switcher
- [ ] Create `LanguageSwitcher` component (see examples)
- [ ] Add to header component
- [ ] Add to settings page
- [ ] Test language switching

**Placement Options**:
- Header top-right corner
- Settings page language preference section
- Footer
- Mobile menu

### Step 7: Update Company/Supplier Forms
- [ ] Update supplier registration form
- [ ] Add company phone country code picker
- [ ] Update company settings form
- [ ] Update supplier settings form

### Step 8: Display Phone Numbers Correctly
- [ ] Update user profile display to show full number
- [ ] Update supplier cards to show phone with country code
- [ ] Update admin user list
- [ ] Update any phone display formats

**Display Format**:
```typescript
// Option 1: Full number
`${user.phoneCountryCode}${user.phone}`  // +26771234567

// Option 2: With country name
`${user.phoneCountry}: ${user.phoneCountryCode}${user.phone}`  // Botswana: +26771234567

// Option 3: Country flag
`${FLAG[user.phoneCountry]} ${user.phoneCountryCode}${user.phone}`  // 🇧🇼 +267 71234567
```

### Step 9: Testing Phase

#### Test Individual Signup
- [ ] Sign up as individual with Botswana phone
- [ ] Sign up as individual with South Africa phone
- [ ] Sign up as individual with Nigeria phone
- [ ] Verify phone stored correctly
- [ ] Verify country code persisted

#### Test Supplier Signup
- [ ] Sign up with personal phone (Botswana)
- [ ] Add company phone (South Africa)
- [ ] Verify both stored with correct country codes
- [ ] Update phone in settings

#### Test Language Switching
- [ ] Switch to each language (en, tn, fr, es, pt, af, de, sw)
- [ ] Verify all UI strings translate
- [ ] Check signup form labels in each language
- [ ] Check error messages in each language
- [ ] Verify language persists after page reload

#### Test Country Code Picker
- [ ] Click country picker dropdown
- [ ] Search for country by name
- [ ] Search for country by code
- [ ] Select different countries
- [ ] Verify selection shows correct flag and code

#### Test Phone Input Validation
- [ ] Enter phone without country code
- [ ] Verify validation passes
- [ ] Try invalid phone format
- [ ] Check error messages appear

#### Test Phone Storage & Retrieval
- [ ] Create user with specific country code
- [ ] Query database directly
- [ ] Verify both phone and country code stored
- [ ] Retrieve user via API
- [ ] Verify phone data complete

### Step 10: Staging Deployment

- [ ] Deploy to staging environment
- [ ] Run full test suite
- [ ] Test all 8 languages
- [ ] Test all 24 countries
- [ ] Test on mobile devices
- [ ] Test browser language detection
- [ ] Verify SMS/email notifications use correct phone format

### Step 11: Production Deployment

- [ ] Create database backup
- [ ] Run migration on production
- [ ] Verify schema changes
- [ ] Deploy updated code
- [ ] Monitor for errors
- [ ] Test signup on production
- [ ] Verify existing users still work (backward compatible)

---

## 🧪 Testing Scenarios

### Scenario 1: First-Time User Registration
**Steps**:
1. Open signup page
2. Verify language is auto-detected (or English default)
3. Enter personal information
4. Select South Africa from country picker
5. Enter SA phone number
6. Complete signup
7. Verify phone stored as +27XXXXXXXX
8. Login and check profile shows country code

**Expected Result**: ✅ User registered with correct country code

### Scenario 2: Language Preference Persistence
**Steps**:
1. Open site (defaults to English or browser language)
2. Change language to French
3. Refresh page
4. Verify still in French
5. Close browser and reopen
6. Verify still in French

**Expected Result**: ✅ Language persists across sessions

### Scenario 3: Multi-Country Company
**Steps**:
1. Signup as supplier
2. Add personal phone (Nigeria)
3. Add company phone (Kenya)
4. Save profile
5. Edit profile
6. Verify both countries show correctly
7. Update company phone to Uganda
8. Verify update succeeds

**Expected Result**: ✅ Multiple country codes can coexist

### Scenario 4: Existing User Compatibility
**Steps**:
1. Query database for user created before migration
2. Check phone field (should have data)
3. Check phone_country_code (should default to +267)
4. Check phone_country (should default to Botswana)
5. Update that user's phone
6. Verify new country code saves

**Expected Result**: ✅ Backward compatible, existing data preserved

---

## 📋 Validation Checklist

### Database
- [ ] Migration applied successfully
- [ ] New columns exist with correct types
- [ ] Default values set correctly
- [ ] No data loss from existing users
- [ ] Indexes applied if needed

### Backend
- [ ] Auth routes accept country code
- [ ] User routes accept country code
- [ ] Supplier routes accept country code
- [ ] Validation schemas updated
- [ ] Error messages translated
- [ ] API returns phone with country code

### Frontend
- [ ] All 8 language objects complete
- [ ] Country picker displays 24 countries
- [ ] Phone input group renders correctly
- [ ] Forms submit with country code
- [ ] Translations display without keys
- [ ] Language switching works instantly
- [ ] No console errors

### User Experience
- [ ] Forms feel intuitive
- [ ] Country picker is easy to find
- [ ] Phone input clear and user-friendly
- [ ] Language switch is visible
- [ ] Mobile responsive
- [ ] Accessibility compliant (WCAG)

---

## 🚨 Rollback Plan

If issues occur in production:

### Option 1: Quick Hotfix (If migration wasn't applied)
```bash
# Skip database migration
# Revert code changes
git revert <commit-hash>
npm run build
npm run deploy
```

### Option 2: Data Recovery (If migration applied)
```bash
# Restore database from backup
pg_restore -d sasa_db backup_pre_migration.sql

# Revert code
git revert <commit-hash>

# Redeploy
npm run build && npm run deploy
```

### Option 3: Forward Fix (If data exists)
- Keep migration
- Fix code issues
- Redeploy
- Notify affected users

---

## 📞 Support & Debugging

### Common Issues

**Issue**: Translation key shows instead of text
- **Cause**: Missing translation key in language object
- **Fix**: Add key to `client/src/lib/i18n.ts` for all 8 languages

**Issue**: Country picker not showing all countries
- **Cause**: COUNTRIES array incomplete
- **Fix**: Check `client/src/components/country-code-picker.tsx`

**Issue**: Phone number not storing country code
- **Cause**: Form not sending country code
- **Fix**: Ensure PhoneInputGroup updates form state

**Issue**: Language not persisting
- **Cause**: localStorage not available or cleared
- **Fix**: Check browser settings, clear cache/cookies

**Issue**: Phone validation fails
- **Cause**: Phone number format with spaces/special chars
- **Fix**: Strip non-digits before validation

### Debug Commands

```bash
# Check translations loaded
i18n.language  // In browser console

# Check country code persisted
user.phoneCountryCode

# Verify form data before submit
console.log(form.getValues())

# Check database migration status
npm run db:status

# Inspect language storage
localStorage.getItem('i18nextLng')
```

---

## 📊 Success Metrics

Track these metrics after deployment:

- [ ] **Signup Completion Rate**: Should remain stable or improve
- [ ] **Form Error Rate**: Should decrease with better UX
- [ ] **Language Usage**: Track which languages are most popular
- [ ] **Country Distribution**: Monitor geographic spread
- [ ] **Phone Validation Success**: Track valid phone captures
- [ ] **User Retention**: Should not decrease
- [ ] **Performance**: Page load times should not increase

---

## 📝 Post-Deployment Tasks

### Immediately After Deploy
- [ ] Monitor error logs for 2 hours
- [ ] Test all signup paths manually
- [ ] Verify language switching works
- [ ] Check phone data in database
- [ ] Monitor server performance

### Next 24 Hours
- [ ] Gather user feedback
- [ ] Monitor email/support for issues
- [ ] Verify phone notifications work
- [ ] Test with actual user data patterns

### Next 7 Days
- [ ] Analyze usage patterns
- [ ] Optimize based on user behavior
- [ ] Add more countries if requested
- [ ] Improve translations based on feedback

### Monthly Review
- [ ] Review language usage statistics
- [ ] Add new languages if needed
- [ ] Optimize performance based on metrics
- [ ] Plan future enhancements

---

## ✨ Final Approval Checklist

Before going live, confirm:

- [ ] All code reviewed and tested
- [ ] Database migration tested on staging
- [ ] All 8 languages complete and correct
- [ ] All 24 countries in picker
- [ ] Forms properly integrate PhoneInputGroup
- [ ] Phone data saves and retrieves correctly
- [ ] Language preference persists
- [ ] No TypeScript errors
- [ ] No console errors or warnings
- [ ] Mobile responsive and tested
- [ ] Accessibility verified
- [ ] Documentation complete
- [ ] Team trained on new features
- [ ] Support team briefed
- [ ] Rollback plan documented

---

## 🎉 Launch!

When everything above is checked:

```bash
# Final deployment
npm run build
npm run deploy

# Monitor
tail -f logs/app.log
```

Congratulations! Your platform is now multi-lingual and multi-country! 🌍🎊

---

**Status**: Ready for Integration
**Estimated Integration Time**: 2-3 hours
**Estimated Testing Time**: 4-6 hours
**Total Time to Production**: 1-2 business days
