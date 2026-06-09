import { useState } from 'react';
import { Link } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Plus, Edit, Trash2, Tag, Calendar, Loader2, Upload, X,
  MapPin, Mail, Phone, Star, Percent, Building2,
  Package, BadgeCheck, TrendingUp, ArrowUpRight,
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


export default function SupplierDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
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
    { label: 'Total Promotions', value: totalPromos,               icon: Package,    bg: 'bg-orange-100 dark:bg-orange-900/30',   color: 'text-orange-500',  accent: 'bg-gradient-to-r from-orange-500 to-orange-400' },
    { label: 'Active Promos',    value: activePromos,              icon: BadgeCheck, bg: 'bg-emerald-100 dark:bg-emerald-900/30', color: 'text-emerald-500', accent: 'bg-gradient-to-r from-emerald-500 to-emerald-400' },
    { label: 'Rating',           value: rating.toFixed(1),         icon: Star,       bg: 'bg-yellow-100 dark:bg-yellow-900/30',   color: 'text-yellow-500',  accent: 'bg-gradient-to-r from-yellow-500 to-yellow-400' },
    { label: 'Reviews',          value: profile?.reviewCount ?? 0, icon: TrendingUp, bg: 'bg-blue-100 dark:bg-blue-900/30',       color: 'text-blue-500',    accent: 'bg-gradient-to-r from-blue-500 to-blue-400' },
  ];

  return (
    <>
      {/* Profile banner */}
      <div className="w-full relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a3a3a 0%, #274345 55%, #2a4d4f 100%)' }}>
        {/* Decorative blobs */}
        <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full bg-white/[0.04] pointer-events-none" />
        <div className="absolute right-10 top-6 w-28 h-28 rounded-full bg-white/[0.03] pointer-events-none" />
        <div className="absolute -left-6 bottom-0 w-32 h-32 rounded-full bg-primary/10 pointer-events-none" />

        <div className="px-4 md:px-6 py-6 md:py-8 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Logo area */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-white/10 border-2 border-white/25 flex items-center justify-center overflow-hidden shadow-xl">
                {profile?.logo
                  ? <img src={profile.logo} alt={profile.companyName} className="w-full h-full object-contain p-1.5" />
                  : <Building2 className="h-10 w-10 text-white/50" />}
              </div>
              {!profile?.logo && (
                <Link href="/supplier/settings">
                  <a className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-extrabold bg-primary text-white px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-md hover:bg-primary/90 transition-colors flex items-center gap-0.5">
                    <Plus className="h-2.5 w-2.5" /> Logo
                  </a>
                </Link>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-xl font-extrabold text-white leading-tight">{profile?.companyName ?? user?.name}</h2>
                {profile?.featured && (
                  <span className="text-[10px] font-black bg-primary text-white px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                    <Star className="h-2.5 w-2.5 fill-white" /> Featured
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 mb-2.5">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} className={`h-3.5 w-3.5 ${s <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-white/20 fill-white/10'}`} />
                ))}
                <span className="text-white/60 text-xs ml-1.5">{rating.toFixed(1)} · <span className="text-white/80 font-semibold">{profile?.reviewCount ?? 0}</span> reviews</span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-white/55 text-xs mb-2.5">
                {profile?.physicalAddress && <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-white/40" />{profile.physicalAddress}</span>}
                {profile?.companyEmail    && <span className="flex items-center gap-1.5"><Mail  className="h-3 w-3 text-white/40" />{profile.companyEmail}</span>}
                {profile?.companyPhone    && <span className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-white/40" />{profile.companyPhone}</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {profile?.industryType && (
                  <span className="text-[11px] font-semibold bg-white/10 text-white/80 px-2.5 py-0.5 rounded-full border border-white/15">{profile.industryType}</span>
                )}
                <Link href="/supplier/settings">
                  <a className="text-[11px] font-semibold text-white/50 hover:text-white/80 flex items-center gap-1 transition-colors">
                    Edit profile <ArrowUpRight className="h-3 w-3" />
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 py-6 space-y-6">

        {/* Stat cards — stacked with colored top accent */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
              <div className={`h-1 ${s.accent}`} />
              <div className="p-4">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-foreground leading-none">{s.value}</p>
                <p className="text-[11px] text-muted-foreground mt-1.5 font-medium uppercase tracking-wide leading-tight">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Promotions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Tag className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-bold leading-tight">My Promotions</h3>
                <p className="text-[11px] text-muted-foreground">Special offers for your customers</p>
              </div>
            </div>
            <Button onClick={() => setShowPromotionDialog(true)} size="sm" className="bg-primary hover:bg-primary/90 text-white shadow-sm">
              <Plus className="h-4 w-4 mr-1" /> Add Promo
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : promotions && promotions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {promotions.map((promo: any) => (
                <div key={promo.id} className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm hover:shadow-md hover:border-primary/30 transition-all group">
                  {/* Card header: image or gradient placeholder */}
                  {promo.images?.[0] ? (
                    <div className="relative">
                      <img src={promo.images[0]} alt={promo.title} className="w-full h-36 object-cover" />
                      {promo.discountPercentage && (
                        <span className="absolute top-3 right-3 bg-primary text-white text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
                          <Percent className="h-3 w-3" />{promo.discountPercentage}% OFF
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="relative h-28 flex items-center px-5 overflow-hidden"
                         style={{ background: 'linear-gradient(135deg, rgba(248,153,45,0.12) 0%, rgba(39,67,69,0.08) 100%)' }}>
                      <Tag className="absolute right-3 top-1/2 -translate-y-1/2 h-16 w-16 rotate-12 text-primary/[0.07]" />
                      {promo.discountPercentage ? (
                        <span className="bg-primary text-white font-black px-4 py-2 rounded-2xl flex items-center gap-1.5 text-sm shadow-md">
                          <Percent className="h-3.5 w-3.5" />{promo.discountPercentage}% OFF
                        </span>
                      ) : (
                        <span className="bg-card/80 text-foreground font-bold px-4 py-2 rounded-2xl text-xs border border-border/60">
                          Special Offer
                        </span>
                      )}
                    </div>
                  )}

                  <div className="p-4">
                    <h4 className="font-bold text-sm leading-snug mb-1.5 line-clamp-1 group-hover:text-primary transition-colors">{promo.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">{promo.description}</p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                      <Calendar className="h-3 w-3 flex-shrink-0 text-primary/60" />
                      {new Date(promo.validFrom).toLocaleDateString()} – {new Date(promo.validUntil).toLocaleDateString()}
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/40">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                        promo.isActive
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {promo.isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                        {promo.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <div className="flex gap-1.5">
                        <Button variant="ghost" size="sm" className="h-8 px-2.5 text-xs hover:bg-primary/10 hover:text-primary" onClick={() => handleEdit(promo)}>
                          <Edit className="h-3 w-3 mr-1" />Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive text-muted-foreground">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
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
            /* Enhanced empty state */
            <div className="relative rounded-2xl overflow-hidden border-2 border-dashed border-border/40 py-14 text-center"
                 style={{ background: 'linear-gradient(135deg, rgba(248,153,45,0.04) 0%, transparent 60%)' }}>
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
                <Tag className="h-8 w-8 text-primary/70" />
              </div>
              <h4 className="font-bold text-foreground mb-1">No promotions yet</h4>
              <p className="text-muted-foreground text-sm mb-5 max-w-xs mx-auto leading-relaxed">
                Create your first promotion to attract more customers and boost your visibility
              </p>
              <Button size="sm" onClick={() => setShowPromotionDialog(true)} className="bg-primary hover:bg-primary/90 text-white shadow-sm">
                <Plus className="h-4 w-4 mr-1.5" />Create First Promotion
              </Button>
              <div className="flex flex-wrap justify-center gap-2 mt-5 px-6">
                {['Boost visibility', 'Attract customers', 'Increase reviews'].map((tip) => (
                  <span key={tip} className="text-[11px] text-muted-foreground bg-muted/60 px-3 py-1 rounded-full border border-border/40">{tip}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Promotion dialog */}
      <Dialog open={showPromotionDialog} onOpenChange={(o) => !o && resetForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingPromotion ? 'Edit Promotion' : 'Create Promotion'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Title *</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Summer Sale – 20% Off" required /></div>
            <div><Label>Description *</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="min-h-24" required /></div>
            <div><Label>Discount % (optional)</Label><Input type="number" min="0" max="100" value={formData.discountPercentage} onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })} placeholder="e.g., 20" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
    </>
  );
}
