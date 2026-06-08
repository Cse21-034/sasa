import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Filter, Clock, Search, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';
import { useAuth } from '@/lib/auth-context';
import type { Job, Category } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

const CATEGORY_GRADIENTS: Record<string, string> = {
  'Plumbing':   'linear-gradient(135deg, #2563eb, #1742b8)',
  'Electrical': 'linear-gradient(135deg, #f6a01a, #e07b00)',
  'Carpentry':  'linear-gradient(135deg, #16a06a, #0d7d4f)',
  'Painting':   'linear-gradient(135deg, #7c5cff, #5a36e0)',
  'Cleaning':   'linear-gradient(135deg, #274345, #1a3a3a)',
  'Mechanics':  'linear-gradient(135deg, #ef4444, #b91c1c)',
  'Gardening':  'linear-gradient(135deg, #65a30d, #4d7c0f)',
};
const DEFAULT_GRADIENT = 'linear-gradient(135deg, #F8992D, #d97406)';

const CATEGORY_ICONS: Record<string, string> = {
  'Plumbing': '🔧', 'Electrical': '⚡', 'Carpentry': '🔨',
  'Painting': '🎨', 'Cleaning': '🧹', 'Mechanics': '🚗', 'Gardening': '🌿',
};

function getCategoryGradient(name?: string) {
  return name ? (CATEGORY_GRADIENTS[name] ?? DEFAULT_GRADIENT) : DEFAULT_GRADIENT;
}

function getInitials(title: string) {
  return title.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export default function BrowseJobs() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          'radial-gradient(900px 500px at 10% -5%, rgba(249,153,45,.10), transparent 55%), radial-gradient(700px 500px at 95% 0%, rgba(39,67,69,.08), transparent 50%), #f3efe7',
      }}
    >
      {/* ── Hero ── */}
      <div className="px-4 pt-8 pb-5 max-w-7xl mx-auto">
        <h1 className="font-display font-extrabold text-3xl md:text-4xl text-foreground mb-1">
          {user?.role === 'requester' ? (
            <>
              <em
                className="not-italic"
                style={{ background: 'linear-gradient(90deg,#F8992D,#274345)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
              >
                My
              </em>{' '}
              Jobs
            </>
          ) : (
            <>
              Find{' '}
              <em
                className="not-italic"
                style={{ background: 'linear-gradient(90deg,#F8992D,#274345)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
              >
                Jobs
              </em>{' '}
              Near You
            </>
          )}
        </h1>
        <p className="text-muted-foreground text-base mb-5">
          {user?.role === 'requester' ? 'Manage your service requests' : 'Browse open service requests in your area'}
        </p>

        {/* Search row */}
        <div className="bg-white rounded-2xl shadow-md border border-black/5 p-3 flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search jobs by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 h-11 rounded-xl bg-muted/30 border border-transparent focus:border-primary/40 focus:bg-white outline-none text-sm transition-all"
              data-testid="input-search-jobs"
            />
          </div>
          <div className="relative sm:w-40">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Location..."
              className="w-full pl-9 pr-3 h-11 rounded-xl bg-muted/30 border border-transparent focus:border-primary/40 focus:bg-white outline-none text-sm transition-all"
            />
          </div>
          <button className="h-11 px-5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 flex-shrink-0">
            <Search className="h-4 w-4" /> Search
          </button>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {categoryChips.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(String(cat.id))}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                selectedCategory === String(cat.id)
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-white text-foreground border-border/50 hover:border-primary/40 hover:bg-primary/5'
              }`}
            >
              {cat.id !== 'all' && CATEGORY_ICONS[(cat as Category).name]
                ? `${CATEGORY_ICONS[(cat as Category).name]} `
                : ''}
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-7xl mx-auto px-4 pb-24 flex gap-6 items-start">

        {/* Desktop Filter Rail */}
        <aside className="hidden lg:block w-44 flex-shrink-0 sticky top-20">
          <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-4 space-y-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Status</p>
              <div className="space-y-2.5">
                {[
                  { value: 'all', label: 'All Jobs', count: statusCounts.all },
                  { value: 'open', label: user?.role === 'provider' ? 'Available' : 'Pending', count: statusCounts.open },
                  { value: 'in-progress', label: 'In Progress', count: statusCounts.inProgress },
                  { value: 'completed', label: 'Completed', count: statusCounts.completed },
                ].map((s) => (
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

            {user?.role === 'provider' && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Sort By</p>
                <div className="space-y-2.5">
                  {[
                    { value: 'recent', label: 'Newest' },
                    { value: 'urgent', label: '🚨 Urgent' },
                    { value: 'distance', label: '📍 Nearest' },
                  ].map((s) => (
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
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Grid header row */}
          <div className="flex items-center justify-between mb-4">
            <p className="font-display font-bold text-lg text-foreground">
              {filteredJobs ? filteredJobs.length : '—'}
              <span className="font-normal text-muted-foreground text-base ml-1">jobs found</span>
            </p>
            {/* Mobile status select */}
            <div className="lg:hidden">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm border border-border/50 rounded-xl px-3 py-2 bg-white text-foreground outline-none"
              >
                <option value="all">All Jobs</option>
                <option value="open">{user?.role === 'provider' ? 'Available' : 'Pending'}</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
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
                <div key={i} className="bg-white rounded-2xl p-4 border border-black/5 space-y-3">
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
                      className="bg-white rounded-2xl border border-black/5 hover:border-primary/30 hover:shadow-lg transition-all duration-200 cursor-pointer group overflow-hidden"
                      data-testid={`card-job-${job.id}`}
                    >
                      <div className="p-4">
                        {/* Card header */}
                        <div className="flex gap-3 items-start mb-3">
                          <div
                            className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-bold text-sm select-none"
                            style={{ background: getCategoryGradient(job.category?.name) }}
                          >
                            {getInitials(job.title)}
                          </div>
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
            <div className="bg-white rounded-2xl border-2 border-dashed border-border/40 p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: DEFAULT_GRADIENT }}
                >
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
