import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Building2, Loader2, Globe, Facebook, Instagram, Twitter, MessageCircle, Camera, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { uploadToCloudinary } from '@/lib/cloudinary';

const supplierProfileSchema = z.object({
  websiteUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  facebookUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  instagramUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  twitterUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  whatsappNumber: z.string().optional(),
  aboutUs: z.string().optional(),
  specialOffer: z.string().optional(),
});

type SupplierProfileForm = z.infer<typeof supplierProfileSchema>;

function invalidateCaches() {
  queryClient.invalidateQueries({ queryKey: ['supplierProfile'] });
  queryClient.invalidateQueries({ queryKey: ['suppliers'] });
  queryClient.invalidateQueries({ queryKey: ['public-suppliers'] });
}

export default function SupplierSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  const { data: supplier, isLoading } = useQuery({
    queryKey: ['supplierProfile'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/supplier/profile`);
      return response.json();
    },
  });

  const form = useForm<SupplierProfileForm>({
    resolver: zodResolver(supplierProfileSchema),
    defaultValues: {
      websiteUrl: '',
      facebookUrl: '',
      instagramUrl: '',
      twitterUrl: '',
      whatsappNumber: '',
      aboutUs: '',
      specialOffer: '',
    },
  });

  React.useEffect(() => {
    if (supplier) {
      form.reset({
        websiteUrl: supplier?.websiteUrl || '',
        facebookUrl: supplier?.facebookUrl || '',
        instagramUrl: supplier?.instagramUrl || '',
        twitterUrl: supplier?.twitterUrl || '',
        whatsappNumber: supplier?.whatsappNumber || '',
        aboutUs: supplier?.aboutUs || '',
        specialOffer: supplier?.specialOffer || '',
      });
    }
  }, [supplier, form]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Logo must be under 5MB', variant: 'destructive' });
      return;
    }

    setLogoUploading(true);
    try {
      const result = await uploadToCloudinary(file, {
        folder: `supplier-logos/${user?.id}`,
        width: 400,
        height: 400,
        crop: 'pad',
        background: 'white',
        quality: 'auto',
        format: 'png',
      });

      await apiRequest('PATCH', '/api/supplier/profile', { logo: result.url });
      invalidateCaches();
      toast({ title: 'Logo updated', description: 'Your business logo has been saved.' });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setLogoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: SupplierProfileForm) => {
      const response = await apiRequest('PATCH', '/api/supplier/profile', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Profile updated',
        description: 'Your business profile has been updated successfully.',
      });
      invalidateCaches();
    },
    onError: (error: any) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: SupplierProfileForm) => {
    mutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Building2 className="h-7 w-7" />
          Business Profile Settings
        </h1>
        <p className="text-muted-foreground">Update your business information and social media links</p>
      </div>

      {/* Logo Upload Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Business Logo</CardTitle>
          <CardDescription>
            Your logo appears on supplier cards, promotions, and the navigation bar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            {/* Preview */}
            <div className="w-24 h-24 rounded-2xl border-2 border-border bg-muted/40 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {logoUploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : supplier?.logo ? (
                <img
                  src={supplier.logo}
                  alt="Business logo"
                  className="w-full h-full object-contain p-2"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/supplier-logo-fallback.png'; }}
                />
              ) : (
                <Building2 className="h-10 w-10 text-muted-foreground" />
              )}
            </div>

            {/* Upload controls */}
            <div className="flex-1 space-y-3">
              <p className="text-sm text-muted-foreground">
                {supplier?.logo
                  ? 'Your logo is set. Upload a new one to replace it.'
                  : 'No logo uploaded yet. Add your company logo to stand out.'}
              </p>
              <div className="flex gap-3 flex-wrap">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={logoUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  {logoUploading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
                  ) : (
                    <><Upload className="h-4 w-4" /> Upload Logo</>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">PNG, JPG or WebP · Max 5MB · Recommended: square format</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About Your Business</CardTitle>
              <CardDescription>Help customers learn more about your company</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="aboutUs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>About Us</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell customers about your business, services, and what makes you unique..."
                        className="min-h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="specialOffer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Special Offer (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., 10% off first purchase, Free delivery over P500"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This will be displayed prominently on your profile
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact & Social Media</CardTitle>
              <CardDescription>Make it easy for customers to reach you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="websiteUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Website URL
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="https://yourcompany.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="whatsappNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp Number
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="+267 12345678" {...field} />
                    </FormControl>
                    <FormDescription>Include country code (e.g., +267 for Botswana)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="facebookUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Facebook className="h-4 w-4" />
                      Facebook Page
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="https://facebook.com/yourpage" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="instagramUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Instagram className="h-4 w-4" />
                      Instagram Profile
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="https://instagram.com/yourprofile" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="twitterUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Twitter className="h-4 w-4" />
                      Twitter/X Profile
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="https://twitter.com/yourprofile" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-12"
              onClick={() => form.reset()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 h-12"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
