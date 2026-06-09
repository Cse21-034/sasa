import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Phone, Mail, Star, ExternalLink, Building2, SlidersHorizontal, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Link } from 'wouter';
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

export default function Suppliers() {
  const [searchQuery, setSearchQuery]               = useState('');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [featuredOnly, setFeaturedOnly]             = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen]     = useState(false);

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/suppliers');
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

  const featuredCount = useMemo(
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

  const hasActiveFilters = selectedIndustries.length > 0 || featuredOnly || !!searchQuery;
  const resetFilters = () => { setSelectedIndustries([]); setFeaturedOnly(false); setSearchQuery(''); };

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-base mb-2">Type</h3>
        <label className="flex items-center gap-2 cursor-pointer py-0.5">
          <input
            type="checkbox"
            checked={featuredOnly}
            onChange={(e) => setFeaturedOnly(e.target.checked)}
            className="w-4 h-4 rounded-none accent-black dark:accent-white cursor-pointer"
          />
          <span className="text-sm flex-1">Featured only</span>
          <span className="text-xs text-muted-foreground">{featuredCount}</span>
        </label>
      </div>

      {industries.length > 0 && (
        <div>
          <h3 className="font-bold text-base mb-2">Industry</h3>
          <div className="space-y-1">
            {industries.map(({ name, count }) => (
              <label key={name} className="flex items-center gap-2 cursor-pointer py-0.5">
                <input
                  type="checkbox"
                  checked={selectedIndustries.includes(name)}
                  onChange={() => toggleIndustry(name)}
                  className="w-4 h-4 rounded-none accent-black dark:accent-white cursor-pointer"
                />
                <span className="text-sm flex-1">{name}</span>
                <span className="text-xs text-muted-foreground">{count}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {hasActiveFilters && (
        <button onClick={resetFilters} className="text-xs text-muted-foreground hover:text-foreground underline">
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">

      {/* Page title */}
      <div className="max-w-7xl mx-auto px-4 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-foreground">Suppliers</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Discover trusted suppliers for materials, tools and equipment
        </p>
      </div>

      {/* Search bar */}
      <div className="border-b border-border/40 bg-card px-4 py-3 sticky top-14 md:top-20 z-10">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search by company name, industry or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 h-10 rounded-lg border-2 border-primary/60 bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Sheet open={filterDrawerOpen} onOpenChange={setFilterDrawerOpen}>
            <SheetTrigger asChild>
              <button className="md:hidden relative h-10 w-10 flex-shrink-0 rounded-lg border-2 border-primary/60 bg-background flex items-center justify-center hover:bg-muted transition-colors">
                <SlidersHorizontal className="h-4 w-4 text-foreground/70" />
                {hasActiveFilters && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-foreground rounded-full" />}
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 flex flex-col">
              <SheetHeader className="pb-4 border-b border-border/30">
                <SheetTitle className="text-left text-xl font-bold">Filters</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto py-4">
                <FilterPanel />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 py-8 pb-28 flex gap-10 items-start">

        {/* Sidebar */}
        <aside className="hidden md:block w-56 flex-shrink-0 sticky top-36">
          <h2 className="text-2xl font-bold mb-6">Filters</h2>
          <FilterPanel />
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
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

          {/* Grid */}
          {!isLoading && filteredSuppliers.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
              {filteredSuppliers.map((supplier: any) => (
                <div
                  key={supplier.userId}
                  className="rounded-2xl border border-border/50 bg-card shadow-[0_4px_12px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.18),0_8px_16px_rgba(0,0,0,0.10)] hover:scale-[1.03] hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col will-change-transform"
                >
                  {/* Logo area */}
                  <div className="h-28 bg-muted/40 flex items-center justify-center flex-shrink-0 border-b border-border/30">
                    <img
                      src={supplier.logo || '/supplier-logo-fallback.png'}
                      alt={supplier.companyName}
                      className="h-16 w-auto max-w-[80%] object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/supplier-logo-fallback.png'; }}
                    />
                  </div>

                  {/* Body */}
                  <div className="p-4 flex flex-col flex-1 gap-2">
                    {/* Name */}
                    <h3 className="font-bold text-foreground text-sm leading-snug line-clamp-1">
                      {supplier.companyName}
                    </h3>

                    {/* Industry */}
                    {supplier.industryType && (
                      <span className="self-start text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                        {supplier.industryType}
                      </span>
                    )}

                    {/* Rating */}
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                      <span className="text-sm font-semibold">{supplier.ratingAverage || '0.0'}</span>
                      <span className="text-xs text-muted-foreground">({supplier.reviewCount || 0} reviews)</span>
                    </div>

                    {/* Contact details */}
                    <div className="space-y-1 text-xs text-muted-foreground flex-1">
                      {supplier.physicalAddress && (
                        <div className="flex items-start gap-1.5">
                          <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{supplier.physicalAddress}</span>
                        </div>
                      )}
                      {supplier.companyEmail && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{supplier.companyEmail}</span>
                        </div>
                      )}
                      {supplier.companyPhone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          <span>{supplier.companyPhone}</span>
                        </div>
                      )}
                    </div>

                    {/* Button */}
                    <Link href={`/suppliers/${supplier.userId}`}>
                      <a className="mt-2 w-full h-9 rounded-lg border border-primary text-primary text-sm font-semibold hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-1.5">
                        <ExternalLink className="h-3.5 w-3.5" />
                        View Details
                      </a>
                    </Link>
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
              <p className="text-muted-foreground text-sm">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
