import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Filter, Clock, Search, SlidersHorizontal, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Link } from 'wouter';
import { useAuth } from '@/lib/auth-context';
import type { Job, Category } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

const DEFAULT_GRADIENT = 'linear-gradient(135deg, #F8992D, #d97406)';

export default function BrowseJobs() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const { data: jobs, isLoading: jobsLoading } = useQuery<(Job & { requester: any; category: Category })[]>({
    queryKey: ['jobs', { category: selectedCategory, sort: sortBy }],
    queryFn: async () => {
      let url = '/api/jobs';
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      params.append('sort', sortBy);
      if (params.toString()) url += `?${params.toString()}`;
      const response = await apiRequest('GET', url);
      return response.json();
    },
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const filteredJobs = jobs?.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'open' && job.status === 'open') ||
      (statusFilter === 'completed' && job.status === 'completed') ||
      (statusFilter === 'in-progress' && ['accepted', 'enroute', 'onsite'].includes(job.status)) ||
      (statusFilter === 'pending' && job.status === 'open' && !job.providerId);
    return matchesSearch && matchesStatus;
  });

  const getStatusCounts = () => {
    if (!jobs) return { all: 0, open: 0, inProgress: 0, completed: 0 };
    return {
      all: jobs.length,
      open: jobs.filter(j => j.status === 'open').length,
      inProgress: jobs.filter(j => ['accepted', 'enroute', 'onsite'].includes(j.status)).length,
      completed: jobs.filter(j => j.status === 'completed').length,
    };
  };

  const statusCounts = getStatusCounts();
  const categoryChips = [{ id: 'all', name: 'All' }, ...(categories ?? [])];
  const hasActiveFilters = selectedCategory !== 'all' || statusFilter !== 'all' || sortBy !== 'recent';

  const statusOptions = [
    { value: 'all', label: 'All Jobs', count: statusCounts.all },
    { value: 'open', label: user?.role === 'provider' ? 'Available' : 'Pending', count: statusCounts.open },
    { value: 'in-progress', label: 'In Progress', count: statusCounts.inProgress },
    { value: 'completed', label: 'Completed', count: statusCounts.completed },
  ];

  const sortOptions = [
    { value: 'recent', label: 'Newest' },
    { value: 'urgent', label: '🚨 Urgent' },
    { value: 'distance', label: '📍 Nearest' },
  ];

  return (
    <div className="min-h-screen bg-background">

      {/* ── Title heading — all screens ── */}
      <div className="px-4 pt-5 pb-3 max-w-7xl mx-auto">
        <div className="w-[60%]">
          <h1 className="font-display font-extrabold text-xl md:text-3xl text-foreground mb-0.5">
            {user?.role === 'requester' ? 'My Jobs' : 'Find Jobs Near You'}
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm">
            {user?.role === 'requester' ? 'Manage your service requests' : 'Browse open service requests in your area'}
          </p>
        </div>
      </div>

      {/* ── Sticky search + filter icon ── */}
      <div className="sticky top-14 md:top-20 z-10 bg-background/95 backdrop-blur-sm border-b border-border/20">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex gap-2 items-center">

            {/* Pill search input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 h-10 rounded-full bg-muted/80 dark:bg-muted/50 border-0 outline-none text-sm transition-all placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/20"
                data-testid="input-search-jobs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter icon — only on mobile/tablet (lg+ has the side rail) */}
            <Sheet open={filterDrawerOpen} onOpenChange={setFilterDrawerOpen}>
              <SheetTrigger asChild>
                <button
                  className="lg:hidden relative h-10 w-10 flex-shrink-0 rounded-full bg-muted/80 dark:bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
                  aria-label="Open filters"
                >
                  <SlidersHorizontal className="h-4 w-4 text-foreground/70" />
                  {hasActiveFilters && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
                  )}
                </button>
              </SheetTrigger>

              <SheetContent side="right" className="w-72 flex flex-col">
                <SheetHeader className="pb-4 border-b border-border/30">
                  <SheetTitle className="text-left">Filters</SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto py-4 space-y-6">

                  {/* Category */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Category</p>
                    <div className="space-y-2.5">
                      {categoryChips.map((cat) => (
                        <label key={cat.id} className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="radio"
                            name="drawer-category"
                            checked={selectedCategory === String(cat.id)}
                            onChange={() => setSelectedCategory(String(cat.id))}
                            className="accent-primary"
                          />
                          <span className={`text-sm flex-1 leading-none ${selectedCategory === String(cat.id) ? 'font-semibold text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>
                            {cat.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Status</p>
                    <div className="space-y-2.5">
                      {statusOptions.map((s) => (
                        <label key={s.value} className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="radio"
                            name="drawer-status"
                            checked={statusFilter === s.value}
                            onChange={() => setStatusFilter(s.value)}
                            className="accent-primary"
                          />
                          <span className={`text-sm flex-1 leading-none ${statusFilter === s.value ? 'font-semibold text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>
                            {s.label}
                          </span>
                          <span className="text-xs text-muted-foreground">{s.count}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Sort — provider only */}
                  {user?.role === 'provider' && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Sort By</p>
                      <div className="space-y-2.5">
                        {sortOptions.map((s) => (
                          <label key={s.value} className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="radio"
                              name="drawer-sort"
                              checked={sortBy === s.value}
                              onChange={() => setSortBy(s.value)}
                              className="accent-primary"
                            />
                            <span className={`text-sm leading-none ${sortBy === s.value ? 'font-semibold text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>
                              {s.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                {/* Reset button */}
                {hasActiveFilters && (
                  <div className="pt-4 border-t border-border/30">
                    <button
                      onClick={() => { setSelectedCategory('all'); setStatusFilter('all'); setSortBy('recent'); }}
                      className="w-full h-10 rounded-xl border border-border/50 text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                    >
                      Reset all filters
                    </button>
                  </div>
                )}
              </SheetContent>
            </Sheet>

          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-7xl mx-auto px-4 pb-24 flex gap-6 items-start">

        {/* Desktop Filter Rail */}
        <aside className="hidden lg:block w-44 flex-shrink-0 sticky top-40">
          <div className="bg-card rounded-2xl shadow-sm border border-border/30 p-4 space-y-5">

            {/* Status */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Status</p>
              <div className="space-y-2.5">
                {statusOptions.map((s) => (
                  <label key={s.value} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="status"
                      checked={statusFilter === s.value}
                      onChange={() => setStatusFilter(s.value)}
                      className="accent-primary"
                    />
                    <span className={`text-sm flex-1 leading-none ${statusFilter === s.value ? 'font-semibold text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>
                      {s.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{s.count}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Sort By — provider only */}
            {user?.role === 'provider' && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Sort By</p>
                <div className="space-y-2.5">
                  {sortOptions.map((s) => (
                    <label key={s.value} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="sort"
                        checked={sortBy === s.value}
                        onChange={() => setSortBy(s.value)}
                        className="accent-primary"
                      />
                      <span className={`text-sm leading-none ${sortBy === s.value ? 'font-semibold text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>
                        {s.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Category */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Category</p>
              <div className="space-y-2.5">
                {categoryChips.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === String(cat.id)}
                      onChange={() => setSelectedCategory(String(cat.id))}
                      className="accent-primary"
                    />
                    <span className={`text-sm flex-1 leading-none truncate ${selectedCategory === String(cat.id) ? 'font-semibold text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>
                      {cat.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">

          {/* Grid header */}
          <div className="flex items-center justify-between mb-4 pt-4">
            <p className="font-display font-bold text-lg text-foreground">
              {filteredJobs ? filteredJobs.length : '—'}
              <span className="font-normal text-muted-foreground text-base ml-1">jobs found</span>
            </p>
          </div>

          {/* Post job CTA for requesters */}
          {user?.role === 'requester' && (
            <div className="mb-4">
              <Link href="/post-job">
                <a className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm">
                  + Post a New Job
                </a>
              </Link>
            </div>
          )}

          {/* Loading skeletons */}
          {jobsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-card rounded-2xl p-4 border border-border/30 space-y-3">
                  <div className="flex gap-3 items-center">
                    <Skeleton className="h-12 w-12 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              ))}
            </div>
          ) : filteredJobs && filteredJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredJobs.map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <a>
                    <div
                      className="bg-card rounded-2xl border border-border/30 hover:border-primary/30 hover:shadow-lg transition-all duration-200 cursor-pointer group overflow-hidden"
                      data-testid={`card-job-${job.id}`}
                    >
                      <div className="p-4">
                        {/* Card header */}
                        <div className="flex gap-2 items-start mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground text-base leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                              {job.title}
                            </h3>
                            <p className="text-muted-foreground text-xs mt-0.5">
                              {job.category?.name || 'General'} · {new Date(job.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          {job.urgency === 'emergency' && (
                            <span className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                              🚨 Urgent
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                          {job.description}
                        </p>

                        {/* Footer */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 text-muted-foreground text-xs min-w-0">
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">{job.address || 'Location TBD'}</span>
                          </div>
                          <span
                            className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
                              job.status === 'open'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : job.status === 'completed'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {job.status === 'open' ? '● Open' : job.status === 'completed' ? '✓ Done' : '↻ Active'}
                          </span>
                        </div>

                        {/* Expiry warning */}
                        {job.expiryDate && new Date(job.expiryDate).getTime() - Date.now() < 86400000 && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-red-500 font-medium">
                            <Clock className="h-3.5 w-3.5" />
                            Expires soon: {new Date(job.expiryDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </a>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-2xl border-2 border-dashed border-border/40 p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: DEFAULT_GRADIENT }}>
                  <Filter className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    {user?.role === 'requester' ? 'No jobs found' : 'No jobs available'}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {user?.role === 'requester'
                      ? 'Try adjusting your filters or create a new job request'
                      : 'Try adjusting your filters or check back later'}
                  </p>
                </div>
                {user?.role === 'requester' && (
                  <Link href="/post-job">
                    <a className="px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors">
                      Post Your First Job
                    </a>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
