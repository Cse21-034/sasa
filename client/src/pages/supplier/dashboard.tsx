import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
import {
  Plus, Edit, Trash2, Tag, Calendar, Loader2, Upload, X,
  Settings, MapPin, Mail, Phone, Star, Percent, Building2,
  Package, BadgeCheck, TrendingUp, LayoutDashboard, MessageSquare,
  Menu as MenuIcon, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth-context';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const SIDEBAR_BG = 'linear-gradient(180deg, #1a3a3a 0%, #162e2e 100%)';

const navItems = [
  { label: 'Dashboard',   icon: LayoutDashboard, path: '/supplier/dashboard' },
  { label: 'Promotions',  icon: Tag,             path: '/supplier/dashboard' },
  { label: 'Messages',    icon: MessageSquare,   path: '/messages' },
  { label: 'Settings',    icon: Settings,        path: '/supplier/settings' },
];

function Sidebar({ open, onClose, location }: { open: boolean; onClose: () => void; location: string }) {
  return (
    <>
      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onClose} />}

      <aside
        className={`fixed top-0 left-0 h-full z-40 w-60 flex flex-col transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:h-auto lg:z-auto`}
        style={{ background: SIDEBAR_BG }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-white/10 flex-shrink-0">
          <img src="/logo-icon.png" alt="JobTradeSasa" className="h-8 w-auto max-w-[140px] object-contain" />
        </div>

        {/* Nav */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest px-3 mb-2">Menu</p>
          {navItems.map((item) => {
            const active = location === item.path && item.label !== 'Messages' && item.label !== 'Settings'
              ? true : location === item.path;
            return (
              <Link key={item.label} href={item.path}>
                <a
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                    ${location === item.path
                      ? 'bg-primary text-white shadow-md'
                      : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                  {location === item.path && <ChevronRight className="h-3 w-3 ml-auto" />}
                </a>
              </Link>
            );
          })}
        </nav>

        {/* User chip */}
        <div className="px-4 py-4 border-t border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              S
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">Supplier</p>
              <p className="text-white/50 text-[10px] truncate">Dashboard</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default function SupplierDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<any>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', discountPercentage: '',
    validFrom: '', validUntil: '', termsAndConditions: '',
  });

  const { data: profile } = useQuery({
    queryKey: ['supplierProfile'],
    queryFn: async () => (await apiRequest('GET', '/api/supplier/profile')).json(),
  });

  const { data: promotions, isLoading } = useQuery({
    queryKey: ['supplierPromotions'],
    queryFn: async () => (await apiRequest('GET', '/api/supplier/promotions')).json(),
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => (await apiRequest('POST', '/api/supplier/promotions', data)).json(),
    onSuccess: () => { toast({ title: 'Promotion created!' }); queryClient.invalidateQueries({ queryKey: ['supplierPromotions'] }); resetForm(); },
    onError: (e: any) => toast({ title: 'Failed', description: e.message, variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) =>
      (await apiRequest('PATCH', `/api/supplier/promotions/${id}`, data)).json(),
    onSuccess: () => { toast({ title: 'Promotion updated!' }); queryClient.invalidateQueries({ queryKey: ['supplierPromotions'] }); resetForm(); },
    onError: (e: any) => toast({ title: 'Failed', description: e.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest('DELETE', `/api/supplier/promotions/${id}`, {}); },
    onSuccess: () => { toast({ title: 'Promotion deleted!' }); queryClient.invalidateQueries({ queryKey: ['supplierPromotions'] }); },
    onError: (e: any) => toast({ title: 'Failed', description: e.message, variant: 'destructive' }),
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if (!files) return;
    setUploadingImages(true);
    try {
      const results = await Promise.all(
        Array.from(files).map((f) => {
          if (f.size > 5 * 1024 * 1024) throw new Error(`${f.name} exceeds 5MB`);
          return uploadToCloudinary(f, { folder: `supplier-promotions/${user?.id}`, width: 800, height: 600, crop: 'fill', quality: 'auto', format: 'auto' });
        })
      );
      setUploadedImages((p) => [...p, ...results.map((r) => r.url)]);
      toast({ title: `${results.length} image(s) uploaded` });
    } catch (e: any) { toast({ title: 'Upload failed', description: e.message, variant: 'destructive' }); }
    finally { setUploadingImages(false); }
  };

  const removeImage = (i: number) => setUploadedImages((p) => p.filter((_, idx) => idx !== i));

  const resetForm = () => {
    setFormData({ title: '', description: '', discountPercentage: '', validFrom: '', validUntil: '', termsAndConditions: '' });
    setUploadedImages([]); setEditingPromotion(null); setShowPromotionDialog(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, discountPercentage: formData.discountPercentage ? parseInt(formData.discountPercentage) : undefined, images: uploadedImages };
    editingPromotion ? updateMutation.mutate({ id: editingPromotion.id, data: payload }) : createMutation.mutate(payload);
  };

  const handleEdit = (promo: any) => {
    setEditingPromotion(promo);
    setFormData({ title: promo.title, description: promo.description, discountPercentage: promo.discountPercentage?.toString() || '', validFrom: new Date(promo.validFrom).toISOString().slice(0, 16), validUntil: new Date(promo.validUntil).toISOString().slice(0, 16), termsAndConditions: promo.termsAndConditions || '' });
    setUploadedImages(promo.images || []);
    setShowPromotionDialog(true);
  };

  const rating = parseFloat(profile?.ratingAverage ?? '0');
  const activePromos = promotions?.filter((p: any) => p.isActive).length ?? 0;
  const totalPromos = promotions?.length ?? 0;

  const stats = [
    { label: 'Total Promotions', value: totalPromos,           icon: Package,    bg: 'bg-orange-100 dark:bg-orange-900/30',  color: 'text-orange-500' },
    { label: 'Active Promos',    value: activePromos,          icon: BadgeCheck, bg: 'bg-emerald-100 dark:bg-emerald-900/30', color: 'text-emerald-500' },
    { label: 'Rating',           value: rating.toFixed(1),     icon: Star,       bg: 'bg-yellow-100 dark:bg-yellow-900/30',  color: 'text-yellow-500' },
    { label: 'Reviews',          value: profile?.reviewCount ?? 0, icon: TrendingUp, bg: 'bg-blue-100 dark:bg-blue-900/30', color: 'text-blue-500' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} location={location} />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="h-16 flex-shrink-0 flex items-center justify-between px-4 md:px-6 bg-card border-b border-border/40 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors">
              <MenuIcon className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-bold text-foreground">Supplier Dashboard</h1>
          </div>
          <Link href="/supplier/settings">
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="h-4 w-4" /> Edit Profile
            </Button>
          </Link>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">

          {/* Profile banner */}
          <div className="w-full" style={{ background: 'linear-gradient(135deg, #1a3a3a 0%, #274345 60%, #2a4d4f 100%)' }}>
            <div className="px-4 md:px-6 py-6 md:py-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {profile?.logo
                    ? <img src={profile.logo} alt={profile.companyName} className="w-full h-full object-contain p-1" />
                    : <Building2 className="h-10 w-10 text-white/60" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h2 className="text-xl font-extrabold text-white">{profile?.companyName ?? user?.name}</h2>
                    {profile?.featured && <span className="text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">Featured</span>}
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} className={`h-3.5 w-3.5 ${s <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-white/30'}`} />
                    ))}
                    <span className="text-white/70 text-xs ml-1">{rating.toFixed(1)} · {profile?.reviewCount ?? 0} reviews</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-white/60 text-xs">
                    {profile?.physicalAddress && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{profile.physicalAddress}</span>}
                    {profile?.companyEmail    && <span className="flex items-center gap-1"><Mail  className="h-3 w-3" />{profile.companyEmail}</span>}
                    {profile?.companyPhone    && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{profile.companyPhone}</span>}
                  </div>
                  {profile?.industryType && (
                    <div className="mt-2">
                      <span className="text-[11px] bg-white/10 text-white/80 px-2 py-0.5 rounded-full border border-white/20">{profile.industryType}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 md:px-6 py-6 space-y-6">

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((s) => (
                <div key={s.label} className="rounded-2xl border border-border/50 bg-card p-4 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                    <p className="text-2xl font-extrabold text-foreground">{s.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-full ${s.bg} flex items-center justify-center flex-shrink-0`}>
                    <s.icon className={`h-6 w-6 ${s.color}`} />
                  </div>
                </div>
              ))}
            </div>

            {/* Promotions */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold">My Promotions</h3>
                  <p className="text-xs text-muted-foreground">Create and manage special offers</p>
                </div>
                <Button onClick={() => setShowPromotionDialog(true)} size="sm" className="bg-primary hover:bg-primary/90 text-white">
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : promotions && promotions.length > 0 ? (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {promotions.map((promo: any) => (
                    <div key={promo.id} className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm">
                      {promo.images?.[0] && <img src={promo.images[0]} alt={promo.title} className="w-full h-32 object-cover" />}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-bold text-sm leading-snug">{promo.title}</h4>
                          {promo.discountPercentage && (
                            <span className="flex-shrink-0 text-[10px] font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                              <Percent className="h-2.5 w-2.5" />{promo.discountPercentage}%
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{promo.description}</p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                          <Calendar className="h-3 w-3" />
                          {new Date(promo.validFrom).toLocaleDateString()} – {new Date(promo.validUntil).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${promo.isActive ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                            {promo.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <div className="flex gap-1.5 ml-auto">
                            <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => handleEdit(promo)}>
                              <Edit className="h-3 w-3 mr-1" />Edit
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" className="h-7 w-7 p-0"><Trash2 className="h-3 w-3" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Delete Promotion?</AlertDialogTitle><AlertDialogDescription>This will permanently remove this promotion.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteMutation.mutate(promo.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-border/40 rounded-2xl py-14 text-center">
                  <Tag className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground text-sm mb-3">No promotions yet</p>
                  <Button size="sm" onClick={() => setShowPromotionDialog(true)}><Plus className="h-4 w-4 mr-1" />Create Promotion</Button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Promotion dialog */}
      <Dialog open={showPromotionDialog} onOpenChange={(o) => !o && resetForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingPromotion ? 'Edit Promotion' : 'Create Promotion'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Title *</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Summer Sale – 20% Off" required /></div>
            <div><Label>Description *</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="min-h-24" required /></div>
            <div><Label>Discount % (optional)</Label><Input type="number" min="0" max="100" value={formData.discountPercentage} onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })} placeholder="e.g., 20" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Valid From *</Label><Input type="datetime-local" value={formData.validFrom} onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })} required /></div>
              <div><Label>Valid Until *</Label><Input type="datetime-local" value={formData.validUntil} onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })} required /></div>
            </div>
            <div>
              <Label>Images (optional)</Label>
              <div className="border-2 border-dashed rounded-lg p-5 hover:border-primary/50 transition-colors">
                <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" id="promo-images" />
                <label htmlFor="promo-images" className="flex flex-col items-center cursor-pointer">
                  {uploadingImages ? <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" /> : <Upload className="h-8 w-8 text-muted-foreground mb-2" />}
                  <p className="text-sm">Click to upload · Max 5MB</p>
                </label>
              </div>
              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {uploadedImages.map((img, i) => (
                    <div key={i} className="relative group">
                      <img src={img} className="w-full h-24 object-cover rounded-lg" />
                      <button type="button" onClick={() => removeImage(i)} className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div><Label>Terms & Conditions (optional)</Label><Textarea value={formData.termsAndConditions} onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })} className="min-h-20" /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : editingPromotion ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
