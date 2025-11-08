// client/src/pages/auth/signup.tsx - FIXED VERSION

import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Briefcase, Loader2, UserCircle, Wrench, Building2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/queryClient';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { botswanaCities } from '@shared/schema';

// Individual signup schema (NO physical address)
const individualSignupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.enum(['requester', 'provider']),
  primaryCity: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
}).refine((data) => {
  if (data.role === 'provider') {
    return !!data.primaryCity;
  }
  return true;
}, {
  message: "City is required for service providers",
  path: ['primaryCity'],
});

// Supplier signup schema (WITH physical address)
const supplierSignupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.literal('supplier'),
  companyName: z.string().min(2, 'Company name is required'),
  physicalAddress: z.string().min(5, 'Physical address is required'),
  contactPerson: z.string().min(2, 'Contact person name is required'),
  contactPosition: z.string().min(2, 'Position/role is required'),
  companyEmail: z.string().email('Invalid company email'),
  companyPhone: z.string().min(5, 'Company phone is required'),
  industryType: z.string().min(2, 'Industry/Service type is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type IndividualSignupForm = z.infer<typeof individualSignupSchema>;
type SupplierSignupForm = z.infer<typeof supplierSignupSchema>;
type SignupData = IndividualSignupForm | SupplierSignupForm;

// INDIVIDUAL FORM COMPONENT
interface IndividualFormProps {
  form: UseFormReturn<IndividualSignupForm>;
  selectedRole: 'requester' | 'provider';
  isLoading: boolean;
  onSubmit: (data: SignupData) => void;
}

const IndividualForm = ({ form, selectedRole, isLoading, onSubmit }: IndividualFormProps) => (
  <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <FormField
        control={form.control}
        name="role"
        render={({ field }) => (
          <FormItem>
            <FormLabel>I want to</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="grid grid-cols-2 gap-4"
              >
                <label
                  htmlFor="requester"
                  className={`flex flex-col items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover-elevate transition-all ${
                    field.value === 'requester' ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <RadioGroupItem value="requester" id="requester" className="sr-only" />
                  <UserCircle className="h-8 w-8" />
                  <span className="font-medium text-sm">Find Services</span>
                </label>
                <label
                  htmlFor="provider"
                  className={`flex flex-col items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover-elevate transition-all ${
                    field.value === 'provider' ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <RadioGroupItem value="provider" id="provider" className="sr-only" />
                  <Wrench className="h-8 w-8" />
                  <span className="font-medium text-sm">Offer Services</span>
                </label>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {selectedRole === 'provider' && (
        <FormField
          control={form.control}
          name="primaryCity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your City / Service Area</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your city" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {botswanaCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {city}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                You will only see jobs in this city. You can apply to work in other cities later.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Full Name</FormLabel>
            <FormControl>
              <Input placeholder="John Doe" {...field} />
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
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input type="email" placeholder="you@example.com" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Phone (Optional)</FormLabel>
            <FormControl>
              <Input type="tel" placeholder="+267 12345678" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="password"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Password</FormLabel>
            <FormControl>
              <Input type="password" placeholder="••••••••" {...field} />
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
            <FormLabel>Confirm Password</FormLabel>
            <FormControl>
              <Input type="password" placeholder="••••••••" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <Button
        type="submit"
        className="w-full h-12"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          'Create Account'
        )}
      </Button>
    </form>
  </Form>
);

// ORGANIZATION FORM COMPONENT
interface OrganizationFormProps {
  form: UseFormReturn<SupplierSignupForm>;
  isLoading: boolean;
  onSubmit: (data: SignupData) => void;
}

const OrganizationForm = ({ form, isLoading, onSubmit }: OrganizationFormProps) => (
  <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder="ABC Suppliers Ltd" {...field} />
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
              <FormLabel>Industry/Service Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="hardware">Hardware Supplies</SelectItem>
                  <SelectItem value="plumbing">Plumbing Supplies</SelectItem>
                  <SelectItem value="electrical">Electrical Supplies</SelectItem>
                  <SelectItem value="construction">Construction Materials</SelectItem>
                  <SelectItem value="tools">Tools & Equipment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="physicalAddress"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Physical Address</FormLabel>
            <FormControl>
              <Input 
                placeholder="123 Main St, Gaborone" 
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="contactPerson"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Person</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
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
              <FormLabel>Position/Role</FormLabel>
              <FormControl>
                <Input placeholder="Manager" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="companyEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="info@company.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="companyPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Phone</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="+267 12345678" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Your Full Name</FormLabel>
            <FormControl>
              <Input placeholder="John Doe" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Phone (Optional)</FormLabel>
            <FormControl>
              <Input type="tel" placeholder="+267 12345678" {...field} />
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
            <FormLabel>Your Email</FormLabel>
            <FormControl>
              <Input type="email" placeholder="you@example.com" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="password"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Password</FormLabel>
            <FormControl>
              <Input type="password" placeholder="••••••••" {...field} />
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
            <FormLabel>Confirm Password</FormLabel>
            <FormControl>
              <Input type="password" placeholder="••••••••" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <Button
        type="submit"
        className="w-full h-12"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          'Create Account'
        )}
      </Button>
    </form>
  </Form>
);

// MAIN SIGNUP COMPONENT
export default function Signup() {
  const [, setLocation] = useLocation();
  const { setUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [accountType, setAccountType] = useState<'individual' | 'organization'>('individual');

  const individualForm = useForm<IndividualSignupForm>({
    resolver: zodResolver(individualSignupSchema),
    mode: 'onBlur',
    defaultValues: {
      name: '', 
      email: '', 
      phone: '', 
      password: '', 
      confirmPassword: '',
      role: 'requester', 
      primaryCity: '',
    },
  });

  const supplierForm = useForm<SupplierSignupForm>({
    resolver: zodResolver(supplierSignupSchema),
    mode: 'onBlur',
    defaultValues: {
      name: '', 
      email: '', 
      phone: '', 
      password: '', 
      confirmPassword: '',
      role: 'supplier', 
      companyName: '', 
      physicalAddress: '', 
      contactPerson: '',
      contactPosition: '', 
      companyEmail: '', 
      companyPhone: '', 
      industryType: '',
    },
  });
  
  const selectedRole = individualForm.watch('role');

  // FIX: Proper form reset when switching tabs
  const handleAccountTypeChange = (newType: 'individual' | 'organization') => {
    if (newType === 'individual') {
      supplierForm.reset({
        name: '', 
        email: '', 
        phone: '', 
        password: '', 
        confirmPassword: '',
        role: 'supplier', 
        companyName: '', 
        physicalAddress: '', 
        contactPerson: '',
        contactPosition: '', 
        companyEmail: '', 
        companyPhone: '', 
        industryType: '',
      });
    } else {
      individualForm.reset({
        name: '', 
        email: '', 
        phone: '', 
        password: '', 
        confirmPassword: '',
        role: 'requester', 
        primaryCity: '',
      });
    }
    setAccountType(newType);
  };

 const onSubmit = async (data: SignupData) => {
  setIsLoading(true);
  try {
    // 🔧 FIX: Clean up the payload based on account type
    let payload: any = {
      ...data,
      role: accountType === 'organization' ? 'supplier' : (data as IndividualSignupForm).role,
    };

    // 🔧 FIX: Remove primaryCity if it's empty or if user is a requester
    if (accountType === 'individual') {
      const individualData = data as IndividualSignupForm;
      
      // Remove primaryCity for requesters OR if it's empty
      if (individualData.role === 'requester' || !individualData.primaryCity) {
        delete payload.primaryCity;
      }
    }

    console.log('Sending signup payload:', { 
      role: payload.role, 
      hasCity: !!payload.primaryCity,
      keys: Object.keys(payload) 
    });

    const response = await apiRequest('POST', '/api/auth/signup', payload);
    const result = await response.json();
    
    localStorage.setItem('token', result.token);
    localStorage.setItem('user', JSON.stringify(result.user));
    setUser(result.user);

    toast({
      title: 'Account created!',
      description: `Welcome to JobTradeSasa${result.user.role === 'supplier' ? ', ' + (data as SupplierSignupForm).companyName : ''}.`,
    });

    setLocation(result.user.role === 'provider' ? '/dashboard' : '/jobs');
  } catch (error: any) {
    let message = error.message || 'An unknown error occurred.';
    if (message.startsWith('400:')) {
      message = message.substring(message.indexOf(':') + 1).trim();
    }

    console.error('Signup error:', { message, error }); // 🔧 Better error logging

    toast({
      title: 'Signup failed',
      description: message,
      variant: 'destructive',
    });
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Card className="w-full max-w-2xl border-2">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <div className="flex items-center gap-2">
              <Briefcase className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">JobTradeSasa</span>
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Create an Account</CardTitle>
          <CardDescription className="text-center">
            Join our community of service providers and requesters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={accountType} onValueChange={(v) => handleAccountTypeChange(v as any)} className="mb-6">
            <TabsList className="grid w-full grid-cols-2 h-12">
              <TabsTrigger value="individual" className="text-sm">
                <UserCircle className="h-4 w-4 mr-2" />
                Individual Account
              </TabsTrigger>
              <TabsTrigger value="organization" className="text-sm">
                <Building2 className="h-4 w-4 mr-2" />
                Organization/Supplier
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {accountType === 'individual' ? (
            <IndividualForm 
                form={individualForm}
                selectedRole={selectedRole}
                isLoading={isLoading}
                onSubmit={onSubmit}
            />
          ) : (
            <OrganizationForm 
                form={supplierForm}
                isLoading={isLoading}
                onSubmit={onSubmit}
            />
          )}

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login">
                <a className="text-primary hover:underline font-medium">
                  Login
                </a>
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
