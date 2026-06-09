import { useQuery } from "@tanstack/react-query";
import { SupplierPromotion, Supplier, User } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Link } from "wouter";
import {
  Loader2, Tag, Calendar, Building2, ArrowRight, Star, Percent, Sparkles,
  ChevronLeft, ChevronRight, Phone, Mail, MessageCircle, Eye, Clock,
  Zap, MapPin,
} from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import useEmblaCarousel from "embla-carousel-react";

type PromotionWithSupplier = SupplierPromotion & {
  supplier: Supplier & { user: User };
};

// ── Utilities ─────────────────────────────────────────────────────────────────

function getViewers(id: string | number): number {
  const str = String(id);
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return 4 + Math.abs(h) % 20;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useCountdown(validUntil: string | Date) {
  const target = useMemo(() => new Date(validUntil as string).getTime(), [validUntil]);

  const calc = useCallback(() => {
    const diff = Math.max(0, Math.floor((target - Date.now()) / 1000));
    return {
      days: Math.floor(diff / 86400),
      hours: Math.floor((diff % 86400) / 3600),
      minutes: Math.floor((diff % 3600) / 60),
      seconds: diff % 60,
      expired: diff === 0,
      totalSeconds: diff,
    };
  }, [target]);

  const [state, setState] = useState(calc);

  useEffect(() => {
    const id = setInterval(() => setState(calc()), 1000);
    return () => clearInterval(id);
  }, [calc]);

  const color = state.expired
    ? "text-muted-foreground"
    : state.totalSeconds < 86400
      ? "text-red-500"
      : state.totalSeconds < 172800
        ? "text-amber-500"
        : "text-emerald-500";

  return { ...state, color };
}

function useAnimatedCount(target: number, duration = 1400) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = Date.now();
          const tick = () => {
            const p = Math.min((Date.now() - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setCount(Math.round(eased * target));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);

  return { count, ref };
}

function useInView() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setInView(true); obs.disconnect(); }
      },
      { threshold: 0.08 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return { ref, inView };
}

// ── DealTicker ────────────────────────────────────────────────────────────────

function DealTicker({ promos }: { promos: PromotionWithSupplier[] }) {
  if (!promos.length) return null;
  const doubled = [...promos, ...promos];

  return (
    <div className="relative bg-[#162e2e] border-b border-white/10 py-2.5 overflow-hidden">
      {/* Static label */}
      <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center gap-2 px-4 bg-[#162e2e] border-r border-white/10 select-none">
        <Zap className="h-3.5 w-3.5 fill-orange-400 text-orange-400 flex-shrink-0" />
        <span className="text-orange-400 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Live Deals</span>
      </div>

      {/* Scrolling area */}
      <div className="ml-[110px] overflow-hidden">
        <div className="flex promo-ticker">
          {doubled.map((p, i) => (
            <span key={i} className="inline-flex items-center gap-2 px-5 text-sm text-white/85 whitespace-nowrap flex-shrink-0">
              {p.discountPercentage && (
                <span className="bg-orange-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded">
                  -{p.discountPercentage}%
                </span>
              )}
              <span className="font-semibold">{p.supplier.companyName}</span>
              <span className="text-white/40">—</span>
              <span className="text-white/70">{p.title}</span>
              <span className="text-orange-400/40 mx-2">✦</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── HeroCarousel ─────────────────────────────────────────────────────────────

const INDUSTRY_BG: Record<string, string> = {
  "Building Materials": "linear-gradient(135deg,#274345,#1a3a3a)",
  "Tools & Equipment":  "linear-gradient(135deg,#d97706,#b45309)",
  "Electrical":         "linear-gradient(135deg,#1d4ed8,#1e40af)",
  "Plumbing":           "linear-gradient(135deg,#0369a1,#075985)",
  "Furniture":          "linear-gradient(135deg,#92400e,#78350f)",
  "Paint & Coatings":   "linear-gradient(135deg,#7c3aed,#6d28d9)",
  "Hardware":           "linear-gradient(135deg,#065f46,#064e3b)",
};

function HeroCarousel({
  promos,
  onQuickView,
}: {
  promos: PromotionWithSupplier[];
  onQuickView: (p: PromotionWithSupplier) => void;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, skipSnaps: false });
  const [selected, setSelected] = useState(0);
  const [paused, setPaused]     = useState(false);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pausedRef = useRef(false);
  pausedRef.current = paused;

  const clearTimer = () => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } };

  const startAuto = useCallback(() => {
    clearTimer();
    if (pausedRef.current || !emblaApi || promos.length <= 1) return;
    timerRef.current = setTimeout(() => { if (!pausedRef.current) emblaApi.scrollNext(); }, 5000);
  }, [emblaApi, promos.length]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", () => setSelected(emblaApi.selectedScrollSnap()));
  }, [emblaApi]);

  useEffect(() => { startAuto(); return clearTimer; }, [startAuto, selected, paused]);

  if (!promos.length) {
    return (
      <div
        className="relative h-[220px] sm:h-[300px] md:h-[380px] overflow-hidden flex items-center justify-center"
        style={{ background: "linear-gradient(135deg,#1a3a3a 0%,#274345 50%,#2a4d4f 100%)" }}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 220" fill="none" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <path d="M-80 180 C40 60 200 260 380 80"  stroke="white" strokeWidth="50" strokeLinecap="round" opacity="0.06"/>
          <path d="M-40 280 C80 160 240 320 440 180" stroke="white" strokeWidth="35" strokeLinecap="round" opacity="0.06"/>
          <path d="M120 -40 C180 80 60 200 260 300"  stroke="white" strokeWidth="40" strokeLinecap="round" opacity="0.06"/>
        </svg>
        <div className="relative z-10 text-center px-6">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-2">Supplier Promotions</p>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white">Great Deals Coming Soon</h1>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative group select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {promos.map((promo) => {
            const images  = (promo.images as string[]) || [];
            const hasBg   = images.length > 0;
            const fallBg  = INDUSTRY_BG[promo.supplier.industryType ?? ""] ?? "linear-gradient(135deg,#F8992D,#d97406)";

            return (
              <div
                key={promo.id}
                className="flex-[0_0_100%] relative h-[220px] sm:h-[300px] md:h-[400px] overflow-hidden cursor-pointer"
                onClick={() => onQuickView(promo)}
              >
                {/* Background */}
                {hasBg ? (
                  <img src={images[0]} alt={promo.title} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0" style={{ background: fallBg }} />
                )}

                {/* Gradient overlays — left text area + right fade */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-black/10" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                {/* Text content — left aligned like Amazon */}
                <div className="absolute inset-0 flex items-center">
                  <div className="px-6 md:px-12 lg:px-16 max-w-lg">
                    {/* Supplier label */}
                    <p className="text-orange-400 text-[11px] font-bold uppercase tracking-widest mb-1.5">
                      {promo.supplier.companyName}
                    </p>

                    {/* Big title */}
                    <h2 className="text-white font-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-tight mb-3 line-clamp-3">
                      {promo.title}
                    </h2>

                    {/* Discount + CTA row */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {promo.discountPercentage && (
                        <span className="bg-orange-500 text-white text-sm font-black px-3 py-1.5 rounded-lg">
                          Save {promo.discountPercentage}%
                        </span>
                      )}
                      <button
                        className="bg-white hover:bg-orange-50 text-black text-sm font-bold px-5 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-lg"
                        onClick={(e) => { e.stopPropagation(); onQuickView(promo); }}
                      >
                        Shop now <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Slide number */}
                <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                  {promos.indexOf(promo) + 1} / {promos.length}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Arrow buttons — Amazon style, outside image on desktop */}
      {promos.length > 1 && (
        <>
          <button
            onClick={() => emblaApi?.scrollPrev()}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 h-full px-3 flex items-center bg-gradient-to-r from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <div className="bg-white/90 hover:bg-white text-black rounded-full h-10 w-10 flex items-center justify-center shadow-xl transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </div>
          </button>
          <button
            onClick={() => emblaApi?.scrollNext()}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 h-full px-3 flex items-center bg-gradient-to-l from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <div className="bg-white/90 hover:bg-white text-black rounded-full h-10 w-10 flex items-center justify-center shadow-xl transition-colors">
              <ChevronRight className="h-5 w-5" />
            </div>
          </button>
        </>
      )}

      {/* Dot indicators */}
      {promos.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {promos.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              className={`rounded-full transition-all duration-300 ${i === selected ? "bg-white w-5 h-1.5" : "bg-white/40 w-1.5 h-1.5 hover:bg-white/70"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── HeroSection ───────────────────────────────────────────────────────────────

function HeroSection({
  totalPromos, suppliers, promos, onQuickView,
}: {
  totalPromos: number;
  suppliers: number;
  promos: PromotionWithSupplier[];
  onQuickView: (p: PromotionWithSupplier) => void;
}) {
  const dealsC = useAnimatedCount(totalPromos);
  const suppC  = useAnimatedCount(suppliers);
  const savC   = useAnimatedCount(75);

  return (
    <div>
      {/* Full-bleed Amazon-style carousel */}
      <HeroCarousel promos={promos} onQuickView={onQuickView} />

      {/* Stat counters below */}
      <div ref={dealsC.ref} className="container mx-auto px-4 py-5">
        <div className="promo-hero-in-4 grid grid-cols-3 gap-3 max-w-sm mx-auto">
          {[
            { label: "Live Deals",  count: dealsC.count, icon: Tag,       color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20",  border: "border-orange-200 dark:border-orange-800/40" },
            { label: "Suppliers",   count: suppC.count,  icon: Building2, color: "text-teal-600",   bg: "bg-teal-50 dark:bg-teal-900/20",      border: "border-teal-200 dark:border-teal-800/40" },
            { label: "Up to % off", count: savC.count,   icon: Percent,   color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-900/20",  border: "border-yellow-200 dark:border-yellow-800/40" },
          ].map(({ label, count, icon: Icon, color, bg, border }) => (
            <div key={label} className={`${bg} border ${border} rounded-2xl px-3 py-4 text-center shadow-sm`}>
              <Icon className={`h-5 w-5 ${color} mx-auto mb-1.5`} />
              <p className={`text-2xl font-black ${color} leading-none`}>{count}</p>
              <p className="text-[10px] text-muted-foreground font-semibold mt-1 uppercase tracking-wide leading-tight">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── CountdownTimer ─────────────────────────────────────────────────────────────

function CountdownTimer({ validUntil }: { validUntil: string | Date }) {
  const { days, hours, minutes, seconds, expired, totalSeconds } = useCountdown(validUntil);

  if (expired) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-lg">
        <Clock className="h-3 w-3" /> Expired
      </span>
    );
  }

  const blockBg = totalSeconds < 86400
    ? "bg-red-500"
    : totalSeconds < 172800
      ? "bg-amber-500"
      : "bg-emerald-600";

  const units = days > 0
    ? [
        { val: String(days).padStart(2, "0"),     label: "d" },
        { val: String(hours).padStart(2, "0"),    label: "h" },
        { val: String(minutes).padStart(2, "0"),  label: "m" },
        { val: String(seconds).padStart(2, "0"),  label: "s" },
      ]
    : [
        { val: String(hours).padStart(2, "0"),    label: "h" },
        { val: String(minutes).padStart(2, "0"),  label: "m" },
        { val: String(seconds).padStart(2, "0"),  label: "s" },
      ];

  return (
    <div className="flex items-center gap-1">
      {units.map((u, i) => (
        <div key={u.label} className="flex items-center gap-1">
          {i > 0 && <span className="text-muted-foreground font-black text-xs mb-2 opacity-50">:</span>}
          <div className={`${blockBg} rounded-lg px-1.5 pt-1.5 pb-1 text-center min-w-[30px] shadow-sm`}>
            <div className="text-white font-black text-sm font-mono leading-none">{u.val}</div>
            <div className="text-white/70 text-[8px] font-bold uppercase leading-none mt-0.5">{u.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── QuickViewModal ─────────────────────────────────────────────────────────────

function QuickViewModal({
  promo, open, onClose,
}: {
  promo: PromotionWithSupplier | null;
  open: boolean;
  onClose: () => void;
}) {
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => { if (open) setImgIdx(0); }, [open, promo?.id]);

  if (!promo) return null;

  const images = (promo.images as string[]) || [];
  const phone  = promo.supplier.companyPhone || "";
  const email  = promo.supplier.companyEmail || "";
  const wa     = phone.replace(/\D/g, "");
  const waMsg  = encodeURIComponent(`Hi, I'm interested in your promotion: ${promo.title}`);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl w-[95vw] p-0 overflow-hidden rounded-2xl gap-0">
        {/* Image gallery */}
        <div className="relative bg-muted h-56 sm:h-72 overflow-hidden flex-shrink-0">
          {images.length > 0 ? (
            <img
              src={images[imgIdx]}
              alt={promo.title}
              className="w-full h-full object-cover transition-opacity duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a3a3a] to-[#274345]">
              <Tag className="h-16 w-16 text-white/20" />
            </div>
          )}

          {/* Badges overlay */}
          <div className="absolute top-4 left-4 flex gap-2">
            {promo.discountPercentage && (
              <span className="prom-badge bg-red-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg">
                -{promo.discountPercentage}% OFF
              </span>
            )}
            {promo.supplier.featured && (
              <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                FEATURED
              </span>
            )}
          </div>

          {/* Image nav */}
          {images.length > 1 && (
            <>
              <button
                onClick={() => setImgIdx((i) => (i - 1 + images.length) % images.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setImgIdx((i) => (i + 1) % images.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    className={`rounded-full transition-all ${i === imgIdx ? "bg-white w-4 h-1.5" : "bg-white/50 w-1.5 h-1.5"}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Supplier row */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted border border-border/50 flex items-center justify-center overflow-hidden flex-shrink-0">
              <img
                src={promo.supplier.logo || "/supplier-logo-fallback.png"}
                alt={promo.supplier.companyName}
                className="w-full h-full object-contain p-0.5"
                onError={(e) => { (e.target as HTMLImageElement).src = "/supplier-logo-fallback.png"; }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Supplied by</p>
              <p className="font-bold text-foreground leading-tight truncate">{promo.supplier.companyName}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{getViewers(promo.id)} viewing</span>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-black text-foreground mb-1.5 leading-snug">{promo.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{promo.description}</p>
          </div>

          {/* Countdown row */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
              <Clock className="h-3 w-3" /> Deal expires in
            </span>
            <CountdownTimer validUntil={promo.validUntil as unknown as string} />
          </div>

          {/* CTA buttons */}
          <div className={`grid gap-2.5 ${(wa ? 1 : 0) + (phone ? 1 : 0) + (email ? 1 : 0) >= 3 ? "grid-cols-3" : (wa || phone || email) ? "grid-cols-2" : "grid-cols-1"}`}>
            {wa && (
              <a
                href={`https://wa.me/${wa}?text=${waMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#25d366] hover:bg-[#1ebe5d] text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            )}
            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
              >
                <Phone className="h-4 w-4" /> Call
              </a>
            )}
            {email && (
              <a
                href={`mailto:${email}?subject=${encodeURIComponent(`Inquiry: ${promo.title}`)}`}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
              >
                <Mail className="h-4 w-4" /> Email
              </a>
            )}
            {!wa && !phone && !email && (
              <Link href={`/suppliers/${promo.supplier.userId}`}>
                <a className="flex items-center justify-center gap-2 bg-primary text-white text-sm font-bold py-2.5 rounded-xl w-full">
                  <ArrowRight className="h-4 w-4" /> View Supplier
                </a>
              </Link>
            )}
          </div>

          {/* View full supplier */}
          <Link href={`/suppliers/${promo.supplier.userId}`}>
            <a className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
              View full supplier profile <ArrowRight className="h-3 w-3" />
            </a>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── FeaturedCarousel (auto-play + progress bar + dot nav) ─────────────────────

const SLIDE_MS = 5000;

function FeaturedCarousel({
  promos,
  onQuickView,
}: {
  promos: PromotionWithSupplier[];
  onQuickView: (p: PromotionWithSupplier) => void;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start", skipSnaps: false });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);

  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const pausedRef   = useRef(false);

  pausedRef.current = paused;

  const clearTimers = () => {
    if (timerRef.current)  { clearTimeout(timerRef.current);  timerRef.current  = null; }
    if (progRef.current)   { clearInterval(progRef.current);  progRef.current   = null; }
  };

  const startAuto = useCallback(() => {
    if (!emblaApi || promos.length <= 1) return;
    clearTimers();
    if (pausedRef.current) return;
    setProgress(0);
    const t0 = Date.now();
    progRef.current = setInterval(() => {
      setProgress(Math.min(((Date.now() - t0) / SLIDE_MS) * 100, 100));
    }, 50);
    timerRef.current = setTimeout(() => {
      if (!pausedRef.current) emblaApi.scrollNext();
    }, SLIDE_MS);
  }, [emblaApi, promos.length]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", () => setSelectedIndex(emblaApi.selectedScrollSnap()));
  }, [emblaApi]);

  useEffect(() => {
    startAuto();
    return clearTimers;
  }, [startAuto, selectedIndex, paused]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <div className="relative group">
      <div
        className="overflow-hidden rounded-2xl"
        ref={emblaRef}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="flex -ml-4 md:-ml-6">
          {promos.map((promo) => {
            const images = (promo.images as string[]) || [];
            return (
              <div key={promo.id} className="flex-[0_0_100%] md:flex-[0_0_80%] lg:flex-[0_0_68%] pl-4 md:pl-6">
                <div
                  className="relative h-[340px] md:h-[440px] w-full rounded-2xl overflow-hidden cursor-pointer group/card border border-border/20 shadow-xl"
                  onClick={() => onQuickView(promo)}
                >
                  {images.length > 0 ? (
                    <img
                      src={images[0]}
                      alt={promo.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1a3a3a] to-[#274345]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge className="bg-orange-500 border-none text-white px-3 py-0.5 font-bold text-xs">
                        FEATURED
                      </Badge>
                      {promo.discountPercentage && (
                        <Badge variant="outline" className="text-white border-white/30 bg-white/10 backdrop-blur-sm text-xs font-bold">
                          SAVE {promo.discountPercentage}%
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-2xl md:text-3xl font-black mb-2 leading-tight group-hover/card:text-orange-400 transition-colors line-clamp-2">
                      {promo.title}
                    </h3>
                    <p className="text-white/65 text-sm md:text-base mb-5 line-clamp-2">
                      {promo.description}
                    </p>

                    <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/10">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                          <img
                            src={promo.supplier.logo || "/supplier-logo-fallback.png"}
                            alt={promo.supplier.companyName}
                            className="w-full h-full object-contain p-0.5"
                            onError={(e) => { (e.target as HTMLImageElement).src = "/supplier-logo-fallback.png"; }}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-orange-400 text-[10px] font-bold uppercase tracking-wider">Supplied by</p>
                          <p className="text-white font-bold text-sm leading-tight truncate">
                            {promo.supplier.companyName}
                          </p>
                        </div>
                      </div>

                      <Button
                        className="bg-white text-black hover:bg-orange-500 hover:text-white transition-all rounded-full px-5 font-bold shadow-xl flex-shrink-0"
                        onClick={(e) => { e.stopPropagation(); onQuickView(promo); }}
                      >
                        Quick View <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress bar */}
      {promos.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/15 rounded-b-2xl overflow-hidden z-20 pointer-events-none">
          <div
            className="h-full bg-orange-400 rounded-full"
            style={{ width: `${paused ? progress : progress}%`, transition: paused ? "none" : "none" }}
          />
        </div>
      )}

      {/* Prev / Next */}
      {promos.length > 1 && (
        <>
          <Button
            size="icon"
            variant="ghost"
            onClick={scrollPrev}
            className="absolute left-5 top-1/2 -translate-y-1/2 bg-black/35 backdrop-blur-sm text-white rounded-full h-10 w-10 hover:bg-black/55 opacity-0 group-hover:opacity-100 transition-all z-20 hidden md:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={scrollNext}
            className="absolute right-5 top-1/2 -translate-y-1/2 bg-black/35 backdrop-blur-sm text-white rounded-full h-10 w-10 hover:bg-black/55 opacity-0 group-hover:opacity-100 transition-all z-20 hidden md:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}

      {/* Dot pagination */}
      {promos.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {promos.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              className={`rounded-full transition-all duration-300 ${
                i === selectedIndex
                  ? "bg-primary w-5 h-2"
                  : "bg-border w-2 h-2 hover:bg-muted-foreground"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── PromotionCard (stagger + countdown + Quick View) ──────────────────────────

function PromotionCard({
  promo,
  index,
  onQuickView,
}: {
  promo: PromotionWithSupplier;
  index: number;
  onQuickView: (p: PromotionWithSupplier) => void;
}) {
  const images   = (promo.images as string[]) || [];
  const mainImg  = images[0] ?? null;
  const { ref, inView } = useInView();
  const viewers  = useMemo(() => getViewers(promo.id), [promo.id]);
  const delay    = `${index * 80}ms`;

  return (
    <div
      ref={ref}
      className="group border border-border/50 bg-card rounded-2xl overflow-hidden flex flex-col shadow-sm hover:shadow-xl hover:-translate-y-1 transition-shadow duration-300 cursor-pointer"
      style={{
        opacity:   inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.5s ease ${delay}, transform 0.5s ease ${delay}`,
      }}
      onClick={() => onQuickView(promo)}
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted/30 flex-shrink-0">
        {mainImg ? (
          <img
            src={mainImg}
            alt={promo.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a3a3a]/10 to-[#274345]/15">
            <Tag className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}

        {/* Discount badge */}
        {promo.discountPercentage && (
          <div className="absolute top-3 left-3 prom-badge bg-red-500 text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
            <Percent className="h-3 w-3" />
            {promo.discountPercentage}% OFF
          </div>
        )}

        {/* Viewers pill */}
        <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1">
          <Eye className="h-2.5 w-2.5" />
          {viewers} viewing
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        {/* Supplier */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-muted/60 border border-border/40 flex items-center justify-center overflow-hidden flex-shrink-0">
            <img
              src={promo.supplier.logo || "/supplier-logo-fallback.png"}
              alt={promo.supplier.companyName}
              className="w-full h-full object-contain p-0.5"
              onError={(e) => { (e.target as HTMLImageElement).src = "/supplier-logo-fallback.png"; }}
            />
          </div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide truncate flex-1">
            {promo.supplier.companyName}
          </p>
        </div>

        <h3 className="font-bold text-foreground text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {promo.title}
        </h3>

        <p className="text-muted-foreground text-xs line-clamp-2 flex-1 leading-relaxed">
          {promo.description}
        </p>

        {/* Countdown */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Clock className="h-3 w-3" /> Ends in
          </span>
          <CountdownTimer validUntil={promo.validUntil as unknown as string} />
        </div>

        {/* CTA */}
        <button
          className="w-full h-9 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-bold transition-colors flex items-center justify-center gap-1.5 mt-auto"
          onClick={(e) => { e.stopPropagation(); onQuickView(promo); }}
        >
          Quick View <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function PromotionsPage() {
  const { data: promotions, isLoading } = useQuery<PromotionWithSupplier[]>({
    queryKey: ["/api/promotions/active"],
  });

  const [quickViewPromo, setQuickViewPromo] = useState<PromotionWithSupplier | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activePromotions = promotions?.filter((p) => p.isActive) || [];
  const featuredPromos   = activePromotions.filter((p) => p.supplier.featured);
  const regularPromos    = activePromotions.filter((p) => !p.supplier.featured);
  const gridPromos       = regularPromos.length > 0 ? regularPromos : featuredPromos;
  const uniqueSuppliers  = new Set(activePromotions.map((p) => p.supplierId)).size;

  return (
    <div className="min-h-screen bg-background">
      {/* ① Deal ticker */}
      {activePromotions.length > 0 && <DealTicker promos={activePromotions} />}

      {/* ② Hero section */}
      <HeroSection
        totalPromos={activePromotions.length}
        suppliers={uniqueSuppliers}
        promos={activePromotions}
        onQuickView={setQuickViewPromo}
      />

      {/* Quick View modal */}
      <QuickViewModal
        promo={quickViewPromo}
        open={!!quickViewPromo}
        onClose={() => setQuickViewPromo(null)}
      />

      {activePromotions.length === 0 ? (
        <div className="container mx-auto px-4 py-24 text-center">
          <div className="inline-flex w-20 h-20 bg-muted rounded-full items-center justify-center mb-6">
            <Tag className="h-10 w-10 text-muted-foreground/40" />
          </div>
          <h3 className="text-xl font-bold mb-2">No active promotions right now</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            We're working with our suppliers to bring you exclusive deals. Check back soon!
          </p>
        </div>
      ) : (
        <div className="container mx-auto px-4 pb-24 pt-12 space-y-16">

          {/* ③ Featured carousel */}
          {featuredPromos.length > 0 && (
            <section id="promo-grid">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-orange-500/10 rounded-xl">
                  <Sparkles className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Featured Partners</h2>
                  <p className="text-sm text-muted-foreground">Top-tier deals from premium suppliers</p>
                </div>
              </div>
              <FeaturedCarousel promos={featuredPromos} onQuickView={setQuickViewPromo} />
            </section>
          )}

          {/* ④⑤ Promotion cards grid */}
          {gridPromos.length > 0 && (
            <section id={featuredPromos.length === 0 ? "promo-grid" : undefined}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-primary/10 rounded-xl">
                  <Percent className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {regularPromos.length > 0 ? "Marketplace Offers" : "All Current Deals"}
                  </h2>
                  <p className="text-sm text-muted-foreground">Browse all discounts and limited-time deals</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {gridPromos.map((promo, i) => (
                  <PromotionCard
                    key={promo.id}
                    promo={promo}
                    index={i}
                    onQuickView={setQuickViewPromo}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
