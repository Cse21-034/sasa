import { useQuery } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
import {
  MapPin, Phone, Mail, Globe, ArrowLeft, Calendar, Tag,
  Facebook, Instagram, Twitter, MessageCircle, ExternalLink,
  Percent, Clock, ChevronLeft, Building2, User, Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { apiRequest } from '@/lib/queryClient';
import { useState } from 'react';

export default function SupplierDetail() {
  const [location] = useLocation();
  const supplierId = location.split('/').pop();
  const backPath = location.startsWith('/admin')    ? '/admin/suppliers'
                 : location.startsWith('/supplier') ? '/supplier/browse'
                 : '/suppliers';

  const { data: supplier, isLoading } = useQuery({
    queryKey: ['supplierDetails', supplierId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/suppliers/${supplierId}/details`);
      return response.json();
    },
    enabled: !!supplierId,
  });

  const handleGetQuote = () => {
    if (supplier?.whatsappNumber) {
      const clean = supplier.whatsappNumber.replace(/\D/g, '');
      const msg   = encodeURIComponent(`Hi ${supplier.companyName}, I'm interested in getting a quote for your services. Can you help?`);
      window.open(`https://wa.me/${clean}?text=${msg}`, '_blank');
    } else if (supplier?.companyPhone) {
      window.open(`tel:${supplier.companyPhone}`, '_blank');
    } else if (supplier?.companyEmail) {
      window.open(`mailto:${supplier.companyEmail}?subject=Quote Request`, '_blank');
    }
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto pb-28">
        {/* Cover skeleton */}
        <Skeleton className="h-32 md:h-44 w-full" />
        <div className="px-4 -mt-12 pb-5 flex items-end justify-between mb-4">
          <Skeleton className="h-28 w-28 rounded-full border-4 border-background" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
        <div className="px-4 space-y-2 mb-6">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="px-4 grid grid-cols-3 gap-2 mb-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}
        </div>
        <div className="px-4 space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="flex flex-col items-center justify-center py-28 px-4 text-center">
        <div className="h-16 w-16 rounded-full bg-muted/60 flex items-center justify-center mb-4">
          <Building2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-1">Supplier not found</h3>
        <p className="text-sm text-muted-foreground mb-5">This supplier may have been removed or the link is invalid.</p>
        <Link href={backPath}>
          <a className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to Suppliers
          </a>
        </Link>
      </div>
    );
  }

  const promos = supplier.promotions || [];
  const hasSocial = supplier.facebookUrl || supplier.instagramUrl || supplier.twitterUrl || supplier.whatsappNumber;

  return (
    <div className="max-w-2xl mx-auto pb-28">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div className="bg-card">
        {/* Cover */}
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

        {/* Logo + back button row */}
        <div className="px-4 md:px-6 -mt-14 pb-5">
          <div className="flex items-end justify-between mb-4">
            {/* Logo */}
            <Avatar className="h-28 w-28 border-4 border-background shadow-xl ring-2 ring-primary/20 bg-white">
              <AvatarImage
                src={supplier.logo || supplier.user?.profilePhotoUrl}
                className="object-contain p-1"
              />
              <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">
                {supplier.companyName?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Back */}
            <Link href={backPath}>
              <a className="flex items-center gap-1.5 px-4 py-2 rounded-full border-2 border-border font-semibold text-sm hover:bg-muted transition-colors">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </a>
            </Link>
          </div>

          {/* Name + badges */}
          <h1 className="text-2xl font-bold leading-tight">{supplier.companyName}</h1>
          <div className="flex items-center gap-2 mt-1 mb-2 flex-wrap">
            {supplier.industryType && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                <Building2 className="h-3 w-3" />
                {supplier.industryType}
              </span>
            )}
            {supplier.featured && (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <Sparkles className="h-3 w-3" /> Featured
              </span>
            )}
            {supplier.physicalAddress && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />{supplier.physicalAddress.split(',')[0]}
              </span>
            )}
          </div>

          {supplier.aboutUs && (
            <p className="text-sm text-foreground/80 leading-relaxed mt-1 line-clamp-3">
              {supplier.aboutUs}
            </p>
          )}
        </div>
      </div>

      {/* ── CONTACT ACTION BUTTONS ────────────────────────────────────────── */}
      <div className="px-4 pt-3 pb-4 border-b border-border/50">
        <div className="grid grid-cols-3 gap-2">
          {/* WhatsApp / primary CTA */}
          {supplier.whatsappNumber ? (
            <a
              href={`https://wa.me/${supplier.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${supplier.companyName}, I'm interested in your services.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-1 py-3 rounded-2xl bg-[#25d366] hover:bg-[#1ebe5d] text-white transition-colors col-span-1"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-[11px] font-bold">WhatsApp</span>
            </a>
          ) : (
            <button
              onClick={handleGetQuote}
              className="flex flex-col items-center justify-center gap-1 py-3 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-[11px] font-bold">Get Quote</span>
            </button>
          )}

          {/* Call */}
          {supplier.companyPhone ? (
            <a
              href={`tel:${supplier.companyPhone}`}
              className="flex flex-col items-center justify-center gap-1 py-3 rounded-2xl bg-muted/60 hover:bg-muted border border-border/60 transition-colors"
            >
              <Phone className="h-5 w-5 text-foreground" />
              <span className="text-[11px] font-semibold text-foreground">Call</span>
            </a>
          ) : (
            <div className="flex flex-col items-center justify-center gap-1 py-3 rounded-2xl bg-muted/30 border border-border/40 opacity-40">
              <Phone className="h-5 w-5" />
              <span className="text-[11px] font-semibold">Call</span>
            </div>
          )}

          {/* Email */}
          {supplier.companyEmail ? (
            <a
              href={`mailto:${supplier.companyEmail}?subject=Inquiry`}
              className="flex flex-col items-center justify-center gap-1 py-3 rounded-2xl bg-muted/60 hover:bg-muted border border-border/60 transition-colors"
            >
              <Mail className="h-5 w-5 text-foreground" />
              <span className="text-[11px] font-semibold text-foreground">Email</span>
            </a>
          ) : (
            <div className="flex flex-col items-center justify-center gap-1 py-3 rounded-2xl bg-muted/30 border border-border/40 opacity-40">
              <Mail className="h-5 w-5" />
              <span className="text-[11px] font-semibold">Email</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">

        {/* ── CONTACT INFO ─────────────────────────────────────────────────── */}
        <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
          <div className="px-4 pt-4 pb-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Contact Info</p>
          </div>
          <div className="px-4 pb-3 divide-y divide-border/30">
            {supplier.physicalAddress && (
              <div className="flex items-center gap-3 py-3">
                <div className="h-9 w-9 rounded-xl bg-muted/60 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-muted-foreground">Address</p>
                  <p className="text-sm font-medium">{supplier.physicalAddress}</p>
                </div>
              </div>
            )}
            {supplier.companyPhone && (
              <a href={`tel:${supplier.companyPhone}`} className="flex items-center gap-3 py-3 hover:bg-muted/20 -mx-4 px-4 transition-colors">
                <div className="h-9 w-9 rounded-xl bg-muted/60 flex items-center justify-center flex-shrink-0">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium text-primary">{supplier.companyPhone}</p>
                </div>
              </a>
            )}
            {supplier.companyEmail && (
              <a href={`mailto:${supplier.companyEmail}`} className="flex items-center gap-3 py-3 hover:bg-muted/20 -mx-4 px-4 transition-colors">
                <div className="h-9 w-9 rounded-xl bg-muted/60 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-muted-foreground">Email</p>
                  <p className="text-sm font-medium text-primary truncate">{supplier.companyEmail}</p>
                </div>
              </a>
            )}
            {supplier.websiteUrl && (
              <a href={supplier.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 py-3 hover:bg-muted/20 -mx-4 px-4 transition-colors">
                <div className="h-9 w-9 rounded-xl bg-muted/60 flex items-center justify-center flex-shrink-0">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-muted-foreground">Website</p>
                  <p className="text-sm font-medium text-primary truncate">{supplier.websiteUrl}</p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
              </a>
            )}
          </div>
        </div>

        {/* ── CONTACT PERSON ───────────────────────────────────────────────── */}
        {(supplier.contactPerson || supplier.contactPosition) && (
          <div className="bg-card border border-border/60 rounded-2xl px-4 py-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Contact Person</p>
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm leading-tight">{supplier.contactPerson}</p>
                {supplier.contactPosition && (
                  <p className="text-xs text-muted-foreground mt-0.5">{supplier.contactPosition}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── SOCIAL LINKS ─────────────────────────────────────────────────── */}
        {hasSocial && (
          <div className="bg-card border border-border/60 rounded-2xl px-4 py-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Connect</p>
            <div className="grid grid-cols-2 gap-2">
              {supplier.whatsappNumber && (
                <a
                  href={`https://wa.me/${supplier.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${supplier.companyName}, I'm interested in your services.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#25d366]/10 hover:bg-[#25d366]/20 transition-colors"
                >
                  <MessageCircle className="h-4 w-4 text-[#25d366] flex-shrink-0" />
                  <span className="text-sm font-semibold text-[#128c7e] dark:text-[#25d366]">WhatsApp</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground/50 ml-auto flex-shrink-0" />
                </a>
              )}
              {supplier.facebookUrl && (
                <a
                  href={supplier.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
                >
                  <Facebook className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span className="text-sm font-semibold text-blue-600">Facebook</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground/50 ml-auto flex-shrink-0" />
                </a>
              )}
              {supplier.instagramUrl && (
                <a
                  href={supplier.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 transition-colors"
                >
                  <Instagram className="h-4 w-4 text-pink-600 flex-shrink-0" />
                  <span className="text-sm font-semibold text-pink-600">Instagram</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground/50 ml-auto flex-shrink-0" />
                </a>
              )}
              {supplier.twitterUrl && (
                <a
                  href={supplier.twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 transition-colors"
                >
                  <Twitter className="h-4 w-4 text-sky-500 flex-shrink-0" />
                  <span className="text-sm font-semibold text-sky-500">Twitter / X</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground/50 ml-auto flex-shrink-0" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* ── PROMOTIONS ───────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Percent className="h-3.5 w-3.5 text-primary" />
            </div>
            <p className="font-bold text-base">Active Promotions</p>
            {promos.length > 0 && (
              <span className="ml-auto text-xs text-muted-foreground">{promos.length} deal{promos.length !== 1 ? 's' : ''}</span>
            )}
          </div>

          {promos.length === 0 ? (
            <div className="border border-border/50 rounded-2xl py-12 text-center bg-card">
              <Tag className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No active promotions right now</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Check back soon for deals</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {promos.map((promo: any) => (
                <PromoCard key={promo.id} promo={promo} onContact={handleGetQuote} supplierName={supplier.companyName} hasWhatsapp={!!supplier.whatsappNumber} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ── Promo card ──────────────────────────────────────────────────────────────

function PromoCard({
  promo,
  onContact,
  supplierName,
  hasWhatsapp,
}: {
  promo: any;
  onContact: () => void;
  supplierName: string;
  hasWhatsapp: boolean;
}) {
  const images = (promo.images as string[]) || [];
  const [imgIdx, setImgIdx] = useState(0);

  const isExpired = promo.validUntil && new Date(promo.validUntil) < new Date();
  const expiresSoon = promo.validUntil && !isExpired &&
    (new Date(promo.validUntil).getTime() - Date.now()) < 86400000 * 2;

  return (
    <div className="border border-border/50 rounded-2xl overflow-hidden bg-card shadow-sm">
      {/* Image gallery */}
      {images.length > 0 && (
        <div className="relative aspect-[16/7] overflow-hidden bg-muted/30">
          <img
            src={images[imgIdx]}
            alt={promo.title}
            className="w-full h-full object-cover"
          />
          {/* Discount overlay */}
          {promo.discountPercentage && (
            <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
              <Percent className="h-3 w-3" />{promo.discountPercentage}% OFF
            </div>
          )}
          {/* Expired/expiring badge */}
          {isExpired && (
            <div className="absolute top-3 right-3 bg-black/70 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              Expired
            </div>
          )}
          {expiresSoon && !isExpired && (
            <div className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" /> Ending soon
            </div>
          )}
          {/* Image nav dots */}
          {images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className={`rounded-full transition-all ${i === imgIdx ? 'bg-white w-4 h-1.5' : 'bg-white/50 w-1.5 h-1.5'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-bold text-base leading-snug flex-1">{promo.title}</h3>
          {promo.discountPercentage && !images.length && (
            <span className="bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-full flex-shrink-0">
              -{promo.discountPercentage}%
            </span>
          )}
        </div>

        {promo.description && (
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">{promo.description}</p>
        )}

        {/* Validity */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
          <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
          <span>
            Valid {new Date(promo.validFrom).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
            {' – '}
            {new Date(promo.validUntil).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>

        {/* Terms */}
        {promo.termsAndConditions && (
          <div className="mb-3 px-3 py-2 bg-muted/50 rounded-xl">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Terms</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{promo.termsAndConditions}</p>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={onContact}
          className={`w-full h-10 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
            hasWhatsapp
              ? 'bg-[#25d366] hover:bg-[#1ebe5d] text-white'
              : 'bg-primary hover:bg-primary/90 text-primary-foreground'
          }`}
        >
          <MessageCircle className="h-4 w-4" />
          {hasWhatsapp ? 'WhatsApp for This Deal' : 'Request This Deal'}
        </button>
      </div>
    </div>
  );
}
