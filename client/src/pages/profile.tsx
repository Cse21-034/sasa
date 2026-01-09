// client/src/pages/profile.tsx - ENHANCED WITH PHOTO UPLOAD & CATEGORIES & LOCATION MIGRATION

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { User, Mail, Phone, Loader2, Camera, Wrench, MapPin, Clock, CheckCircle, XCircle, Plus, Languages } from 'lucide-react';
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
import { useAuth } from '@/lib/auth-context';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useTranslation } from 'react-i18next';
import type { Category, ServiceAreaMigration } from '@shared/schema';

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
  serviceCategories: z.array(z.number()).optional(),
  preferredLanguage: z.string().default('en'),
});

type ProfileForm = z.infer<typeof profileSchema>;

// Migration request schema
const migrationRequestSchema = z.object({
  requestedCity: z.string().min(1, 'Please select a city'),
  reason: z.string().min(10, 'Please provide a reason for your request (at least 10 characters)'),
});

type MigrationRequestForm = z.infer<typeof migrationRequestSchema>;

export default function Profile() {
  const { user, setUser } = useAuth();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(user?.profilePhotoUrl || null);
  const [migrationDialogOpen, setMigrationDialogOpen] = useState(false);

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

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      profilePhotoUrl: user?.profilePhotoUrl || '',
      serviceCategories: providerProfile?.serviceCategories || [],
      preferredLanguage: user?.preferredLanguage || 'en',
    },
  });

  // Update form when provider profile loads
  useState(() => {
    if (providerProfile?.serviceCategories) {
      form.setValue('serviceCategories', providerProfile.serviceCategories);
    }
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
      });
      const updatedUser = await res.json();

      // Update local i18n language immediately
      i18n.changeLanguage(data.preferredLanguage);

      // If provider, update service categories
      if (user?.role === 'provider' && data.serviceCategories) {
        await apiRequest('PATCH', '/api/provider/categories', {
          serviceCategories: data.serviceCategories,
        });
      }

      return updatedUser;
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      queryClient.invalidateQueries({ queryKey: ['/api/provider/profile'] });
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
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

  const onSubmit = (data: ProfileForm) => {
    mutation.mutate(data);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card className="border-2">
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

              {/* Service Categories for Providers */}
              {user?.role === 'provider' && categories && (
                <FormField
                  control={form.control}
                  name="serviceCategories"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-base flex items-center gap-2">
                          <Wrench className="h-5 w-5" />
                          {t('Service Categories')}
                        </FormLabel>
                        <FormDescription>
                          Select the types of jobs you want to receive. Only jobs in these categories will be shown to you.
                        </FormDescription>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {categories.map((category) => (
                          <FormField
                            key={category.id}
                            control={form.control}
                            name="serviceCategories"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={category.id}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(category.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), category.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== category.id
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    {category.name}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

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
