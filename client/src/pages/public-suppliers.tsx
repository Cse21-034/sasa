import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Phone, Star, Tag, ArrowRight, Building2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Link, useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';

const INDUSTRY_GRADIENTS: Record<string, string> = {
  'Building Materials': 'linear-gradient(135deg,#274345,#1a3a3a)',
  'Tools & Equipment':  'linear-gradient(135deg,#d97706,#b45309)',
  'Electrical':         'linear-gradient(135deg,#1d4ed8,#1e40af)',
  'Plumbing':           'linear-gradient(135deg,#0369a1,#075985)',
  'Furniture':          'linear-gradient(135deg,#92400e,#78350f)',
  'Paint & Coatings':   'linear-gradient(135deg,#7c3aed,#6d28d9)',
  'Hardware':           'linear-gradient(135deg,#065f46,#064e3b)',
};
const DEFAULT_GRADIENT = 'linear-gradient(135deg,#F8992D,#d97406)';
const getBanner = (industry?: string) =>
  industry ? (INDUSTRY_GRADIENTS[industry] ?? DEFAULT_GRADIENT) : DEFAULT_GRADIENT;

export default function PublicSuppliers() {
  const [searchQuery, setSearchQuery]           = useState('');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [featuredOnly, setFeaturedOnly]         = useState(false);
  const [, setLocation] = useLocation();

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['public-suppliers'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/public/suppliers');
      return res.json();
    },
  });

  const industries: { name: string; count: number }[] = useMemo(() => {
    if (!suppliers) return [];
    const map: Record<string, number> = {};
    suppliers.forEach((s: any) => {
      if (s.industryType) map[s.industryType] = (map[s.industryType] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [suppliers]);

  const featuredCount: number = useMemo(
    () => suppliers?.filter((s: any) => s.featured).length ?? 0,
    [suppliers],
  );

  const filteredSuppliers = useMemo(() => {
    if (!suppliers) return [];
    return suppliers.filter((s: any) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        s.companyName?.toLowerCase().includes(q) ||
        s.industryType?.toLowerCase().includes(q) ||
        s.physicalAddress?.toLowerCase().includes(q);
      const matchIndustry =
        selectedIndustries.length === 0 || selectedIndustries.includes(s.industryType);
      const matchFeatured = !featuredOnly || s.featured;
      return matchSearch && matchIndustry && matchFeatured;
    });
  }, [suppliers, searchQuery, selectedIndustries, featuredOnly]);

  const toggleIndustry = (name: string) =>
    setSelectedIndustries((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name],
    );

  return (
    <div className="min-h-screen bg-background">

      {/* Page title */}
      <div className="max-w-7xl mx-auto px-4 pt-8 pb-4 text-center">
        <h1 className="text-2xl font-bold text-foreground">Supplier Catalogue</h1>
        <p className="text-sm text-muted-foreground mt-1">Browse verified suppliers for materials, tools and equipment</p>
      </div>

      {/* Search bar */}
      <div className="border-b border-border/40 bg-card px-6 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by company name, industry or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 h-10 rounded-lg border border-border/60 bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 flex gap-8 items-start">

        {/* ── Filter sidebar ── */}
        <aside className="hidden md:block w-56 flex-shrink-0 sticky top-20">
          <h2 className="text-xl font-bold mb-5">Filters</h2>

          {/* Featured */}
          <div className="mb-6">
            <h3 className="font-bold text-base mb-2">Type</h3>
            <label className="flex items-center gap-2 cursor-pointer py-0.5">
              <input
                type="checkbox"
                checked={featuredOnly}
                onChange={(e) => setFeaturedOnly(e.target.checked)}
                className="accent-primary w-4 h-4"
              />
              <span className="text-sm">Featured only ({featuredCount})</span>
            </label>
          </div>

          {/* Industry */}
          {industries.length > 0 && (
            <div className="mb-6">
              <h3 className="font-bold text-base mb-2">Industry</h3>
              <div className="space-y-1">
                {industries.map(({ name, count }) => (
                  <label key={name} className="flex items-center gap-2 cursor-pointer py-0.5">
                    <input
                      type="checkbox"
                      checked={selectedIndustries.includes(name)}
                      onChange={() => toggleIndustry(name)}
                      className="accent-primary w-4 h-4"
                    />
                    <span className="text-sm">{name} ({count})</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Reset */}
          {(selectedIndustries.length > 0 || featuredOnly || searchQuery) && (
            <button
              onClick={() => { setSelectedIndustries([]); setFeaturedOnly(false); setSearchQuery(''); }}
              className="text-xs text-primary hover:underline mt-1"
            >
              Clear all filters
            </button>
          )}
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0">
          {/* Result count */}
          {!isLoading && (
            <p className="text-sm text-muted-foreground mb-5">
              {filteredSuppliers.length} supplier{filteredSuppliers.length !== 1 ? 's' : ''} found
            </p>
          )}

          {/* Skeletons */}
          {isLoading && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
              {[1,2,3,4,5,6].map((i) => (
                <div key={i} className="rounded-2xl border border-border/40 overflow-hidden">
                  <Skeleton className="h-36 w-full" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Supplier grid */}
          {!isLoading && filteredSuppliers.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
              {filteredSuppliers.map((supplier: any) => (
                <div
                  key={supplier.userId}
                  className="rounded-2xl border border-border/50 bg-card shadow-[0_4px_12px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.18),0_8px_16px_rgba(0,0,0,0.10)] hover:scale-[1.03] hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col will-change-transform"
                >
                  {/* Banner image area */}
                  <div
                    className="h-36 flex items-center justify-center relative flex-shrink-0"
                    style={{ background: getBanner(supplier.industryType) }}
                  >
                    {supplier.logo ? (
                      <img
                        src={supplier.logo}
                        alt={supplier.companyName}
                        className="h-20 w-auto object-contain drop-shadow-lg"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-white/90 font-extrabold text-2xl tracking-wide drop-shadow">
                          {supplier.companyName?.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                    {supplier.featured && (
                      <span className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Featured
                      </span>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="p-4 flex flex-col flex-1">
                    {/* Title */}
                    <button
                      onClick={() => setLocation('/login')}
                      className="text-primary font-semibold text-base text-left hover:underline leading-snug mb-1"
                    >
                      {supplier.companyName}
                    </button>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-semibold">{supplier.ratingAverage || '0.0'}</span>
                      <span className="text-xs text-muted-foreground">({supplier.reviewCount || 0} reviews)</span>
                      {supplier.industryType && (
                        <span className="ml-auto text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                          {supplier.industryType}
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="space-y-1 text-xs text-muted-foreground flex-1">
                      {supplier.physicalAddress && (
                        <div className="flex items-start gap-1.5">
                          <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-1">{supplier.physicalAddress}</span>
                        </div>
                      )}
                      {supplier.companyPhone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          <span>{supplier.companyPhone}</span>
                        </div>
                      )}
                      {supplier.contactPerson && (
                        <p>Contact: <span className="text-foreground font-medium">{supplier.contactPerson}</span></p>
                      )}
                    </div>

                    {/* Special offer */}
                    {supplier.specialOffer && (
                      <div className="mt-3 flex items-start gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg px-2.5 py-2">
                        <Tag className="h-3 w-3 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium line-clamp-2">{supplier.specialOffer}</p>
                      </div>
                    )}

                    {/* CTA */}
                    <button
                      onClick={() => setLocation('/login')}
                      className="mt-4 w-full h-9 rounded-lg border border-primary text-primary text-sm font-semibold hover:bg-primary hover:text-white transition-colors"
                    >
                      View Supplier
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {!isLoading && filteredSuppliers.length === 0 && (
            <div className="border-2 border-dashed border-border/40 rounded-xl p-14 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-1">No suppliers found</h3>
              <p className="text-muted-foreground text-sm">Try adjusting your filters or search term</p>
            </div>
          )}

          {/* Sign-up CTA */}
          <div className="mt-14 rounded-2xl bg-gradient-to-br from-[#1a3a3a] via-[#274345] to-[#2a4d4f] text-white p-8 md:p-10 text-center shadow-xl">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-3">Ready to connect with suppliers?</h2>
            <p className="text-white/70 mb-7 max-w-xl mx-auto text-sm md:text-base">
              Sign up for free to view full profiles, contact suppliers directly, and manage your projects.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/signup">
                <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-2.5 rounded-xl shadow-lg transition-colors flex items-center gap-2 mx-auto sm:mx-0">
                  Get Started Free <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <Link href="/login">
                <button className="border border-white/30 text-white hover:bg-white/10 px-8 py-2.5 rounded-xl transition-colors mx-auto sm:mx-0">
                  Log In
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
