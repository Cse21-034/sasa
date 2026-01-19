// client/src/pages/profile.tsx - ENHANCED WITH PHOTO UPLOAD & CATEGORIES & LOCATION MIGRATION

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { User, Mail, Phone, Loader2, Camera, Wrench, MapPin, Clock, CheckCircle, XCircle, Plus, Languages, AlertCircle, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { usePushNotification } from '@/hooks/use-push-notification';
import { useAuth } from '@/lib/auth-context';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useTranslation } from 'react-i18next';
import type { Category, ServiceAreaMigration, ProviderCategoryVerification } from '@shared/schema';
import PushNotificationTest from '@/components/push-notification-test';
   
    // In your profile page
   <PushNotificationTest />

// Botswana cities for migration request
const botswanaCities = [
  "Gaborone", "Francistown", "Maun", "Kasane", "Serowe",
  "Palapye", "Selebi-Phikwe", "Molepolole", "Kanye", "Lobatse",
  "Letlhakane", "Orapa", "Jwaneng", "Ghanzi", "Nata"
];

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  bio: z.string().optional(),
  profilePhotoUrl: z.string().optional(),
  preferredLanguage: z.string().default('en'),
  enableWebPushNotifications: z.boolean().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

// Migration request schema
const migrationRequestSchema = z.object({
  requestedCity: z.string().min(1, 'Please select a city'),
  reason: z.string().min(10, 'Please provide a reason for your request (at least 10 characters)'),
});

type MigrationRequestForm = z.infer<typeof migrationRequestSchema>;

// Category verification request schema
const categoryVerificationRequestSchema = z.object({
  categoryIds: z.array(z.number()).min(1, 'Please select at least one category'),
  documents: z.array(z.object({
    name: z.string(),
    url: z.string(),
  })).optional(),
});

type CategoryVerificationRequestForm = z.infer<typeof categoryVerificationRequestSchema>;

export default function Profile() {
  const { user, setUser } = useAuth();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { subscribeToPushNotifications, unsubscribeFromPushNotifications } = usePushNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(user?.profilePhotoUrl || null);
  const [migrationDialogOpen, setMigrationDialogOpen] = useState(false);
  const [categoryVerificationDialogOpen, setCategoryVerificationDialogOpen] = useState(false);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<{ name: string; url: string }[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);

  // Fetch categories for providers
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    enabled: user?.role === 'provider',
  });

  // Fetch provider profile for service categories
  const { data: providerProfile } = useQuery({
    queryKey: ['/api/provider/profile', user?.id],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/provider/profile');
      return response.json();
    },
    enabled: user?.role === 'provider',
  });

  // Fetch migration requests for providers
  const { data: migrations } = useQuery<ServiceAreaMigration[]>({
    queryKey: ['/api/provider/migrations'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/provider/migrations');
      return response.json();
    },
    enabled: user?.role === 'provider',
  });

  // Fetch category verifications for providers
  const { data: categoryVerifications } = useQuery<ProviderCategoryVerification[]>({
    queryKey: ['/api/provider/category-verifications'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/provider/category-verifications');
      return response.json();
    },
    enabled: user?.role === 'provider',
  });

  // Migration request form
  const migrationForm = useForm<MigrationRequestForm>({
    resolver: zodResolver(migrationRequestSchema),
    defaultValues: {
      requestedCity: '',
      reason: '',
    },
  });

  // Migration request mutation
  const migrationMutation = useMutation({
    mutationFn: async (data: MigrationRequestForm) => {
      const res = await apiRequest('POST', '/api/provider/migration-request', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/provider/migrations'] });
      setMigrationDialogOpen(false);
      migrationForm.reset();
      toast({
        title: 'Request Submitted',
        description: 'Your location migration request has been submitted for admin approval.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Request Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Category verification form
  const categoryVerificationForm = useForm<CategoryVerificationRequestForm>({
    resolver: zodResolver(categoryVerificationRequestSchema),
    defaultValues: {
      categoryIds: [],
      documents: [],
    },
  });

  const categoryVerificationMutation = useMutation({
    mutationFn: async (data: CategoryVerificationRequestForm) => {
      console.log('Starting category verification mutation with data:', data);
      if (!uploadedDocuments.length) {
        throw new Error('Please upload at least one document');
      }
      if (!selectedCategoryIds.length) {
        throw new Error('Please select at least one category');
      }
      // Submit for each selected category
      const promises = selectedCategoryIds.map(categoryId => {
        console.log(`Submitting document for category ID: ${categoryId}`);
        return apiRequest('POST', `/api/provider/category-verifications/${Number(categoryId)}/submit-documents`, {
          documents: uploadedDocuments,
        }).then(res => res.json());
      });
      const results = await Promise.all(promises);
      console.log('Mutation results:', results);
      return results[0]; // Return first result for toast message
    },
    onSuccess: () => {
      console.log('Mutation successful, invalidating queries...');
      queryClient.invalidateQueries({ queryKey: ['/api/provider/category-verifications'] });
      setCategoryVerificationDialogOpen(false);
      categoryVerificationForm.reset();
      setUploadedDocuments([]);
      setSelectedCategoryIds([]);
      toast({
        title: 'Verification Request Submitted',
        description: `Your category verification request(s) have been submitted for admin approval.`,
      });
    },
    onError: (error: Error) => {
      console.error('Mutation error:', error);
      toast({
        title: 'Request Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      profilePhotoUrl: user?.profilePhotoUrl || '',
      preferredLanguage: user?.preferredLanguage || 'en',
      enableWebPushNotifications: (user as any)?.enableWebPushNotifications ?? true,
    },
  });

  // Update form when user profile loads
  useState(() => {
    if (user?.preferredLanguage) {
      i18n.changeLanguage(user.preferredLanguage);
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      // Update user profile
      const res = await apiRequest('PATCH', '/api/profile', {
        name: data.name,
        phone: data.phone,
        bio: data.bio,
        profilePhotoUrl: data.profilePhotoUrl,
        preferredLanguage: data.preferredLanguage,
        enableWebPushNotifications: data.enableWebPushNotifications,
      });
      const updatedUser = await res.json();

      // Update local i18n language immediately
      i18n.changeLanguage(data.preferredLanguage);

      // Handle push notification subscription state change
      if (data.enableWebPushNotifications) {
        try {
          const subscribed = await subscribeToPushNotifications();
          if (!subscribed) {
            console.log('User did not grant notification permissions or browser does not support push notifications');
          }
        } catch (error) {
          console.error('Error subscribing to push notifications:', error);
        }
      } else {
        try {
          await unsubscribeFromPushNotifications();
        } catch (error) {
          console.error('Error unsubscribing from push notifications:', error);
        }
      }

      return updatedUser;
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      localStorage.setItem('i18nextLng', updatedUser.preferredLanguage);
      queryClient.invalidateQueries({ queryKey: ['/api/provider/profile'] });
      toast({
        title: t('Profile updated'),
        description: t('Your profile has been updated successfully.'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle photo upload with base64 encoding
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5MB.',
        variant: 'destructive',
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file.',
        variant: 'destructive',
      });
      return;
    }

    setUploadingPhoto(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setPhotoPreview(base64String);
      form.setValue('profilePhotoUrl', base64String);
      setUploadingPhoto(false);
      
      toast({
        title: 'Photo selected',
        description: 'Click "Save Changes" to update your profile picture.',
      });
    };
    reader.onerror = () => {
      setUploadingPhoto(false);
      toast({
        title: 'Upload failed',
        description: 'Failed to read the image file.',
        variant: 'destructive',
      });
    };
    reader.readAsDataURL(file);
  };

  // Handle document upload for category verification
  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploadingDocuments(true);

    // Process all files
    const fileProcessingPromises = files.map((file) => {
      return new Promise<{ name: string; url: string }>((resolve, reject) => {
        // Check file size (max 10MB per file)
        if (file.size > 10 * 1024 * 1024) {
          reject(new Error(`${file.name} is too large. Max 10MB per file.`));
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const base64String = event.target?.result as string;
          resolve({
            name: file.name,
            url: base64String,
          });
        };
        reader.onerror = () => {
          reject(new Error(`Failed to read ${file.name}`));
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(fileProcessingPromises)
      .then((newDocs) => {
        setUploadedDocuments([...uploadedDocuments, ...newDocs]);
        setUploadingDocuments(false);
        toast({
          title: 'Documents uploaded',
          description: `${newDocs.length} document(s) ready to submit.`,
        });
      })
      .catch((error) => {
        setUploadingDocuments(false);
        toast({
          title: 'Upload failed',
          description: error.message,
          variant: 'destructive',
        });
      });
  };

  const onSubmit = (data: ProfileForm) => {
    mutation.mutate(data);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card className="">
        <CardHeader>
          <CardTitle className="text-3xl">{t('Profile Settings')}</CardTitle>
          <CardDescription>{t('Manage your account information')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-8 flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-primary">
                <AvatarImage src={photoPreview || user?.profilePhotoUrl || undefined} />
                <AvatarFallback className="text-4xl">{user?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                className="absolute bottom-0 right-0 rounded-full h-10 w-10"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                data-testid="button-upload-photo"
              >
                {uploadingPhoto ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Camera className="h-5 w-5" />
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
            <div className="text-center">
              <p className="font-semibold text-lg">{user?.name}</p>
              <p className="text-sm text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Full Name')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          className="pl-10 h-12"
                          placeholder="John Doe"
                          data-testid="input-name"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>{t('Email')}</FormLabel>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    className="pl-10 h-12"
                    value={user?.email}
                    disabled
                    data-testid="input-email-disabled"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{t('Email cannot be changed')}</p>
              </div>

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Phone Number')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          className="pl-10 h-12"
                          type="tel"
                          placeholder="+267 12345678"
                          data-testid="input-phone"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Bio')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about yourself..."
                        className="min-h-24"
                        data-testid="input-bio"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferredLanguage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Language Settings')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12">
                          <div className="flex items-center gap-2">
                            <Languages className="h-5 w-5 text-muted-foreground" />
                            <SelectValue placeholder={t('Select your preferred language')} />
                          </div>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="en">{t('English')}</SelectItem>
                        <SelectItem value="tn">{t('Setswana')}</SelectItem>
                        <SelectItem value="fr">{t('French')}</SelectItem>
                        <SelectItem value="es">{t('Spanish')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {t('Select your preferred language')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enableWebPushNotifications"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base cursor-pointer flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        {t('Push Notifications')}
                      </FormLabel>
                      <FormDescription>
                        {t('Receive notifications about messages and job updates even when the app is closed')}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-push-notifications"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />


              {/* Service Areas for Providers */}
              {user?.role === 'provider' && providerProfile && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <FormLabel className="text-base flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Service Areas
                      </FormLabel>
                      <FormDescription>
                        Cities where you can accept jobs. Request to work in new locations.
                      </FormDescription>
                    </div>
                    <Dialog open={migrationDialogOpen} onOpenChange={setMigrationDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" data-testid="button-request-location">
                          <Plus className="h-4 w-4 mr-2" />
                          Request New Location
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Request Location Migration</DialogTitle>
                          <DialogDescription>
                            Request approval to work in a new city. An admin will review your request.
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...migrationForm}>
                          <form onSubmit={migrationForm.handleSubmit((data) => migrationMutation.mutate(data))} className="space-y-4">
                            <FormField
                              control={migrationForm.control}
                              name="requestedCity"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Select City</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-migration-city">
                                        <SelectValue placeholder="Choose a city" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {botswanaCities
                                        .filter(city => {
                                          const approved = (providerProfile?.approvedServiceAreas as string[]) || [];
                                          return !approved.includes(city) && city !== providerProfile?.primaryCity;
                                        })
                                        .map((city) => (
                                          <SelectItem key={city} value={city}>
                                            {city}
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={migrationForm.control}
                              name="reason"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Reason for Request</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Explain why you want to work in this location..."
                                      className="min-h-20"
                                      data-testid="input-migration-reason"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <DialogFooter>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setMigrationDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="submit"
                                disabled={migrationMutation.isPending}
                                data-testid="button-submit-migration"
                              >
                                {migrationMutation.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting...
                                  </>
                                ) : (
                                  'Submit Request'
                                )}
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Current Approved Areas */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default" className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {providerProfile.primaryCity} (Primary)
                    </Badge>
                    {(providerProfile.approvedServiceAreas as string[] || [])
                      .filter((city: string) => city !== providerProfile.primaryCity)
                      .map((city: string) => (
                        <Badge key={city} variant="secondary" className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {city}
                        </Badge>
                      ))}
                  </div>

                  {/* Migration Requests History */}
                  <div className="space-y-2" data-testid="migration-requests-section">
                    <p className="text-sm font-medium text-muted-foreground">Migration Requests</p>
                    {!migrations ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                      </div>
                    ) : migrations.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2" data-testid="text-no-migrations">
                        No migration requests yet. Request a new location to expand your service area.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {migrations.map((migration) => (
                          <div
                            key={migration.id}
                            className="flex items-center justify-between gap-4 p-3 rounded-md border bg-muted/30"
                            data-testid={`card-migration-${migration.id}`}
                          >
                            <div className="flex items-center gap-3">
                              {migration.status === 'pending' && (
                                <Clock className="h-4 w-4 text-yellow-500" />
                              )}
                              {migration.status === 'approved' && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                              {migration.status === 'rejected' && (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              <div>
                                <p className="text-sm font-medium" data-testid={`text-migration-city-${migration.id}`}>
                                  {migration.requestedCity}
                                </p>
                                <p className="text-xs text-muted-foreground" data-testid={`text-migration-date-${migration.id}`}>
                                  {new Date(migration.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant={
                                migration.status === 'approved'
                                  ? 'default'
                                  : migration.status === 'rejected'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                              data-testid={`badge-migration-status-${migration.id}`}
                            >
                              {migration.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Category Verifications for Providers */}
              {user?.role === 'provider' && categories && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <FormLabel className="text-base flex items-center gap-2">
                        <Wrench className="h-5 w-5" />
                        Category Verifications
                      </FormLabel>
                      <FormDescription>
                        Categories you are verified to work in. Request verification for new categories.
                      </FormDescription>
                    </div>
                    <Dialog open={categoryVerificationDialogOpen} onOpenChange={setCategoryVerificationDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" data-testid="button-request-category">
                          <Plus className="h-4 w-4 mr-2" />
                          Request New Category
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Request Category Verification</DialogTitle>
                          <DialogDescription>
                            Select a category and upload documents for verification. An admin will review your request.
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...categoryVerificationForm}>
                          <form onSubmit={categoryVerificationForm.handleSubmit((data) => categoryVerificationMutation.mutate(data))} className="space-y-4">
                            <FormItem>
                              <FormLabel>Select Categories</FormLabel>
                              <FormDescription>
                                Select one or more categories you want to get verified for.
                              </FormDescription>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                                {categories
                                  .filter(category => {
                                    // Exclude categories already verified or pending
                                    const verificationExists = categoryVerifications?.some(
                                      v => v.categoryId === category.id
                                    );
                                    return !verificationExists;
                                  })
                                  .map((category) => (
                                    <label key={category.id} className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={selectedCategoryIds.includes(Number(category.id))}
                                        onChange={(e) => {
                                          const categoryId = Number(category.id);
                                          if (e.target.checked) {
                                            setSelectedCategoryIds(prev => [...prev, categoryId]);
                                          } else {
                                            setSelectedCategoryIds(prev => prev.filter(id => id !== categoryId));
                                          }
                                        }}
                                        className="w-4 h-4"
                                      />
                                      <span className="text-sm">{category.name}</span>
                                    </label>
                                  ))}
                              </div>
                              {selectedCategoryIds.length === 0 && (
                                <p className="text-sm text-red-500 mt-2">Please select at least one category</p>
                              )}
                            </FormItem>

                            <div className="space-y-2">
                              <FormLabel>Upload Verification Documents</FormLabel>
                              <FormDescription>
                                Upload documents that verify your qualifications for this category (certificates, licenses, etc.). Max 10MB per file.
                              </FormDescription>
                              <div className="flex items-center gap-2">
                                <input
                                  type="file"
                                  multiple
                                  onChange={handleDocumentUpload}
                                  disabled={uploadingDocuments || categoryVerificationMutation.isPending}
                                  className="block w-full text-sm text-muted-foreground
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-md file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-primary file:text-primary-foreground
                                    hover:file:bg-primary/90
                                    cursor-pointer"
                                  data-testid="input-category-documents"
                                />
                                {uploadingDocuments && (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                )}
                              </div>
                            </div>

                            {uploadedDocuments.length > 0 && (
                              <div className="space-y-2">
                                <FormLabel>Uploaded Documents ({uploadedDocuments.length})</FormLabel>
                                <div className="space-y-2">
                                  {uploadedDocuments.map((doc, index) => (
                                    <div key={index} className="flex items-center justify-between gap-2 p-2 rounded-md border bg-muted/30">
                                      <span className="text-sm truncate">{doc.name}</span>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setUploadedDocuments(uploadedDocuments.filter((_, i) => i !== index));
                                        }}
                                        disabled={categoryVerificationMutation.isPending}
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <DialogFooter>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setCategoryVerificationDialogOpen(false);
                                  setUploadedDocuments([]);
                                  setSelectedCategoryIds([]);
                                  categoryVerificationForm.reset();
                                }}
                                disabled={categoryVerificationMutation.isPending}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                disabled={categoryVerificationMutation.isPending || uploadedDocuments.length === 0 || selectedCategoryIds.length === 0}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('Submit button clicked, category IDs:', selectedCategoryIds);
                                  categoryVerificationMutation.mutate({ categoryIds: selectedCategoryIds });
                                }}
                                data-testid="button-submit-category"
                              >
                                {categoryVerificationMutation.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting...
                                  </>
                                ) : (
                                  `Submit Request${selectedCategoryIds.length > 1 ? 's' : ''}`
                                )}
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Current Approved Categories */}
                  {categoryVerifications && categoryVerifications.length > 0 && (
                    <>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Verified Categories</p>
                        <div className="flex flex-wrap gap-2">
                          {categoryVerifications
                            .filter((v) => v.status === 'approved')
                            .map((verification) => {
                              const category = categories.find(c => c.id === verification.categoryId);
                              return (
                                <Badge key={verification.id} variant="default" className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  {category?.name || 'Unknown'}
                                </Badge>
                              );
                            })}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Category Verification Requests History */}
                  <div className="space-y-2" data-testid="category-verifications-section">
                    <p className="text-sm font-medium text-muted-foreground">Verification Requests</p>
                    {!categoryVerifications ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                      </div>
                    ) : categoryVerifications.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2" data-testid="text-no-categories">
                        No verification requests yet. Request a new category to expand your services.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {categoryVerifications.map((verification) => {
                          const category = categories.find(c => c.id === verification.categoryId);
                          return (
                            <div
                              key={verification.id}
                              className="flex items-center justify-between gap-4 p-3 rounded-md border bg-muted/30"
                              data-testid={`card-category-${verification.id}`}
                            >
                              <div className="flex items-center gap-3">
                                {verification.status === 'pending' && (
                                  <Clock className="h-4 w-4 text-yellow-500" />
                                )}
                                {verification.status === 'approved' && (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                )}
                                {verification.status === 'rejected' && (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                )}
                                <div>
                                  <p className="text-sm font-medium" data-testid={`text-category-name-${verification.id}`}>
                                    {category?.name || 'Unknown Category'}
                                  </p>
                                  <p className="text-xs text-muted-foreground" data-testid={`text-category-date-${verification.id}`}>
                                    {new Date(verification.createdAt).toLocaleDateString()}
                                  </p>
                                  {verification.status === 'rejected' && verification.rejectionReason && (
                                    <p className="text-xs text-red-600 mt-1">
                                      Reason: {verification.rejectionReason}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <Badge
                                variant={
                                  verification.status === 'approved'
                                    ? 'default'
                                    : verification.status === 'rejected'
                                    ? 'destructive'
                                    : 'secondary'
                                }
                                data-testid={`badge-category-status-${verification.id}`}
                              >
                                {verification.status}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-12"
                  onClick={() => {
                    form.reset();
                    setPhotoPreview(user?.profilePhotoUrl || null);
                  }}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-12"
                  disabled={mutation.isPending}
                  data-testid="button-save"
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
