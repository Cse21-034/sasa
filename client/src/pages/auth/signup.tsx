// client/src/pages/auth/signup.tsx - FINAL CORRECTED VERSION

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Briefcase, Loader2, UserCircle, Wrench, Building2, MapPin, User, Truck } from 'lucide-react';
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

// INDIVIDUAL FIND SERVICE FORM
const IndividualFindServiceForm = ({ form, isLoading }: { 
  form: UseFormReturn<IndividualSignupForm>; 
  isLoading: boolean;
}) => (
  <Form {...form}>
    <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
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

      <div className="grid grid-cols-2 gap-4">
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
      </div>

      <div className="grid grid-cols-2 gap-4">
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
      </div>
    </form>
  </Form>
);

// INDIVIDUAL PROVIDE SERVICE FORM
const IndividualProvideServiceForm = ({ form, isLoading }: { 
  form: UseFormReturn<IndividualSignupForm>; 
  isLoading: boolean;
}) => (
  <Form {...form}>
    <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
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

      <div className="grid grid-cols-2 gap-4">
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
      </div>

      <div className="grid grid-cols-2 gap-4">
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
      </div>
    </form>
  </Form>
);

// COMPANY FIND SERVICE FORM
const CompanyFindServiceForm = ({ form, isLoading }: { 
  form: UseFormReturn<CompanySignupForm>; 
  isLoading: boolean;
}) => (
  <Form {...form}>
    <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
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

      <div className="grid grid-cols-2 gap-4">
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
      </div>
    </form>
  </Form>
);

// COMPANY PROVIDE SERVICE FORM
const CompanyProvideServiceForm = ({ form, isLoading }: { 
  form: UseFormReturn<CompanySignupForm>; 
  isLoading: boolean;
}) => (
  <Form {...form}>
    <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
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

      <div className="grid grid-cols-2 gap-4">
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
      </div>
    </form>
  </Form>
);

// SUPPLIER FORM
const SupplierForm = ({ form, isLoading }: { 
  form: UseFormReturn<SupplierSignupForm>; 
  isLoading: boolean;
}) => (
  <Form {...form}>
    <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
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

      <div className="grid grid-cols-2 gap-4">
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
      </div>
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
  const [registerType, setRegisterType] = useState<'individual' | 'company'>('individual');

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

  const companyForm = useForm<CompanySignupForm>({
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
  
  // Handle main tab change
  const handleMainTabChange = (tab: 'find-service' | 'provide-service' | 'supplier') => {
    setMainTab(tab);
    setRegisterType('individual');
    
    // Reset forms when switching tabs
    if (tab === 'find-service') {
      individualForm.reset({
        name: '', 
        email: '', 
        phone: '', 
        password: '', 
        confirmPassword: '',
        role: 'requester', 
        primaryCity: '',
      });
      companyForm.reset({
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
      });
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
    } else if (tab === 'provide-service') {
      individualForm.reset({
        name: '', 
        email: '', 
        phone: '', 
        password: '', 
        confirmPassword: '',
        role: 'provider', 
        primaryCity: '',
      });
      companyForm.reset({
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
      });
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
    } else if (tab === 'supplier') {
      individualForm.reset({
        name: '', 
        email: '', 
        phone: '', 
        password: '', 
        confirmPassword: '',
        role: 'requester', 
        primaryCity: '',
      });
      companyForm.reset({
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
      });
    }
  };

  // Handle register type change (individual/company)
  const handleRegisterTypeChange = (type: 'individual' | 'company') => {
    setRegisterType(type);
    
    // Reset appropriate form
    if (type === 'individual') {
      if (mainTab === 'find-service') {
        individualForm.setValue('role', 'requester');
      } else if (mainTab === 'provide-service') {
        individualForm.setValue('role', 'provider');
      }
      companyForm.reset({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'company',
        companyRole: mainTab === 'find-service' ? 'requester' : 'provider',
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
      });
    } else if (type === 'company') {
      individualForm.reset({
        name: '', 
        email: '', 
        phone: '', 
        password: '', 
        confirmPassword: '',
        role: mainTab === 'find-service' ? 'requester' : 'provider', 
        primaryCity: '',
      });
      if (mainTab === 'find-service') {
        companyForm.setValue('companyRole', 'requester');
      } else if (mainTab === 'provide-service') {
        companyForm.setValue('companyRole', 'provider');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      let formData: any;
      let accountType: 'individual' | 'organization' | 'company' = 'individual';
      
      if (mainTab === 'supplier') {
        accountType = 'organization';
        const result = await supplierForm.trigger();
        if (!result) {
          setIsLoading(false);
          return;
        }
        formData = supplierForm.getValues();
      } else if (registerType === 'individual') {
        accountType = 'individual';
        const result = await individualForm.trigger();
        if (!result) {
          setIsLoading(false);
          return;
        }
        formData = individualForm.getValues();
      } else {
        accountType = 'company';
        const result = await companyForm.trigger();
        if (!result) {
          setIsLoading(false);
          return;
        }
        formData = companyForm.getValues();
      }

      let payload: any = {
        ...formData,
        role: accountType === 'organization' ? 'supplier' : accountType === 'company' ? 'company' : formData.role,
      };

      // Remove primaryCity if it's empty or if user is a requester
      if (accountType === 'individual') {
        // For Find Service (requester), remove primaryCity
        if (mainTab === 'find-service') {
          delete payload.primaryCity;
        }
      }

      // Convert company fields to proper types
      if (accountType === 'company') {
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
        description: `Welcome to JobTradeSasa${result.user.role === 'supplier' ? ', ' + formData.companyName : result.user.role === 'company' ? ', ' + formData.companyName : ''}.`,
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

  // Get submit button text based on current selection
  const getSubmitButtonText = () => {
    if (mainTab === 'supplier') return 'Create Supplier Account';
    if (mainTab === 'find-service') {
      return registerType === 'individual' ? 'Create Individual Account' : 'Create Company Account';
    }
    if (mainTab === 'provide-service') {
      return registerType === 'individual' ? 'Create Service Provider Account' : 'Create Service Company Account';
    }
    return 'Create Account';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
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
          {/* Main Tabs */}
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
                <Truck className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Supplier</span>
                <span className="sm:hidden">Supp.</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Register Type Selection for Find Service and Provide Service */}
          {(mainTab === 'find-service' || mainTab === 'provide-service') && (
            <div className="mb-6 space-y-4">
              <FormLabel>Register as</FormLabel>
              <RadioGroup
                value={registerType}
                onValueChange={(value) => handleRegisterTypeChange(value as 'individual' | 'company')}
                className="grid grid-cols-2 gap-4"
              >
                <label
                  htmlFor={`individual-${mainTab}`}
                  className={`flex flex-col items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover-elevate transition-all ${
                    registerType === 'individual' ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <RadioGroupItem value="individual" id={`individual-${mainTab}`} className="sr-only" />
                  <User className="h-8 w-8" />
                  <span className="font-medium text-sm">Individual</span>
                  <span className="text-xs text-muted-foreground text-center">
                    {mainTab === 'find-service' 
                      ? 'Register as an individual' 
                      : 'Register as an individual service provider'}
                  </span>
                </label>
                <label
                  htmlFor={`company-${mainTab}`}
                  className={`flex flex-col items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover-elevate transition-all ${
                    registerType === 'company' ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <RadioGroupItem value="company" id={`company-${mainTab}`} className="sr-only" />
                  <Building2 className="h-8 w-8" />
                  <span className="font-medium text-sm">Company</span>
                  <span className="text-xs text-muted-foreground text-center">
                    {mainTab === 'find-service'
                      ? 'Register as a company'
                      : 'Register as a company service provider'}
                  </span>
                </label>
              </RadioGroup>
            </div>
          )}

          {/* Show forms based on selection */}
          <div>
            {mainTab === 'find-service' && registerType === 'individual' && (
              <IndividualFindServiceForm form={individualForm} isLoading={isLoading} />
            )}
            
            {mainTab === 'find-service' && registerType === 'company' && (
              <CompanyFindServiceForm form={companyForm} isLoading={isLoading} />
            )}
            
            {mainTab === 'provide-service' && registerType === 'individual' && (
              <IndividualProvideServiceForm form={individualForm} isLoading={isLoading} />
            )}
            
            {mainTab === 'provide-service' && registerType === 'company' && (
              <CompanyProvideServiceForm form={companyForm} isLoading={isLoading} />
            )}
            
            {mainTab === 'supplier' && (
              <SupplierForm form={supplierForm} isLoading={isLoading} />
            )}
          </div>

          {/* Form Description for Company Forms */}
          {(mainTab === 'find-service' || mainTab === 'provide-service') && registerType === 'company' && (
            <FormDescription className="text-sm mt-4">
              Your documents will need to be verified before you can {mainTab === 'find-service' ? 'post jobs' : 'provide services'}. Verification typically takes 24-48 hours.
            </FormDescription>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            className="w-full h-12 mt-6"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              getSubmitButtonText()
            )}
          </Button>

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
