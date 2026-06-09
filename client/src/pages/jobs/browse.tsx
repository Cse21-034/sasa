import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Clock, Search, SlidersHorizontal, X, Filter } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Link } from 'wouter';
import { useAuth } from '@/lib/auth-context';
import type { Job, Category } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

export default function BrowseJobs() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery]         = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy]                   = useState<string>('recent');
  const [statusFilter, setStatusFilter]       = useState<string>('all');
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

  // Provider: fetch only approved categories to show in filter
  const { data: approvedCategoryData } = useQuery<{ approvedCategories: number[] }>({
    queryKey: ['/api/provider/approved-categories'],
    enabled: user?.role === 'provider',
  });
  const approvedCategoryIds = approvedCategoryData?.approvedCategories ?? [];

  const allCategoryChips = [{ id: 'all', name: 'All' }, ...(categories ?? [])];

  // For providers: only show categories they're approved for
  const visibleCategoryChips = user?.role === 'provider'
    ? allCategoryChips.filter(c => c.id === 'all' || approvedCategoryIds.includes(Number(c.id)))
    : allCategoryChips;

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

  const hasActiveFilters = selectedCategory !== 'all' || statusFilter !== 'all' || sortBy !== 'recent';
  const resetFilters = () => { setSelectedCategory('all'); setStatusFilter('all'); setSortBy('recent'); };

  const statusOptions = [
    { value: 'all',         label: 'All Jobs',                                          count: statusCounts.all },
    { value: 'open',        label: user?.role === 'provider' ? 'Available' : 'Pending', count: statusCounts.open },
    { value: 'in-progress', label: 'In Progress',                                       count: statusCounts.inProgress },
    { value: 'completed',   label: 'Completed',                                         count: statusCounts.completed },
  ];

  const sortOptions = [
    { value: 'recent',   label: 'Newest first' },
    { value: 'urgent',   label: 'Urgent first' },
    { value: 'distance', label: 'Nearest first' },
  ];

  // ── Shared filter panel ──────────────────────────────────────────────────────
  const FilterPanel = () => (
    <div className="space-y-6">

      {/* Status */}
      <div>
        <h3 className="font-bold text-base mb-2">Status</h3>
        <div className="space-y-1">
          {statusOptions.map((s) => (
            <label key={s.value} className="flex items-center gap-2 cursor-pointer py-0.5">
              <input
                type="checkbox"
                checked={statusFilter === s.value}
                onChange={() => setStatusFilter(statusFilter === s.value ? 'all' : s.value)}
                className="w-4 h-4 rounded-none accent-black dark:accent-white cursor-pointer flex-shrink-0"
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
                  type="checkbox"
                  checked={sortBy === s.value}
                  onChange={() => setSortBy(sortBy === s.value ? 'recent' : s.value)}
                  className="w-4 h-4 rounded-none accent-black dark:accent-white cursor-pointer flex-shrink-0"
                />
                <span className="text-sm">{s.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Category */}
      {visibleCategoryChips.length > 1 && (
        <div>
          <h3 className="font-bold text-base mb-2">Category</h3>
          <div className="space-y-1">
            {visibleCategoryChips.map((cat) => (
              <label key={cat.id} className="flex items-center gap-2 cursor-pointer py-0.5">
                <input
                  type="checkbox"
                  checked={selectedCategory === String(cat.id)}
                  onChange={() => setSelectedCategory(selectedCategory === String(cat.id) ? 'all' : String(cat.id))}
                  className="w-4 h-4 rounded-none accent-black dark:accent-white cursor-pointer flex-shrink-0"
                />
                <span className="text-sm">{cat.name}</span>
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

      {/* ── Page title ── */}
      <div className="max-w-7xl mx-auto px-4 pt-8 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {user?.role === 'requester' ? 'My Jobs' : 'Browse Jobs'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {user?.role === 'requester'
                ? 'Manage your active service requests'
                : 'Find open service requests near you'}
            </p>
          </div>
          {user?.role === 'requester' && (
            <Link href="/post-job">
              <a className="flex-shrink-0 px-4 py-2 rounded-lg bg-foreground text-background font-semibold text-sm hover:opacity-80 transition-opacity shadow-sm">
                + Post Job
              </a>
            </Link>
          )}
        </div>
      </div>

      {/* ── Search bar ── */}
      <div className="border-b border-border/40 bg-card px-4 py-3 sticky top-14 md:top-20 z-10">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder={user?.role === 'requester' ? 'Search your jobs...' : 'Search jobs...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 h-10 rounded-lg border-2 border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 transition-colors"
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

      {/* ── Body ── */}
      <div className="max-w-7xl mx-auto px-4 py-8 pb-28 flex gap-10 items-start">

        {/* Left sidebar */}
        <aside className="hidden md:block w-56 flex-shrink-0 sticky top-36">
          <h2 className="text-2xl font-bold mb-6">Filters</h2>
          <FilterPanel />
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {!jobsLoading && (
            <p className="text-sm text-muted-foreground mb-5">
              {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
            </p>
          )}

          {/* Skeletons */}
          {jobsLoading && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
              {[1,2,3,4,5,6].map((i) => (
                <div key={i} className="rounded-xl border border-border/40 p-4 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          )}

          {/* Job grid */}
          {!jobsLoading && filteredJobs.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
              {filteredJobs.map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <a data-testid={`card-job-${job.id}`}>
                    <div className="rounded-2xl border border-border/50 bg-card shadow-[0_4px_12px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.18),0_8px_16px_rgba(0,0,0,0.10)] hover:scale-[1.03] hover:-translate-y-1 transition-all duration-200 overflow-hidden will-change-transform">
                      <div className="p-4 space-y-2.5">
                        {/* Status + urgency */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            job.status === 'open'      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' :
                            job.status === 'completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' :
                                                         'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                          }`}>
                            {job.status === 'open' ? '● Open' : job.status === 'completed' ? '✓ Done' : '↻ Active'}
                          </span>
                          {job.urgency === 'emergency' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">
                              Urgent
                            </span>
                          )}
                        </div>
                        {/* Title */}
                        <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2">
                          {job.title}
                        </h3>
                        {/* Category + date */}
                        <p className="text-xs text-muted-foreground">
                          {job.category?.name || 'General'} · {new Date(job.createdAt).toLocaleDateString()}
                        </p>
                        {/* Description */}
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {job.description}
                        </p>
                        {/* Footer */}
                        <div className="border-t border-border/20 pt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1 min-w-0">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{job.address || 'Location TBD'}</span>
                          </div>
                          {job.expiryDate && new Date(job.expiryDate).getTime() - Date.now() < 86400000 && (
                            <div className="flex items-center gap-1 font-medium flex-shrink-0">
                              <Clock className="h-3 w-3" />
                              Soon
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
              <div className="w-14 h-14 rounded-xl bg-neutral-900 flex items-center justify-center mx-auto mb-4">
                <Filter className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-1">
                {user?.role === 'requester' ? 'No jobs found' : 'No jobs available'}
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                {user?.role === 'requester'
                  ? 'Try adjusting your filters or post a new job'
                  : 'Try adjusting your filters or check back later'}
              </p>
              {user?.role === 'requester' && (
                <Link href="/post-job">
                  <a className="inline-block px-5 py-2.5 rounded-xl bg-foreground text-background font-semibold text-sm hover:opacity-80 transition-opacity">
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
