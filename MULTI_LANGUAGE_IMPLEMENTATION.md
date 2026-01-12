# Multi-Language & Multi-Country Phone Support Implementation Guide

## Overview

This guide documents the implementation of comprehensive multi-language support (8 languages) and multi-country phone number input with proper localization across your artisan marketplace platform.

## What's Been Implemented

### 1. Language Support Expansion (i18n)

**File**: `client/src/lib/i18n.ts`

**Supported Languages** (8 total):
- 🇬🇧 **English** (en) - Base language
- 🇧🇼 **Setswana** (tn) - Botswana native language  
- 🇫🇷 **French** (fr) - West/Central Africa
- 🇪🇸 **Spanish** (es) - Global market
- 🇵🇹 **Portuguese** (pt) - Southern Africa (Mozambique, Angola)
- 🇿🇦 **Afrikaans** (af) - South Africa
- 🇩🇪 **German** (de) - European market
- 🇹🇿 **Swahili** (sw) - East Africa (Kenya, Uganda, Tanzania)

**Translation Keys** (200+ strings):

```typescript
Translation categories covered:
- Navigation & Authentication
- Profile & Settings Management
- Job Posting & Browsing
- Notifications & Messages
- Verification Process
- Supplier Settings & Promotions
- Common UI Actions
- Country & Language Names
```

### 2. Country Code Picker Component

**File**: `client/src/components/country-code-picker.tsx`

**Features**:
- ✅ 24 African countries + UK, US, Australia, Canada
- ✅ Country flags using emoji
- ✅ Searchable dropdown
- ✅ Dial code display
- ✅ Default: Botswana (+267)

**Supported Countries**:
```
Botswana (+267) 🇧🇼
South Africa (+27) 🇿🇦
Namibia (+264) 🇳🇦
Zimbabwe (+263) 🇿🇼
Zambia (+260) 🇿🇲
Nigeria (+234) 🇳🇬
Kenya (+254) 🇰🇪
Uganda (+256) 🇺🇬
Ghana (+233) 🇬🇭
Tanzania (+255) 🇹🇿
Mozambique (+258) 🇲🇿
Angola (+244) 🇦🇴
Lesotho (+266) 🇱🇸
Eswatini (+268) 🇸🇿
Malawi (+265) 🇲🇼
Rwanda (+250) 🇷🇼
Burundi (+257) 🇧🇮
DRC (+243) 🇨🇩
Cameroon (+237) 🇨🇲
Senegal (+221) 🇸🇳
United Kingdom (+44) 🇬🇧
United States (+1) 🇺🇸
Australia (+61) 🇦🇺
Canada (+1) 🇨🇦
```

**Component Props**:
```typescript
interface CountryCodePickerProps {
  value: string; // dial code (e.g., "+267")
  onChange: (dialCode: string, countryName: string, countryCode: string) => void;
  className?: string;
}
```

### 3. Phone Input Group Component

**File**: `client/src/components/phone-input-group.tsx`

**Purpose**: Wrapper component that combines country code picker with phone number input field.

**Features**:
- ✅ Integrated country code picker
- ✅ Phone number input field
- ✅ Error message display
- ✅ Helper text showing full number
- ✅ Fully localized with i18n
- ✅ Accessible with proper labels

**Component Props**:
```typescript
interface PhoneInputGroupProps {
  label?: string; // Field label (will be translated)
  value: string; // Phone number without country code
  countryCode: string; // Dial code (e.g., "+267")
  onCountryCodeChange: (dialCode: string, countryName: string, countryCode: string) => void;
  onPhoneChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
}
```

**Usage Example**:
```tsx
import { PhoneInputGroup } from '@/components/phone-input-group';
import { useState } from 'react';

export function SignupForm() {
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+267');

  return (
    <PhoneInputGroup
      label="Phone Number"
      value={phone}
      countryCode={countryCode}
      onPhoneChange={setPhone}
      onCountryCodeChange={(code) => setCountryCode(code)}
      error={phoneError}
      placeholder="Enter phone number"
    />
  );
}
```

### 4. Database Schema Updates

**File**: `shared/schema.ts`

**New Fields Added to Users Table**:
```typescript
phone: text("phone"),                           // Phone number without code
phoneCountryCode: text("phone_country_code").default("+267"),  // e.g., "+267"
phoneCountry: text("phone_country").default("Botswana"),       // Country name
```

**New Fields Added to Companies Table**:
```typescript
companyPhoneCountryCode: text("company_phone_country_code").default("+267"),
companyPhoneCountry: text("company_phone_country").default("Botswana"),
```

**New Fields Added to Suppliers Table**:
```typescript
companyPhoneCountryCode: text("company_phone_country_code").default("+267"),
companyPhoneCountry: text("company_phone_country").default("Botswana"),
```

### 5. Validation Schema Updates

**Updated Zod Schemas**:

```typescript
// Individual Signup
export const individualSignupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  phoneCountryCode: z.string().default('+267'),
  phoneCountry: z.string().default('Botswana'),
  // ... other fields
});

// Supplier Signup
export const supplierSignupSchema = z.object({
  // ... other fields
  companyPhone: z.string().min(5),
  companyPhoneCountryCode: z.string().default('+267'),
  companyPhoneCountry: z.string().default('Botswana'),
  // ... other fields
});

// Company Signup
export const companySignupSchema = z.object({
  // ... other fields
  companyPhone: z.string().min(5),
  companyPhoneCountryCode: z.string().default('+267'),
  companyPhoneCountry: z.string().default('Botswana'),
  // ... other fields
});
```

## How to Use in Your Application

### 1. Using Translations

```tsx
import { useTranslation } from 'react-i18next';

export function MyComponent() {
  const { t, i18n } = useTranslation();

  return (
    <div>
      <h1>{t('Browse Jobs')}</h1>
      <p>{t('Select your preferred language')}</p>
      
      {/* Language Switcher */}
      <select value={i18n.language} onChange={(e) => i18n.changeLanguage(e.target.value)}>
        <option value="en">{t('English')}</option>
        <option value="tn">{t('Setswana')}</option>
        <option value="fr">{t('French')}</option>
        <option value="es">{t('Spanish')}</option>
        <option value="pt">{t('Portuguese')}</option>
        <option value="af">{t('Afrikaans')}</option>
        <option value="de">{t('German')}</option>
        <option value="sw">{t('Swahili')}</option>
      </select>
    </div>
  );
}
```

### 2. Using Phone Input with Country Code

```tsx
import { PhoneInputGroup } from '@/components/phone-input-group';
import { useState } from 'react';

export function RegistrationForm() {
  const [formData, setFormData] = useState({
    phone: '',
    phoneCountryCode: '+267',
    phoneCountry: 'Botswana',
  });

  const handlePhoneChange = (phone: string) => {
    setFormData(prev => ({ ...prev, phone }));
  };

  const handleCountryChange = (code: string, country: string) => {
    setFormData(prev => ({
      ...prev,
      phoneCountryCode: code,
      phoneCountry: country,
    }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <PhoneInputGroup
        label="Phone Number"
        value={formData.phone}
        countryCode={formData.phoneCountryCode}
        onPhoneChange={handlePhoneChange}
        onCountryCodeChange={(code, country) => handleCountryChange(code, country)}
        error={errors.phone}
      />
      <button type="submit">Register</button>
    </form>
  );
}
```

### 3. Storing Complete Phone Numbers

When submitting form data:

```typescript
// Frontend - prepare full phone number
const fullPhoneNumber = `${formData.phoneCountryCode}${formData.phone}`;

// Send to API
const response = await apiRequest('POST', '/api/auth/signup', {
  ...formData,
  phone: fullPhoneNumber,
  phoneCountryCode: formData.phoneCountryCode,
  phoneCountry: formData.phoneCountry,
});

// Backend - store with country info
const user = await storage.createUser({
  phone: fullPhoneNumber,
  phoneCountryCode: formData.phoneCountryCode,
  phoneCountry: formData.phoneCountry,
  // ... other fields
});
```

## Translation Key Reference

### Navigation Keys
- `"Browse Jobs"` - Browse available jobs
- `"Post a Job"` - Create new job posting
- `"Dashboard"` - User dashboard
- `"Messages"` - Messaging interface
- `"Logout"` - Sign out
- `"Login"` - Sign in
- `"Sign Up"` - Register account
- `"Account Verification"` - Verification page

### Phone-Related Keys
- `"Phone Number"` - Phone label
- `"Country Code"` - Country code selector label
- `"Select Country"` - Country selection prompt
- `"Company Phone"` - Business phone field

### Location Keys
- `"Location"` - General location
- `"City"` - City field
- `"Address"` - Street address
- `"Select Country"` - Country selector

### Status Keys
- `"Verified"` - Verification complete
- `"Pending"` - Awaiting action
- `"Rejected"` - Rejected status

### Action Keys
- `"Save Changes"` - Save button
- `"Continue"` - Next step
- `"Submit"` - Submit form
- `"Cancel"` - Cancel action
- `"Edit"` - Edit button
- `"Delete"` - Delete button

## Database Migration Steps

### Step 1: Create Migration File

```bash
npm run db:generate -- "add_phone_country_fields"
```

### Step 2: Review Generated Migration

The migration will add:
- `phone_country_code` to users table
- `phone_country` to users table
- `company_phone_country_code` to companies table
- `company_phone_country` to companies table
- `company_phone_country_code` to suppliers table
- `company_phone_country` to suppliers table

### Step 3: Apply Migration

```bash
npm run db:migrate
```

### Step 4: Verify Schema

```bash
npm run db:studio  # Open Drizzle Studio to verify
```

## Implementing Phone Input in Forms

### Example 1: Individual Signup

```tsx
// client/src/pages/auth/signup.tsx
import { PhoneInputGroup } from '@/components/phone-input-group';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { individualSignupSchema } from '@shared/schema';

export function IndividualSignup() {
  const [countryCode, setCountryCode] = useState('+267');
  const form = useForm({
    resolver: zodResolver(individualSignupSchema),
    defaultValues: {
      phoneCountryCode: '+267',
      phoneCountry: 'Botswana',
    },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <PhoneInputGroup
        label="Phone Number"
        value={form.watch('phone') || ''}
        countryCode={countryCode}
        onPhoneChange={(value) => form.setValue('phone', value)}
        onCountryCodeChange={(code, country) => {
          setCountryCode(code);
          form.setValue('phoneCountryCode', code);
          form.setValue('phoneCountry', country);
        }}
        error={form.formState.errors.phone?.message}
      />
      <button type="submit">Sign Up</button>
    </form>
  );
}
```

### Example 2: Company Registration

```tsx
// client/src/pages/auth/company-signup.tsx
export function CompanySignup() {
  const [companyCountryCode, setCompanyCountryCode] = useState('+267');
  
  return (
    <PhoneInputGroup
      label="Company Phone"
      value={form.watch('companyPhone') || ''}
      countryCode={companyCountryCode}
      onPhoneChange={(value) => form.setValue('companyPhone', value)}
      onCountryCodeChange={(code, country) => {
        setCompanyCountryCode(code);
        form.setValue('companyPhoneCountryCode', code);
        form.setValue('companyPhoneCountry', country);
      }}
      error={form.formState.errors.companyPhone?.message}
    />
  );
}
```

## Testing the Implementation

### Test Checklist

- [ ] All 8 languages load correctly
- [ ] Language switching updates all UI strings
- [ ] Country code picker displays all 24 countries
- [ ] Country code picker search functionality works
- [ ] Phone input integrates properly with country picker
- [ ] Country code persists when switching countries
- [ ] Form validation includes country code
- [ ] Phone numbers store with country code in database
- [ ] User profile displays phone with country code
- [ ] Translations are complete (no missing keys)

### Testing Phone Input

```typescript
// Test Case 1: Botswana Number
Country: Botswana (+267)
Phone: 71234567
Expected Full: +26771234567

// Test Case 2: South Africa Number  
Country: South Africa (+27)
Phone: 812345678
Expected Full: +27812345678

// Test Case 3: Nigeria Number
Country: Nigeria (+234)
Phone: 9012345678
Expected Full: +2349012345678
```

### Testing Language Switching

```typescript
// Test each language key
const testKeys = [
  'Browse Jobs',
  'Post a Job',
  'Phone Number',
  'Country Code',
  'Save Changes',
  'Account Verification',
];

// Verify translations exist in all 8 languages
testKeys.forEach(key => {
  languages.forEach(lang => {
    expect(translations[lang][key]).toBeDefined();
  });
});
```

## Backend Integration

### Updating Auth Routes

```typescript
// server/routes/auth.routes.ts
export async function handleSignup(req: Request, res: Response) {
  const { 
    phone, 
    phoneCountryCode, 
    phoneCountry,
    // ... other fields
  } = req.body;

  const user = await storage.createUser({
    phone,
    phoneCountryCode,
    phoneCountry,
    preferredLanguage: req.body.preferredLanguage || 'en',
    // ... other fields
  });

  res.json({ user });
}
```

### Updating User Profile Routes

```typescript
// server/routes/user.routes.ts
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

## Language Persistence

The i18n system automatically persists language preference:

```typescript
// Stored in localStorage
localStorage.getItem('i18nextLng')

// Or via user preference
user.preferredLanguage  // stored in database
```

## Common Issues & Solutions

### Issue: Translations not loading
**Solution**: Ensure all translation keys are defined in all 8 language objects.

### Issue: Country picker not showing all countries
**Solution**: Check the COUNTRIES array in `country-code-picker.tsx` - ensure all required countries are added.

### Issue: Phone number validation failing
**Solution**: Verify the phone field is being stored without spaces or special characters (only digits after country code).

### Issue: Language not persisting
**Solution**: Clear browser localStorage and reload. The detection should pick up the browser language preference.

## Performance Considerations

- ✅ Translations loaded inline (no external files)
- ✅ Language detection uses browser preferences
- ✅ Country code picker uses dropdown menu (not modal)
- ✅ Phone validation is client-side only (fast)
- ✅ No additional API calls for language switching

## Future Enhancements

1. **Phone Format Validation**: Add country-specific phone number format validation
2. **SMS Verification**: Implement SMS verification with correct country codes
3. **WhatsApp Integration**: Use phone numbers with country codes for WhatsApp
4. **Call Integration**: Use complete phone numbers for direct calling
5. **Regional Currencies**: Add currency selection based on country
6. **Time Zones**: Auto-set timezone based on country
7. **Address Format**: Adjust address form based on selected country
8. **RTL Languages**: Support right-to-left languages in future

## Files Modified/Created

### Created Files:
- ✅ `client/src/components/country-code-picker.tsx` (260 lines)
- ✅ `client/src/components/phone-input-group.tsx` (70 lines)
- ✅ `MULTI_LANGUAGE_IMPLEMENTATION.md` (this file)

### Modified Files:
- ✅ `client/src/lib/i18n.ts` (1121 lines - expanded from ~150)
- ✅ `shared/schema.ts` (users, companies, suppliers tables updated)

## Support & Documentation

For complete API documentation, see:
- [i18next Official Docs](https://www.i18next.com/)
- [React-i18next Integration](https://react.i18next.com/)
- [Country Code Standards](https://en.wikipedia.org/wiki/List_of_country_calling_codes)

---

**Implementation Date**: 2024
**Status**: Complete
**Test Coverage**: Ready for QA
