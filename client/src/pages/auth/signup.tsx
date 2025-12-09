// client/src/pages/auth/signup.tsx - REORGANIZED VERSION

import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Briefcase, Loader2, UserCircle, Wrench, Building2, MapPin, ShoppingBag } from 'lucide-react';
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

// Company signup schema (FOR company requesters/service providers)
const companySignupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.literal('company'),
  companyRole: z.enum(['requester', 'provider']),
  companyName: z.string().min(2, 'Company name is required'),
  registrationNumber: z.string().min(3, 'Registration number is required'),
  taxNumber: z.string().optional(),
  physicalAddress: z.string().min(5, 'Physical address is required'),
  contactPerson: z.string().min(2, 'Contact person name is required'),
  contactPosition: z.string().min(2, 'Position/role is required'),
  companyEmail: z.string().email('Invalid company email'),
  companyPhone: z.string().min(5, 'Company phone is required'),
  companyWebsite: z.string().url().optional().or(z.literal('')),
  industryType: z.string().min(2, 'Industry type is required'),
  numberOfEmployees: z.string().optional(),
  yearsInBusiness: z.string().optional(),
  primaryCity: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
}).refine((data) => {
  if (data.companyRole === 'provider') {
    return !!data.primaryCity;
  }
  return true;
}, {
  message: "City is required for company service providers",
  path: ['primaryCity'],
});

type IndividualSignupForm = z.infer<typeof individualSignupSchema>;
type SupplierSignupForm = z.infer<typeof supplierSignupSchema>;
type CompanySignupForm = z.infer<typeof companySignupSchema>;
type SignupData = IndividualSignupForm | SupplierSignupForm | CompanySignupForm;

// INDIVIDUAL REQUESTER/PROVIDER FORM COMPONENT
interface IndividualFormProps {
  form: UseFormReturn<IndividualSignupForm>;
  selectedRole: 'requester' | 'provider';
  isLoading: boolean;
  onSubmit: (data: SignupData) => void;
  userType: 'individual' | 'company';
  onUserTypeChange: (type: 'individual' | 'company') => void;
}

const IndividualForm = ({ form, selectedRole, isLoading, onSubmit, userType, onUserTypeChange }: IndividualFormProps) => (
  <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* User Type Selection */}
      <div className="space-y-3">
        <FormLabel>Register as</FormLabel>
        <RadioGroup
          value={userType}
          onValueChange={(v) => onUserTypeChange(v as 'individual' | 'company')}
          className="grid grid-cols-2 gap-4"
        >
          <label
            htmlFor="user-type-individual"
            className={`flex flex-col items-center gap-2 p-3 border-2 rounded-lg cursor-pointer hover-elevate transition-all ${
              userType === 'individual' ? 'border-primary bg-primary/5' : 'border-border'
            }`}
          >
            <RadioGroupItem value="individual" id="user-type-individual" className="sr-only" />
            <UserCircle className="h-6 w-6" />
            <span className="font-medium text-sm">Individual</span>
          </label>
          <label
            htmlFor="user-type-company"
            className={`flex flex-col items-center gap-2 p-3 border-2 rounded-lg cursor-pointer hover-elevate transition-all ${
              userType === 'company' ? 'border-primary bg-primary/5' : 'border-border'
            }`}
          >
            <RadioGroupItem value="company" id="user-type-company" className="sr-only" />
            <Building2 className="h-6 w-6" />
            <span className="font-medium text-sm">Company</span>
          </label>
        </RadioGroup>
      </div>

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

// COMPANY FORM COMPONENT (For Find/Provide Service)
interface CompanyFormProps {
  form: UseFormReturn<CompanySignupForm>;
  selectedCompanyRole: 'requester' | 'provider';
  isLoading: boolean;
  onSubmit: (data: SignupData) => void;
}

const CompanyForm = ({ form, selectedCompanyRole, isLoading, onSubmit }: CompanyFormProps) => (
  <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {selectedCompanyRole === 'provider' && (
        <FormField
          control={form.control}
          name="primaryCity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Service Area</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your service city" />
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
                Your company will only see jobs in this city. You can apply to work in other cities later.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <div className="grid grid-cols-2 gap-4">
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder="ABC Corporation Ltd" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="registrationNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Registration Number</FormLabel>
              <FormControl>
                <Input placeholder="REG123456" {...field} />
              </FormControl>
              <FormDescription>Your company registration number</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="taxNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tax Number (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="TAX123456" {...field} />
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
              <FormLabel>Industry Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="construction">Construction</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="consulting">Consulting</SelectItem>
                  <SelectItem value="logistics">Logistics</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="services">Services</SelectItem>
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
                placeholder="123 Business Ave, Gaborone" 
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
                <Input placeholder="Jane Smith" {...field} />
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
                <Input placeholder="Director" {...field} />
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
                <Input placeholder="+267 XX XXX XXXX" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="companyWebsite"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Website (Optional)</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="numberOfEmployees"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Employees (Optional)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="50" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="yearsInBusiness"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Years in Business (Optional)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="5" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

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

      <FormDescription className="text-sm">
        Your documents will need to be verified before you can post jobs. Verification typically takes 24-48 hours.
      </FormDescription>

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
          'Create Company Account'
        )}
      </Button>
    </form>
  </Form>
);

// SUPPLIER FORM COMPONENT
interface SupplierFormProps {
  form: UseFormReturn<SupplierSignupForm>;
  isLoading: boolean;
  onSubmit: (data: SignupData) => void;
}

const SupplierForm = ({ form, isLoading, onSubmit }: SupplierFormProps) => (
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
  const [mainTab, setMainTab] = useState<'find-service' | 'provide-service' | 'supplier'>('find-service');
  const [requesterUserType, setRequesterUserType] = useState<'individual' | 'company'>('individual');
  const [providerUserType, setProviderUserType] = useState<'individual' | 'company'>('individual');

  const individualRequesterForm = useForm<IndividualSignupForm>({
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

  const individualProviderForm = useForm<IndividualSignupForm>({
    resolver: zodResolver(individualSignupSchema),
    mode: 'onBlur',
    defaultValues: {
      name: '', 
      email: '', 
      phone: '', 
      password: '', 
      confirmPassword: '',
      role: 'provider', 
      primaryCity: '',
    },
  });

  const companyRequesterForm = useForm<CompanySignupForm>({
    resolver: zodResolver(companySignupSchema),
    mode: 'onBlur',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'company',
      companyRole: 'requester',
      companyName: '',
      registrationNumber: '',
      taxNumber: '',
      physicalAddress: '',
      contactPerson: '',
      contactPosition: '',
      companyEmail: '',
      companyPhone: '',
      companyWebsite: '',
      industryType: '',
      numberOfEmployees: '',
      yearsInBusiness: '',
      primaryCity: '',
    },
  });

  const companyProviderForm = useForm<CompanySignupForm>({
    resolver: zodResolver(companySignupSchema),
    mode: 'onBlur',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'company',
      companyRole: 'provider',
      companyName: '',
      registrationNumber: '',
      taxNumber: '',
      physicalAddress: '',
      contactPerson: '',
      contactPosition: '',
      companyEmail: '',
      companyPhone: '',
      companyWebsite: '',
      industryType: '',
      numberOfEmployees: '',
      yearsInBusiness: '',
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

  const onSubmit = async (data: SignupData) => {
    setIsLoading(true);
    try {
      let payload: any = { ...data };

      // Determine the correct role based on tab and user type
      if (mainTab === 'supplier') {
        payload.role = 'supplier';
      } else if (mainTab === 'find-service') {
        if (requesterUserType === 'individual') {
          payload.role = 'requester';
        } else {
          payload.role = 'company';
          payload.companyRole = 'requester';
        }
      } else if (mainTab === 'provide-service') {
        if (providerUserType === 'individual') {
          payload.role = 'provider';
        } else {
          payload.role = 'company';
          payload.companyRole = 'provider';
        }
      }

      // Clean up primaryCity if empty or if user is a requester
      if (payload.role === 'requester' || (payload.role === 'company' && payload.companyRole === 'requester')) {
        delete payload.primaryCity;
      } else if (payload.role === 'provider' || (payload.role === 'company' && payload.companyRole === 'provider')) {
        if (!payload.primaryCity) {
          delete payload.primaryCity;
        }
      }

      // Convert company fields to proper types
      if (payload.role === 'company') {
        if (payload.numberOfEmployees) {
          payload.numberOfEmployees = parseInt(payload.numberOfEmployees);
        }
        if (payload.yearsInBusiness) {
          payload.yearsInBusiness = parseInt(payload.yearsInBusiness);
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

      if (result.requiresEmailVerification) {
        toast({
          title: 'Verify your email',
          description: 'Please check your email for a verification code.',
        });
        setLocation(`/verify-email?userId=${result.user.id}`);
        return;
      }

      toast({
        title: 'Account created!',
        description: `Welcome to JobTradeSasa${result.user.role === 'supplier' ? ', ' + payload.companyName : result.user.role === 'company' ? ', ' + payload.companyName : ''}.`,
      });

      setLocation(result.user.role === 'provider' || result.user.role === 'company' ? '/dashboard' : '/jobs');
    } catch (error: any) {
      let message = error.message || 'An unknown error occurred.';
      if (message.startsWith('400:')) {
        message = message.substring(message.indexOf(':') + 1).trim();
      }

      console.error('Signup error:', { message, error });

      toast({
        title: 'Signup failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMainTabChange = (newTab: 'find-service' | 'provide-service' | 'supplier') => {
    setMainTab(newTab);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-2xl border-2">
        <CardHeader className="space-y-4">
        <div className="flex justify-center">
  <img 
    src="/image.png" 
    alt="JobTradeSasa Logo" 
    className="h-14 w-auto object-contain"
  />
</div>

          <CardTitle className="text-2xl text-center">Create an Account</CardTitle>
          <CardDescription className="text-center">
            Join our community of service providers and requesters
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Main Tab Navigation */}
          <Tabs value={mainTab} onValueChange={(v) => handleMainTabChange(v as any)} className="mb-6">
            <TabsList className="grid w-full grid-cols-3 h-12">
              <TabsTrigger value="find-service" className="text-xs sm:text-sm">
                <UserCircle className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Find Service</span>
                <span className="sm:hidden">Find</span>
              </TabsTrigger>
              <TabsTrigger value="provide-service" className="text-xs sm:text-sm">
                <Wrench className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Provide Service</span>
                <span className="sm:hidden">Provide</span>
              </TabsTrigger>
              <TabsTrigger value="supplier" className="text-xs sm:text-sm">
                <ShoppingBag className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Supplier</span>
                <span className="sm:hidden">Supp.</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* Find Service Tab */}
          {mainTab === 'find-service' && (
            <>
              {requesterUserType === 'individual' ? (
                <IndividualForm 
                  form={individualRequesterForm}
                  selectedRole="requester"
                  isLoading={isLoading}
                  onSubmit={onSubmit}
                  userType={requesterUserType}
                  onUserTypeChange={setRequesterUserType}
                />
              ) : (
                <CompanyForm 
                  form={companyRequesterForm}
                  selectedCompanyRole="requester"
                  isLoading={isLoading}
                  onSubmit={onSubmit}
                />
              )}
            </>
          )}

          {/* Provide Service Tab */}
          {mainTab === 'provide-service' && (
            <>
              {providerUserType === 'individual' ? (
                <IndividualForm 
                  form={individualProviderForm}
                  selectedRole="provider"
                  isLoading={isLoading}
                  onSubmit={onSubmit}
                  userType={providerUserType}
                  onUserTypeChange={setProviderUserType}
                />
              ) : (
                <CompanyForm 
                  form={companyProviderForm}
                  selectedCompanyRole="provider"
                  isLoading={isLoading}
                  onSubmit={onSubmit}
                />
              )}
            </>
          )}

          {/* Supplier Tab */}
          {mainTab === 'supplier' && (
            <SupplierForm 
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
