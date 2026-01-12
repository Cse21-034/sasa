# i18n & Phone Localization - Quick Start Guide

## 🚀 Quick Implementation

### 1. Using Translations in Components

```tsx
import { useTranslation } from 'react-i18next';

export function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('Browse Jobs')}</h1>
      <button>{t('Post a Job')}</button>
    </div>
  );
}
```

### 2. Adding Phone Input to a Form

```tsx
import { PhoneInputGroup } from '@/components/phone-input-group';
import { useState } from 'react';

export function MyForm() {
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+267');

  return (
    <PhoneInputGroup
      label="Phone Number"
      value={phone}
      countryCode={countryCode}
      onPhoneChange={setPhone}
      onCountryCodeChange={(code) => setCountryCode(code)}
    />
  );
}
```

### 3. Language Switcher

```tsx
import { useTranslation } from 'react-i18next';

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  return (
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
  );
}
```

## 📱 Supported Countries

| Country | Code | Dial |
|---------|------|------|
| Botswana | BW | +267 |
| South Africa | ZA | +27 |
| Namibia | NA | +264 |
| Zimbabwe | ZW | +263 |
| Zambia | ZM | +260 |
| Nigeria | NG | +234 |
| Kenya | KE | +254 |
| Uganda | UG | +256 |
| Ghana | GH | +233 |
| Tanzania | TZ | +255 |
| Mozambique | MZ | +258 |
| Angola | AO | +244 |
| Lesotho | LS | +266 |
| Eswatini | SZ | +268 |
| Malawi | MW | +265 |
| Rwanda | RW | +250 |
| Burundi | BI | +257 |
| DRC | CD | +243 |
| Cameroon | CM | +237 |
| Senegal | SN | +221 |
| United Kingdom | GB | +44 |
| United States | US | +1 |
| Australia | AU | +61 |
| Canada | CA | +1 |

## 🌍 Available Languages

1. **English** (en)
2. **Setswana** (tn)
3. **French** (fr)
4. **Spanish** (es)
5. **Portuguese** (pt)
6. **Afrikaans** (af)
7. **German** (de)
8. **Swahili** (sw)

## 📝 Common Translation Keys

### Authentication
- `"Login"` - Sign in page
- `"Sign Up"` - Registration page
- `"Logout"` - Sign out action

### Navigation
- `"Browse Jobs"` - Job listing
- `"Post a Job"` - Create job
- `"Dashboard"` - User dashboard
- `"Messages"` - Chat
- `"Profile Settings"` - Account settings

### Forms
- `"Full Name"` - Name field
- `"Email"` - Email field
- `"Phone Number"` - Phone field
- `"Country Code"` - Country picker
- `"Password"` - Password field

### Notifications
- `"Notifications"` - Notification center
- `"New job in your category"` - Job alert
- `"Your application was accepted"` - Status update
- `"Mark as read"` - Action

### Verification
- `"Account Verification"` - Verification page
- `"Email Verification"` - Email step
- `"Phone Verification"` - Phone step
- `"Government ID Verification"` - ID step

### Buttons
- `"Save Changes"` - Save button
- `"Cancel"` - Cancel action
- `"Submit"` - Submit form
- `"Continue"` - Next step
- `"Edit"` - Edit action
- `"Delete"` - Delete action

## 🔧 Adding New Translation Keys

### Step 1: Add to i18n.ts (English)

```typescript
// client/src/lib/i18n.ts
const resources = {
  en: {
    translation: {
      "My New Key": "My new translation",
      // ... other keys
    }
  },
  // ... other languages
}
```

### Step 2: Add Same Key to All 7 Other Languages

```typescript
tn: {
  translation: {
    "My New Key": "Ka go lokela se se sa latlhelego",
  }
},
fr: {
  translation: {
    "My New Key": "Ma nouvelle traduction",
  }
},
// ... repeat for es, pt, af, de, sw
```

### Step 3: Use in Component

```tsx
const { t } = useTranslation();
return <h1>{t('My New Key')}</h1>;
```

## 💾 Storing Phone with Country Code

### Frontend
```tsx
const phoneData = {
  phone: "71234567",
  phoneCountryCode: "+267",
  phoneCountry: "Botswana",
};
```

### Backend Storage
```typescript
user.phone = "+26771234567";
user.phoneCountryCode = "+267";
user.phoneCountry = "Botswana";
```

### Display Full Number
```typescript
const fullNumber = `${user.phoneCountryCode}${user.phone}`;
console.log(fullNumber); // "+26771234567"
```

## 🧪 Testing

### Check Translation Exists
```typescript
const { t } = useTranslation();
const translated = t('Browse Jobs');
// Should return translated string, not "Browse Jobs"
```

### Check Country Code Works
```tsx
<CountryCodePicker 
  value="+27"
  onChange={(code, country) => {
    console.log(code);    // "+27"
    console.log(country); // "South Africa"
  }}
/>
```

### Check Language Persists
```javascript
// Open console
localStorage.getItem('i18nextLng')
// Should show current language code
```

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Translation shows as key | Key not defined in resource object |
| Country code picker empty | Check COUNTRIES array in component |
| Language not changing | Clear localStorage and refresh |
| Phone validation fails | Ensure no spaces in phone number |
| Country flag not showing | Emoji might not render in some fonts |

## 📚 Related Files

- Translation config: `client/src/lib/i18n.ts`
- Country picker: `client/src/components/country-code-picker.tsx`
- Phone input: `client/src/components/phone-input-group.tsx`
- Database schema: `shared/schema.ts`
- Form schemas: `shared/schema.ts` (Zod)

## 🚀 Deployment Checklist

- [ ] All translation keys defined in all 8 languages
- [ ] Phone input integrated in signup forms
- [ ] Country code fields added to database
- [ ] Migration applied successfully
- [ ] Phone numbers stored with country code
- [ ] User profile displays phone correctly
- [ ] Language preference persists
- [ ] All 8 languages tested

---

**Last Updated**: 2024
**Status**: Ready for Production
