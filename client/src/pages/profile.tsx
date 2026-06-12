import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Mail, Phone, Loader2, Camera, Wrench, MapPin, Clock,
  CheckCircle, XCircle, Plus, Languages, Bell, Pencil, Star,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form, FormControl, FormField, FormItem, FormLabel,
  FormMessage, FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { usePushNotification } from '@/hooks/use-push-notification';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { useAuth } from '@/lib/auth-context';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useTranslation } from 'react-i18next';
import type { Category, ServiceAreaMigration, ProviderCategoryVerification } from '@shared/schema';

const botswanaCities = [
  'Gaborone', 'Francistown', 'Maun', 'Kasane', 'Serowe',
  'Palapye', 'Selebi-Phikwe', 'Molepolole', 'Kanye', 'Lobatse',
  'Letlhakane', 'Orapa', 'Jwaneng', 'Ghanzi', 'Nata',
];

const LANGUAGES: Record<string, string> = {
  en: 'English', tn: 'Setswana', fr: 'French', es: 'Spanish',
};

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  bio: z.string().optional(),
  profilePhotoUrl: z.string().optional(),
  preferredLanguage: z.string().default('en'),
  enableWebPushNotifications: z.boolean().optional(),
});
type ProfileForm = z.infer<typeof profileSchema>;

const migrationRequestSchema = z.object({
  requestedCity: z.string().min(1, 'Please select a city'),
  reason: z.string().min(10, 'Please provide a reason (at least 10 characters)'),
});
type MigrationRequestForm = z.infer<typeof migrationRequestSchema>;

const categoryVerificationRequestSchema = z.object({
  categoryIds: z.array(z.number()).min(1, 'Please select at least one category'),
  documents: z.array(z.object({ name: z.string(), url: z.string() })).optional(),
});
type CategoryVerificationRequestForm = z.infer<typeof categoryVerificationRequestSchema>;

export default function Profile() {
  const { user, setUser, refreshAuth } = useAuth();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { subscribeToPushNotifications, unsubscribeFromPushNotifications } = usePushNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadingPhoto, setUploadingPhoto]   = useState(false);
  const [photoPreview, setPhotoPreview]       = useState<string | null>(user?.profilePhotoUrl || null);
  const [isEditing, setIsEditing]             = useState(false);
  const [migrationDialogOpen, setMigrationDialogOpen]                     = useState(false);
  const [categoryVerificationDialogOpen, setCategoryVerificationDialogOpen] = useState(false);
  const [uploadingDocuments, setUploadingDocuments]   = useState(false);
  const [uploadedDocuments, setUploadedDocuments]     = useState<{ name: string; url: string }[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    enabled: user?.role === 'provider',
  });

  const { data: providerProfile } = useQuery({
    queryKey: ['/api/provider/profile', user?.id],
    queryFn: async () => (await apiRequest('GET', '/api/provider/profile')).json(),
    enabled: user?.role === 'provider',
  });

  const { data: providerStats } = useQuery({
    queryKey: ['/api/provider/stats'],
    enabled: user?.role === 'provider',
  });

  const { data: migrations } = useQuery<ServiceAreaMigration[]>({
    queryKey: ['/api/provider/migrations'],
    queryFn: async () => (await apiRequest('GET', '/api/provider/migrations')).json(),
    enabled: user?.role === 'provider',
  });

  const { data: categoryVerifications } = useQuery<ProviderCategoryVerification[]>({
    queryKey: ['/api/provider/category-verifications'],
    queryFn: async () => (await apiRequest('GET', '/api/provider/category-verifications')).json(),
    enabled: user?.role === 'provider',
  });

  // ── Forms ──────────────────────────────────────────────────────────────────
  const migrationForm = useForm<MigrationRequestForm>({
    resolver: zodResolver(migrationRequestSchema),
    defaultValues: { requestedCity: '', reason: '' },
  });

  const categoryVerificationForm = useForm<CategoryVerificationRequestForm>({
    resolver: zodResolver(categoryVerificationRequestSchema),
    defaultValues: { categoryIds: [], documents: [] },
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

  // ── Mutations ──────────────────────────────────────────────────────────────
  const migrationMutation = useMutation({
    mutationFn: async (data: MigrationRequestForm) =>
      (await apiRequest('POST', '/api/provider/migration-request', data)).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/provider/migrations'] });
      setMigrationDialogOpen(false);
      migrationForm.reset();
      toast({ title: 'Request Submitted', description: 'Location migration request submitted for admin approval.' });
    },
    onError: (e: Error) => toast({ title: 'Request Failed', description: e.message, variant: 'destructive' }),
  });

  const categoryVerificationMutation = useMutation({
    mutationFn: async (_: CategoryVerificationRequestForm) => {
      if (!uploadedDocuments.length)   throw new Error('Please upload at least one document');
      if (!selectedCategoryIds.length) throw new Error('Please select at least one category');
      const results = await Promise.all(
        selectedCategoryIds.map(id =>
          apiRequest('POST', `/api/provider/category-verifications/${id}/submit-documents`, {
            documents: uploadedDocuments,
          }).then(r => r.json())
        )
      );
      return results[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/provider/category-verifications'] });
      setCategoryVerificationDialogOpen(false);
      categoryVerificationForm.reset();
      setUploadedDocuments([]);
      setSelectedCategoryIds([]);
      toast({ title: 'Verification Request Submitted', description: 'Category verification submitted for admin approval.' });
    },
    onError: (e: Error) => toast({ title: 'Request Failed', description: e.message, variant: 'destructive' }),
  });

  const mutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const res = await apiRequest('PATCH', '/api/profile', {
        name: data.name, phone: data.phone, bio: data.bio,
        profilePhotoUrl: data.profilePhotoUrl,
        preferredLanguage: data.preferredLanguage,
        enableWebPushNotifications: data.enableWebPushNotifications,
      });
      const updated = await res.json();
      i18n.changeLanguage(data.preferredLanguage);
      if (data.enableWebPushNotifications) {
        try { await subscribeToPushNotifications(); } catch {}
      } else {
        try { await unsubscribeFromPushNotifications(); } catch {}
      }
      return updated;
    },
    onSuccess: (updated) => {
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      localStorage.setItem('i18nextLng', updated.preferredLanguage);
      refreshAuth();
      queryClient.invalidateQueries({ queryKey: ['/api/provider/profile'] });
      setIsEditing(false);
      toast({ title: t('Profile updated'), description: t('Your profile has been updated successfully.') });
    },
    onError: (e: Error) => toast({ title: 'Update failed', description: e.message, variant: 'destructive' }),
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const result = await uploadToCloudinary(file, {
        folder: `profile-photos/${user?.id}`, width: 500, height: 500, crop: 'fill', gravity: 'face',
      });
      setPhotoPreview(result.url);
      form.setValue('profilePhotoUrl', result.url);
      toast({ title: 'Photo uploaded', description: 'Profile picture uploaded successfully.' });
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally { setUploadingPhoto(false); }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingDocuments(true);
    try {
      const results = await Promise.all(
        files.map(f => uploadToCloudinary(f, { folder: `category-verification/${user?.id}`, quality: 'auto', format: 'auto' }))
      );
      setUploadedDocuments(prev => [...prev, ...results.map((r, i) => ({ name: files[i].name, url: r.url }))]);
      toast({ title: 'Documents uploaded', description: `${results.length} document(s) uploaded.` });
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally { setUploadingDocuments(false); }
  };

  const approvedAreas        = (providerProfile?.approvedServiceAreas as string[]) || [];
  const approvedCategories   = categoryVerifications?.filter(v => v.status === 'approved') || [];
  const pendingOrRejected    = categoryVerifications?.filter(v => v.status !== 'approved') || [];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto pb-28">

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* HERO — Cover + Avatar + Name                                        */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div className="bg-card">
        {/* Cover photo */}
        <div className="h-32 md:h-44 relative overflow-hidden bg-gradient-to-br from-primary/35 via-primary/15 to-transparent">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'radial-gradient(circle at 25% 60%, hsl(var(--primary)) 1.5px, transparent 1.5px),' +
                'radial-gradient(circle at 75% 25%, hsl(var(--primary)) 1.5px, transparent 1.5px)',
              backgroundSize: '36px 36px',
            }}
          />
          <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute top-4 right-24 h-20 w-20 rounded-full bg-primary/10 blur-2xl" />
        </div>

        {/* Avatar + edit toggle */}
        <div className="px-4 md:px-6 -mt-14 pb-5">
          <div className="flex items-end justify-between mb-4">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-28 w-28 border-4 border-background shadow-xl ring-2 ring-primary/20">
                <AvatarImage src={photoPreview || user?.profilePhotoUrl || undefined} />
                <AvatarFallback className="text-4xl font-bold bg-primary/10 text-primary">
                  {user?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                data-testid="button-upload-photo"
                className="absolute bottom-1 right-1 h-8 w-8 rounded-full bg-foreground text-background flex items-center justify-center shadow-md hover:opacity-80 transition-opacity"
              >
                {uploadingPhoto
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Camera className="h-4 w-4" />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </div>

            {/* Edit / Cancel toggle */}
            <button
              onClick={() => {
                if (isEditing) { form.reset(); setPhotoPreview(user?.profilePhotoUrl || null); }
                setIsEditing(!isEditing);
              }}
              data-testid="button-cancel"
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full border-2 font-semibold text-sm transition-colors ${
                isEditing
                  ? 'border-muted-foreground/40 text-muted-foreground hover:bg-muted'
                  : 'border-border hover:bg-muted'
              }`}
            >
              {isEditing ? (
                'Cancel'
              ) : (
                <><Pencil className="h-3.5 w-3.5" /> Edit Profile</>
              )}
            </button>
          </div>

          {/* Name + role chip + location + bio */}
          <h1 className="text-2xl font-bold leading-tight">{user?.name}</h1>
          <div className="flex items-center gap-2 mt-1 mb-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
              user?.role === 'provider'
                ? 'bg-primary/10 text-primary'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${user?.role === 'provider' ? 'bg-primary' : 'bg-emerald-500'}`} />
              {user?.role === 'provider' ? 'Service Provider' : 'Client'}
            </span>
            {(user as any)?.city && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />{(user as any).city}
              </span>
            )}
          </div>

          {!isEditing && (
            user?.bio
              ? <p className="text-sm text-foreground/80 leading-relaxed mt-1">{user.bio}</p>
              : <p className="text-sm text-muted-foreground italic mt-1">No bio yet — tap Edit Profile to add one.</p>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* PROVIDER STATS STRIP                                                */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {user?.role === 'provider' && (providerStats as any) && (
        <div className="grid grid-cols-3 divide-x divide-border/50 border-y border-border/50 bg-card">
          <div className="flex flex-col items-center py-3.5 gap-0.5">
            <span className="text-xl font-bold text-amber-500">
              {(providerStats as any).averageRating
                ? Number((providerStats as any).averageRating).toFixed(1)
                : '—'}
            </span>
            <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
              <Star className="h-3 w-3" /> Rating
            </span>
          </div>
          <div className="flex flex-col items-center py-3.5 gap-0.5">
            <span className="text-xl font-bold text-primary">{(providerStats as any).completedJobs || 0}</span>
            <span className="text-[11px] text-muted-foreground">Jobs done</span>
          </div>
          <div className="flex flex-col items-center py-3.5 gap-0.5">
            <span className="text-xl font-bold text-sky-500">
              {(providerStats as any).avgResponseTime ? `${(providerStats as any).avgResponseTime}m` : '—'}
            </span>
            <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
              <Clock className="h-3 w-3" /> Response
            </span>
          </div>
        </div>
      )}

      <div className="px-4 pt-4 space-y-3">

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* EDIT FORM (only visible when isEditing)                           */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {isEditing && (
          <Card className="border border-border/60 rounded-2xl overflow-hidden">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Edit Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-5">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(d => mutation.mutate(d))} className="space-y-4">

                  {/* Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('Full Name')}</FormLabel>
                        <FormControl>
                          <Input placeholder="Your name" data-testid="input-name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Email (read-only) */}
                  <div>
                    <FormLabel>{t('Email')}</FormLabel>
                    <Input
                      className="mt-2 opacity-60"
                      value={user?.email}
                      disabled
                      data-testid="input-email-disabled"
                    />
                    <p className="text-xs text-muted-foreground mt-1">{t('Email cannot be changed')}</p>
                  </div>

                  {/* Phone */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('Phone Number')}</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="+267 12345678" data-testid="input-phone" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Bio */}
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('Bio')}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us about yourself..."
                            className="min-h-20 resize-none"
                            data-testid="input-bio"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Language */}
                  <FormField
                    control={form.control}
                    name="preferredLanguage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('Language')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <div className="flex items-center gap-2">
                                <Languages className="h-4 w-4 text-muted-foreground" />
                                <SelectValue placeholder={t('Select language')} />
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Push Notifications */}
                  <FormField
                    control={form.control}
                    name="enableWebPushNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/60 px-4 py-3">
                        <div>
                          <FormLabel className="cursor-pointer flex items-center gap-2 text-sm">
                            <Bell className="h-4 w-4" />
                            {t('Push Notifications')}
                          </FormLabel>
                          <FormDescription className="text-xs mt-0.5">
                            {t('Receive notifications about messages and job updates')}
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

                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl font-semibold"
                    disabled={mutation.isPending}
                    data-testid="button-save"
                  >
                    {mutation.isPending
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
                      : 'Save Changes'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* VIEW MODE — About + Preferences                                   */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {!isEditing && (
          <>
            {/* Contact Info */}
            <Card className="border border-border/60 rounded-2xl overflow-hidden">
              <CardHeader className="px-4 pt-4 pb-1">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  Contact Info
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 divide-y divide-border/30">
                {/* Email */}
                <div className="flex items-center gap-3 py-3">
                  <div className="h-9 w-9 rounded-xl bg-muted/60 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-muted-foreground">Email</p>
                    <p className="text-sm font-medium truncate">{user?.email}</p>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded-full flex-shrink-0">
                    verified
                  </span>
                </div>
                {/* Phone */}
                <div className="flex items-center gap-3 py-3">
                  <div className="h-9 w-9 rounded-xl bg-muted/60 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-muted-foreground">Phone</p>
                    <p className={`text-sm font-medium truncate ${!user?.phone ? 'italic text-muted-foreground' : ''}`}>
                      {user?.phone || 'Not added yet'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card className="border border-border/60 rounded-2xl overflow-hidden">
              <CardHeader className="px-4 pt-4 pb-1">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 divide-y divide-border/30">
                <div className="flex items-center gap-3 py-3">
                  <div className="h-9 w-9 rounded-xl bg-muted/60 flex items-center justify-center flex-shrink-0">
                    <Languages className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-muted-foreground">Language</p>
                    <p className="text-sm font-medium">{LANGUAGES[user?.preferredLanguage || 'en'] || 'English'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 py-3">
                  <div className="h-9 w-9 rounded-xl bg-muted/60 flex items-center justify-center flex-shrink-0">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-muted-foreground">Push Notifications</p>
                    <p className="text-sm font-medium">
                      {(user as any)?.enableWebPushNotifications !== false ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                  <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                    (user as any)?.enableWebPushNotifications !== false
                      ? 'bg-emerald-500'
                      : 'bg-muted-foreground/30'
                  }`} />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* PROVIDER — Service Areas                                          */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {user?.role === 'provider' && (
          <Card className="border border-border/60 rounded-2xl overflow-hidden">
            <CardHeader className="px-4 pt-4 pb-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  Service Areas
                </CardTitle>
                <Dialog open={migrationDialogOpen} onOpenChange={setMigrationDialogOpen}>
                  <DialogTrigger asChild>
                    <button
                      className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      data-testid="button-request-location"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add location
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Request Location Migration</DialogTitle>
                      <DialogDescription>
                        Request approval to work in a new city. An admin will review your request.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...migrationForm}>
                      <form
                        onSubmit={migrationForm.handleSubmit(d => migrationMutation.mutate(d))}
                        className="space-y-4"
                      >
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
                                    .filter(c => !approvedAreas.includes(c) && c !== providerProfile?.primaryCity)
                                    .map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
                          <Button type="button" variant="outline" onClick={() => setMigrationDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={migrationMutation.isPending} data-testid="button-submit-migration">
                            {migrationMutation.isPending
                              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</>
                              : 'Submit Request'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {providerProfile ? (
                <>
                  {/* Approved areas */}
                  <div className="flex flex-wrap gap-2 py-2">
                    <Badge variant="default" className="flex items-center gap-1 rounded-full px-3 py-1">
                      <MapPin className="h-3 w-3" />
                      {providerProfile.primaryCity}
                      <span className="opacity-60 text-[10px] ml-0.5">primary</span>
                    </Badge>
                    {approvedAreas
                      .filter((c: string) => c !== providerProfile.primaryCity)
                      .map((c: string) => (
                        <Badge key={c} variant="secondary" className="flex items-center gap-1 rounded-full px-3 py-1">
                          <MapPin className="h-3 w-3" />{c}
                        </Badge>
                      ))}
                  </div>

                  {/* Migration requests */}
                  {migrations && migrations.length > 0 && (
                    <div className="mt-2" data-testid="migration-requests-section">
                      <p className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground mb-2">
                        Requests
                      </p>
                      <div className="space-y-1.5">
                        {migrations.map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-muted/40"
                            data-testid={`card-migration-${m.id}`}
                          >
                            {m.status === 'pending'  && <Clock       className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />}
                            {m.status === 'approved' && <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />}
                            {m.status === 'rejected' && <XCircle     className="h-3.5 w-3.5 text-red-500   flex-shrink-0" />}
                            <span className="text-sm font-medium flex-1" data-testid={`text-migration-city-${m.id}`}>{m.requestedCity}</span>
                            <span className="text-[10px] text-muted-foreground" data-testid={`text-migration-date-${m.id}`}>
                              {new Date(m.createdAt).toLocaleDateString()}
                            </span>
                            <Badge
                              variant={m.status === 'approved' ? 'default' : m.status === 'rejected' ? 'destructive' : 'secondary'}
                              className="text-[10px] capitalize rounded-full"
                              data-testid={`badge-migration-status-${m.id}`}
                            >
                              {m.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {migrations && migrations.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1" data-testid="text-no-migrations">
                      No migration requests yet.
                    </p>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Loading…</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* PROVIDER — Skills & Category Verifications                        */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {user?.role === 'provider' && categories && (
          <Card className="border border-border/60 rounded-2xl overflow-hidden">
            <CardHeader className="px-4 pt-4 pb-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  Skills &amp; Services
                </CardTitle>
                <Dialog open={categoryVerificationDialogOpen} onOpenChange={setCategoryVerificationDialogOpen}>
                  <DialogTrigger asChild>
                    <button
                      className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      data-testid="button-request-category"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add skill
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Request Category Verification</DialogTitle>
                      <DialogDescription>
                        Select a category and upload supporting documents. An admin will review your request.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...categoryVerificationForm}>
                      <form
                        onSubmit={categoryVerificationForm.handleSubmit(d => categoryVerificationMutation.mutate(d))}
                        className="space-y-4"
                      >
                        <FormItem>
                          <FormLabel>Select Categories</FormLabel>
                          <FormDescription>Choose one or more categories to get verified for.</FormDescription>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2 max-h-48 overflow-y-auto pr-1">
                            {categories
                              .filter(c => !categoryVerifications?.some(v => v.categoryId === c.id))
                              .map((category) => (
                                <label key={category.id} className="flex items-center gap-2 cursor-pointer text-sm">
                                  <input
                                    type="checkbox"
                                    checked={selectedCategoryIds.includes(Number(category.id))}
                                    onChange={(e) => {
                                      const id = Number(category.id);
                                      setSelectedCategoryIds(prev =>
                                        e.target.checked ? [...prev, id] : prev.filter(x => x !== id)
                                      );
                                    }}
                                    className="w-4 h-4 accent-primary"
                                  />
                                  {category.name}
                                </label>
                              ))}
                          </div>
                          {selectedCategoryIds.length === 0 && (
                            <p className="text-sm text-destructive mt-1">Please select at least one category</p>
                          )}
                        </FormItem>

                        <div className="space-y-2">
                          <FormLabel>Upload Verification Documents</FormLabel>
                          <FormDescription>
                            Upload certificates, licenses, etc. (max 10 MB per file).
                          </FormDescription>
                          <input
                            type="file"
                            multiple
                            onChange={handleDocumentUpload}
                            disabled={uploadingDocuments || categoryVerificationMutation.isPending}
                            data-testid="input-category-documents"
                            className="block w-full text-sm text-muted-foreground
                              file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                              file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground
                              hover:file:bg-primary/90 cursor-pointer"
                          />
                          {uploadingDocuments && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
                            </div>
                          )}
                        </div>

                        {uploadedDocuments.length > 0 && (
                          <div className="space-y-1.5">
                            <FormLabel>Uploaded ({uploadedDocuments.length})</FormLabel>
                            {uploadedDocuments.map((doc, i) => (
                              <div key={i} className="flex items-center justify-between gap-2 p-2 rounded-lg border bg-muted/30">
                                <span className="text-sm truncate">{doc.name}</span>
                                <button
                                  type="button"
                                  onClick={() => setUploadedDocuments(prev => prev.filter((_, idx) => idx !== i))}
                                  disabled={categoryVerificationMutation.isPending}
                                  className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
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
                            disabled={
                              categoryVerificationMutation.isPending ||
                              uploadedDocuments.length === 0 ||
                              selectedCategoryIds.length === 0
                            }
                            onClick={() => categoryVerificationMutation.mutate({ categoryIds: selectedCategoryIds })}
                            data-testid="button-submit-category"
                          >
                            {categoryVerificationMutation.isPending
                              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting…</>
                              : `Submit Request${selectedCategoryIds.length > 1 ? 's' : ''}`}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">

              {/* Verified categories as chips */}
              {approvedCategories.length > 0 && (
                <div className="py-2">
                  <p className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground mb-2">Verified</p>
                  <div className="flex flex-wrap gap-2">
                    {approvedCategories.map((v) => {
                      const cat = categories.find(c => c.id === v.categoryId);
                      return (
                        <Badge
                          key={v.id}
                          variant="default"
                          className="flex items-center gap-1 rounded-full px-3 py-1"
                          data-testid={`card-category-${v.id}`}
                        >
                          <CheckCircle className="h-3 w-3" />
                          <span data-testid={`text-category-name-${v.id}`}>{cat?.name || 'Unknown'}</span>
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Pending / rejected */}
              {pendingOrRejected.length > 0 && (
                <div className="mt-1" data-testid="category-verifications-section">
                  <p className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground mb-2">Requests</p>
                  <div className="space-y-1.5">
                    {pendingOrRejected.map((v) => {
                      const cat = categories.find(c => c.id === v.categoryId);
                      return (
                        <div
                          key={v.id}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-muted/40"
                          data-testid={`card-category-${v.id}`}
                        >
                          {v.status === 'pending'  && <Clock       className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />}
                          {v.status === 'rejected' && <XCircle     className="h-3.5 w-3.5 text-red-500   flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium" data-testid={`text-category-name-${v.id}`}>
                              {cat?.name || 'Unknown Category'}
                            </span>
                            {v.status === 'rejected' && (v as any).rejectionReason && (
                              <p className="text-xs text-destructive mt-0.5">{(v as any).rejectionReason}</p>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground flex-shrink-0" data-testid={`text-category-date-${v.id}`}>
                            {new Date(v.createdAt).toLocaleDateString()}
                          </span>
                          <Badge
                            variant={v.status === 'rejected' ? 'destructive' : 'secondary'}
                            className="text-[10px] capitalize rounded-full flex-shrink-0"
                            data-testid={`badge-category-status-${v.id}`}
                          >
                            {v.status}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {(!categoryVerifications || categoryVerifications.length === 0) && (
                <p className="text-xs text-muted-foreground py-2" data-testid="text-no-categories">
                  No verification requests yet. Tap "Add skill" to get started.
                </p>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
