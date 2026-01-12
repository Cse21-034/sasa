# Implementation Examples - Multi-Language & Phone Localization

## Example 1: Individual User Signup Form

```tsx
// client/src/pages/auth/individual-signup.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PhoneInputGroup } from '@/components/phone-input-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { individualSignupSchema } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

export default function IndividualSignup() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [countryCode, setCountryCode] = useState('+267');
  const [countryName, setCountryName] = useState('Botswana');

  const form = useForm({
    resolver: zodResolver(individualSignupSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      phoneCountryCode: '+267',
      phoneCountry: 'Botswana',
      password: '',
      confirmPassword: '',
      role: 'requester' as const,
      primaryCity: '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiRequest('POST', '/api/auth/signup', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('Profile updated') || 'Success',
        description: t('Your profile has been updated successfully.') || 'Welcome to our platform!',
      });
      setLocation('/dashboard');
    },
    onError: (error: Error) => {
      toast({
        title: t('Error') || 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (data: any) => {
    const fullPhoneNumber = data.phone ? `${countryCode}${data.phone}` : undefined;
    
    await mutation.mutateAsync({
      ...data,
      phone: fullPhoneNumber,
      phoneCountryCode: countryCode,
      phoneCountry: countryName,
    });
  };

  return (
    <div className="max-w-md mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">{t('Sign Up')}</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Full Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Full Name')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('Full Name')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Email')}</FormLabel>
                <FormControl>
                  <Input type="email" placeholder={t('Email')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Phone Number with Country Code */}
          <PhoneInputGroup
            label="Phone Number"
            value={form.watch('phone') || ''}
            countryCode={countryCode}
            onPhoneChange={(phone) => form.setValue('phone', phone)}
            onCountryCodeChange={(code, country) => {
              setCountryCode(code);
              setCountryName(country);
              form.setValue('phoneCountryCode', code);
              form.setValue('phoneCountry', country);
            }}
            error={form.formState.errors.phone?.message}
          />

          {/* Role Selection */}
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Select Role')}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="requester">{t('Job Requester')}</SelectItem>
                    <SelectItem value="provider">{t('Service Provider')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* City (for providers) */}
          {form.watch('role') === 'provider' && (
            <FormField
              control={form.control}
              name="primaryCity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('City')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('City')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Password */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Password')}</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Confirm Password */}
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Confirm Password')}</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Confirm password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? t('Saving...') : t('Sign Up')}
          </Button>
        </form>
      </Form>
    </div>
  );
}
```

## Example 2: Supplier Registration with Company Phone

```tsx
// client/src/pages/auth/supplier-signup.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { supplierSignupSchema } from '@shared/schema';
import { PhoneInputGroup } from '@/components/phone-input-group';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

export default function SupplierSignup() {
  const { t } = useTranslation();
  const [personalCountryCode, setPersonalCountryCode] = useState('+267');
  const [companyCountryCode, setCompanyCountryCode] = useState('+267');

  const form = useForm({
    resolver: zodResolver(supplierSignupSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      phoneCountryCode: '+267',
      phoneCountry: 'Botswana',
      password: '',
      confirmPassword: '',
      role: 'supplier' as const,
      companyName: '',
      physicalAddress: '',
      contactPerson: '',
      contactPosition: '',
      companyEmail: '',
      companyPhone: '',
      companyPhoneCountryCode: '+267',
      companyPhoneCountry: 'Botswana',
      industryType: '',
    },
  });

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">{t('Register Supplier')}</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Personal Information Section */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold mb-4">{t('Personal Information')}</h2>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Full Name')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('Full Name')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Email')}</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder={t('Email')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Personal Phone */}
            <PhoneInputGroup
              label="Phone Number"
              value={form.watch('phone') || ''}
              countryCode={personalCountryCode}
              onPhoneChange={(phone) => form.setValue('phone', phone)}
              onCountryCodeChange={(code, country) => {
                setPersonalCountryCode(code);
                form.setValue('phoneCountryCode', code);
                form.setValue('phoneCountry', country);
              }}
              error={form.formState.errors.phone?.message}
            />
          </div>

          {/* Company Information Section */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold mb-4">{t('Company Information')}</h2>

            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Company Name')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('Company Name')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="industryType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Industry Type')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('Industry Type')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="physicalAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Physical Address')}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t('Physical Address')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Contact Person')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('Contact Person')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactPosition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Position/Role')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('Position/Role')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Company Email')}</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder={t('Company Email')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Company Phone with Country Code */}
            <PhoneInputGroup
              label="Company Phone"
              value={form.watch('companyPhone') || ''}
              countryCode={companyCountryCode}
              onPhoneChange={(phone) => form.setValue('companyPhone', phone)}
              onCountryCodeChange={(code, country) => {
                setCompanyCountryCode(code);
                form.setValue('companyPhoneCountryCode', code);
                form.setValue('companyPhoneCountry', country);
              }}
              error={form.formState.errors.companyPhone?.message}
            />
          </div>

          {/* Password Section */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold mb-4">{t('Security')}</h2>

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Password')}</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Confirm Password')}</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" className="w-full" size="lg">
            {t('Register')}
          </Button>
        </form>
      </Form>
    </div>
  );
}
```

## Example 3: Language Switcher Component

```tsx
// client/src/components/language-switcher.tsx
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const languages = [
    { code: 'en', name: t('English'), flag: '🇬🇧' },
    { code: 'tn', name: t('Setswana'), flag: '🇧🇼' },
    { code: 'fr', name: t('French'), flag: '🇫🇷' },
    { code: 'es', name: t('Spanish'), flag: '🇪🇸' },
    { code: 'pt', name: t('Portuguese'), flag: '🇵🇹' },
    { code: 'af', name: t('Afrikaans'), flag: '🇿🇦' },
    { code: 'de', name: t('German'), flag: '🇩🇪' },
    { code: 'sw', name: t('Swahili'), flag: '🇹🇿' },
  ];

  const currentLanguage = languages.find(l => l.code === i18n.language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span>{currentLanguage?.flag} {currentLanguage?.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            className={i18n.language === lang.code ? 'bg-accent' : ''}
          >
            <span className="mr-2">{lang.flag}</span>
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

## Example 4: Profile Update with Phone

```tsx
// client/src/pages/profile.tsx
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PhoneInputGroup } from '@/components/phone-input-group';
import { apiRequest, queryClient } from '@/lib/queryClient';

export default function ProfilePage() {
  const { t } = useTranslation();
  const [countryCode, setCountryCode] = useState('+267');

  const { data: user } = useQuery({
    queryKey: ['/api/users/me'],
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiRequest('PUT', '/api/users/me', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
    },
  });

  const handlePhoneUpdate = (phone: string, code: string, country: string) => {
    updateMutation.mutate({
      phone,
      phoneCountryCode: code,
      phoneCountry: country,
    });
  };

  if (!user) return <div>{t('Loading...')}</div>;

  return (
    <div className="max-w-md">
      <h1>{t('Profile Settings')}</h1>

      {/* Current phone display */}
      <div className="mb-6 p-4 bg-muted rounded">
        <h3 className="font-semibold mb-2">{t('Current Phone Number')}</h3>
        <p className="text-sm">
          {user.phoneCountry} {user.phoneCountryCode} {user.phone}
        </p>
      </div>

      {/* Update phone */}
      <PhoneInputGroup
        label="Update Phone Number"
        value={user.phone}
        countryCode={user.phoneCountryCode}
        onPhoneChange={(phone) => 
          handlePhoneUpdate(phone, countryCode, user.phoneCountry)
        }
        onCountryCodeChange={(code, country) => {
          setCountryCode(code);
          handlePhoneUpdate(user.phone, code, country);
        }}
      />
    </div>
  );
}
```

## Example 5: Admin Dashboard with Multi-Language

```tsx
// client/src/pages/admin/users-list.tsx
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export function UsersList() {
  const { t } = useTranslation();
  const { data: users } = useQuery({
    queryKey: ['/api/admin/users'],
  });

  return (
    <div>
      <h1>{t('Browse Users')}</h1>
      <table>
        <thead>
          <tr>
            <th>{t('Full Name')}</th>
            <th>{t('Email')}</th>
            <th>{t('Phone Number')}</th>
            <th>{t('Country Code')}</th>
            <th>{t('Verified')}</th>
          </tr>
        </thead>
        <tbody>
          {users?.map(user => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.phone}</td>
              <td>{user.phoneCountryCode}</td>
              <td>{user.isVerified ? '✓' : '✗'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

These examples demonstrate practical implementations of the multi-language and phone localization features. Adapt them to your specific needs!
