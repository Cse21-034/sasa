import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Clock, Search, SlidersHorizontal, X, Filter } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Link } from 'wouter';
import { useAuth } from '@/lib/auth-context';
import type { Job, Category } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

const CATEGORY_GRADIENTS: Record<string, string> = {
  'Plumbing':    'linear-gradient(135deg,#2563eb,#1742b8)',
  'Electrical':  'linear-gradient(135deg,#f6a01a,#e07b00)',
  'Carpentry':   'linear-gradient(135deg,#16a06a,#0d7d4f)',
  'Painting':    'linear-gradient(135deg,#7c5cff,#5a36e0)',
  'Cleaning':    'linear-gradient(135deg,#274345,#1a3a3a)',
  'Mechanics':   'linear-gradient(135deg,#ef4444,#b91c1c)',
  'Gardening':   'linear-gradient(135deg,#65a30d,#4d7c0f)',
};
const DEFAULT_GRADIENT = 'linear-gradient(135deg,#F8992D,#d97406)';
const getBanner = (name?: string) => name ? (CATEGORY_GRADIENTS[name] ?? DEFAULT_GRADIENT) : DEFAULT_GRADIENT;

export default function BrowseJobs() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery]     = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy]               = useState<string>('recent');
  const [statusFilter, setStatusFilter]   = useState<string>('all');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const { data: jobs, isLoading: jobsLoading } = useQuery<(Job & { requester: any; category: Category })[]>({
    queryKey: ['jobs', { category: selectedCategory, sort: sortBy }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      params.append('sort', sortBy);
      const url = `/api/jobs${params.toString() ? `?${params}` : ''}`;
      return (await apiRequest('GET', url)).json();
    },
  });

  const { data: categories } = useQuery<Category[]>({ queryKey: ['/api/categories'] });

  const statusCounts = useMemo(() => {
    if (!jobs) return { all: 0, open: 0, inProgress: 0, completed: 0 };
    return {
      all:        jobs.length,
      open:       jobs.filter(j => j.status === 'open').length,
      inProgress: jobs.filter(j => ['accepted','enroute','onsite'].includes(j.status)).length,
      completed:  jobs.filter(j => j.status === 'completed').length,
    };
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    if (!jobs) return [];
    return jobs.filter((job) => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || job.title.toLowerCase().includes(q) || job.description.toLowerCase().includes(q);
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'open'        && job.status === 'open') ||
        (statusFilter === 'completed'   && job.status === 'completed') ||
        (statusFilter === 'in-progress' && ['accepted','enroute','onsite'].includes(job.status));
      return matchSearch && matchStatus;
    });
  }, [jobs, searchQuery, statusFilter]);

  const categoryChips = [{ id: 'all', name: 'All' }, ...(categories ?? [])];
  const hasActiveFilters = selectedCategory !== 'all' || statusFilter !== 'all' || sortBy !== 'recent';

  const statusOptions = [
    { value: 'all',         label: 'All Jobs',                                          count: statusCounts.all },
    { value: 'open',        label: user?.role === 'provider' ? 'Available' : 'Pending', count: statusCounts.open },
    { value: 'in-progress', label: 'In Progress',                                       count: statusCounts.inProgress },
    { value: 'completed',   label: 'Completed',                                         count: statusCounts.completed },
  ];

  const sortOptions = [
    { value: 'recent',   label: 'Newest' },
    { value: 'urgent',   label: 'Urgent first' },
    { value: 'distance', label: 'Nearest' },
  ];

  const resetFilters = () => { setSelectedCategory('all'); setStatusFilter('all'); setSortBy('recent'); };

  // ── Shared filter panel content ─────────────────────────────────────────────
  const FilterPanel = ({ namePrefix }: { namePrefix: string }) => (
    <div className="space-y-6">
      {/* Status */}
      <div>
        <h3 className="font-bold text-base mb-2">Status</h3>
        <div className="space-y-1">
          {statusOptions.map((s) => (
            <label key={s.value} className="flex items-center gap-2 cursor-pointer py-0.5">
              <input
                type="radio"
                name={`${namePrefix}-status`}
                checked={statusFilter === s.value}
                onChange={() => setStatusFilter(s.value)}
                className="accent-primary w-4 h-4"
              />
              <span className="text-sm flex-1">{s.label}</span>
              <span className="text-xs text-muted-foreground">{s.count}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Sort — provider only */}
      {user?.role === 'provider' && (
        <div>
          <h3 className="font-bold text-base mb-2">Sort By</h3>
          <div className="space-y-1">
            {sortOptions.map((s) => (
              <label key={s.value} className="flex items-center gap-2 cursor-pointer py-0.5">
                <input
                  type="radio"
                  name={`${namePrefix}-sort`}
                  checked={sortBy === s.value}
                  onChange={() => setSortBy(s.value)}
                  className="accent-primary w-4 h-4"
                />
                <span className="text-sm">{s.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Category */}
      <div>
        <h3 className="font-bold text-base mb-2">Category</h3>
        <div className="space-y-1">
          {categoryChips.map((cat) => (
            <label key={cat.id} className="flex items-center gap-2 cursor-pointer py-0.5">
              <input
                type="radio"
                name={`${namePrefix}-category`}
                checked={selectedCategory === String(cat.id)}
                onChange={() => setSelectedCategory(String(cat.id))}
                className="accent-primary w-4 h-4"
              />
              <span className="text-sm">{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      {hasActiveFilters && (
        <button onClick={resetFilters} className="text-xs text-primary hover:underline">
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">

      {/* Search bar */}
      <div className="border-b border-border/40 bg-card px-4 py-3 sticky top-14 md:top-20 z-10">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder={user?.role === 'requester' ? 'Search your jobs...' : 'Search jobs...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 h-10 rounded-lg border border-border/60 bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              data-testid="input-search-jobs"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Mobile filter trigger */}
          <Sheet open={filterDrawerOpen} onOpenChange={setFilterDrawerOpen}>
            <SheetTrigger asChild>
              <button className="md:hidden relative h-10 w-10 flex-shrink-0 rounded-lg border border-border/60 bg-background flex items-center justify-center hover:bg-muted transition-colors">
                <SlidersHorizontal className="h-4 w-4 text-foreground/70" />
                {hasActiveFilters && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />}
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 flex flex-col">
              <SheetHeader className="pb-4 border-b border-border/30">
                <SheetTitle className="text-left text-xl font-bold">Filters</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto py-4">
                <FilterPanel namePrefix="drawer" />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 py-8 flex gap-8 items-start pb-24">

        {/* ── Left sidebar ── */}
        <aside className="hidden md:block w-56 flex-shrink-0 sticky top-36">
          <h2 className="text-xl font-bold mb-5">Filters</h2>
          <FilterPanel namePrefix="rail" />
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0">

          {/* Page title + count */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="font-extrabold text-xl text-foreground">
                {user?.role === 'requester' ? 'My Jobs' : 'Find Jobs Near You'}
              </h1>
              {!jobsLoading && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
                </p>
              )}
            </div>
            {user?.role === 'requester' && (
              <Link href="/post-job">
                <a className="flex-shrink-0 px-4 py-2 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm">
                  + Post Job
                </a>
              </Link>
            )}
          </div>

          {/* Skeletons */}
          {jobsLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1,2,3,4,5,6].map((i) => (
                <div key={i} className="rounded-xl border border-border/40 overflow-hidden">
                  <Skeleton className="h-32 w-full" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Job grid */}
          {!jobsLoading && filteredJobs.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredJobs.map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <a data-testid={`card-job-${job.id}`}>
                    <div className="rounded-xl border border-border/40 bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col">

                      {/* Banner */}
                      <div className="h-32 relative flex-shrink-0" style={{ background: getBanner(job.category?.name) }}>
                        <span className="absolute bottom-2 left-3 text-white/80 text-xs font-medium bg-black/20 px-2 py-0.5 rounded-full">
                          {job.category?.name || 'General'}
                        </span>
                        {job.urgency === 'emergency' && (
                          <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            🚨 Urgent
                          </span>
                        )}
                        <span className={`absolute top-2 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          job.status === 'open'      ? 'bg-emerald-500 text-white' :
                          job.status === 'completed' ? 'bg-blue-500 text-white' :
                                                       'bg-amber-500 text-white'
                        }`}>
                          {job.status === 'open' ? 'Open' : job.status === 'completed' ? 'Done' : 'Active'}
                        </span>
                      </div>

                      {/* Body */}
                      <div className="p-4 flex flex-col flex-1">
                        <h3 className="text-primary font-semibold text-base leading-snug line-clamp-2 group-hover:underline mb-1">
                          {job.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mb-2">
                          {new Date(job.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed flex-1">
                          {job.description}
                        </p>
                        <div className="border-t border-border/30 pt-2.5 mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1 min-w-0">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{job.address || 'Location TBD'}</span>
                          </div>
                          {job.expiryDate && new Date(job.expiryDate).getTime() - Date.now() < 86400000 && (
                            <div className="flex items-center gap-1 text-red-500 font-medium flex-shrink-0">
                              <Clock className="h-3 w-3" />
                              Expires soon
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  </a>
                </Link>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!jobsLoading && filteredJobs.length === 0 && (
            <div className="border-2 border-dashed border-border/40 rounded-xl p-14 text-center">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: DEFAULT_GRADIENT }}>
                <Filter className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-1">
                {user?.role === 'requester' ? 'No jobs found' : 'No jobs available'}
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                {user?.role === 'requester' ? 'Try adjusting your filters or post a new job' : 'Try adjusting your filters or check back later'}
              </p>
              {user?.role === 'requester' && (
                <Link href="/post-job">
                  <a className="inline-block px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors">
                    Post Your First Job
                  </a>
                </Link>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
