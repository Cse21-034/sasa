import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Filter, CheckCircle2, Clock, Search, ListFilter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'wouter';
import { useAuth } from '@/lib/auth-context';
import type { Job, Category } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

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
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      params.append('sort', sortBy);
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      const response = await apiRequest('GET', url);
      return response.json();
    },
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
  });

  const filteredJobs = jobs?.filter((job) => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'open' && job.status === 'open') ||
      (statusFilter === 'completed' && job.status === 'completed') ||
      (statusFilter === 'in-progress' && ['accepted', 'enroute', 'onsite'].includes(job.status)) ||
      (statusFilter === 'pending' && job.status === 'open' && !job.providerId);
    
    return matchesSearch && matchesStatus;
  });

  const pageTitle = user?.role === 'requester' ? 'My Jobs' : 'Browse Jobs';
  const pageDescription = user?.role === 'requester'
    ? 'Manage your service requests'
    : 'Find service requests near you';

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{pageTitle}</h1>
        <p className="text-muted-foreground">{pageDescription}</p>
      </div>

      {/* Filters Section */}
      <Card className="mb-6 border-2">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search jobs by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
                data-testid="input-search-jobs"
              />
            </div>

            {/* Filter Tabs */}
            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
              <TabsList className="grid w-full grid-cols-4 h-12">
                <TabsTrigger value="all" className="relative">
                  All Jobs
                  <Badge variant="secondary" className="ml-2">{statusCounts.all}</Badge>
                </TabsTrigger>
                <TabsTrigger value="open">
                  {user?.role === 'provider' ? 'Available' : 'Pending'}
                  <Badge variant="secondary" className="ml-2">{statusCounts.open}</Badge>
                </TabsTrigger>
                <TabsTrigger value="in-progress">
                  In Progress
                  <Badge variant="secondary" className="ml-2">{statusCounts.inProgress}</Badge>
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed
                  <Badge variant="secondary" className="ml-2">{statusCounts.completed}</Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Additional Filters */}
            {user?.role === 'provider' && (
              <div className="flex items-center gap-2">
                <Button
                  variant={sortBy === 'urgent' ? 'default' : 'outline'}
                  onClick={() => setSortBy('urgent')}
                  className="h-12"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Urgent Jobs
                </Button>
                <Button
                  variant={sortBy === 'distance' ? 'default' : 'outline'}
                  onClick={() => setSortBy('distance')}
                  className="h-12"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Near Me
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Jobs Grid */}
      {jobsLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredJobs && filteredJobs.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`}>
              <a>
                <Card 
                  className="hover:shadow-lg hover:scale-105 transition-all duration-300 hover:border-primary/50 h-full group cursor-pointer" 
                  data-testid={`card-job-${job.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant={job.urgency === 'emergency' ? 'destructive' : 'secondary'}>
                          {job.urgency === 'emergency' ? '🚨 Emergency' : 'Normal'}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`${
                            job.status === 'open' 
                              ? 'bg-success/10 text-success border-success/20'
                              : job.status === 'completed'
                              ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                              : 'bg-warning/10 text-warning border-warning/20'
                          }`}
                        >
                          {job.status === 'open' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {job.status === 'completed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {['accepted', 'enroute', 'onsite'].includes(job.status) && <Clock className="h-3 w-3 mr-1" />}
                          {job.status}
                        </Badge>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {job.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {job.description}
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground truncate">{job.address || 'Location not specified'}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline" className="text-xs">
                          {job.category?.name || 'Uncategorized'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </a>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="border-2 border-dashed">
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-muted p-4">
                <Filter className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  {user?.role === 'requester' ? 'No jobs found' : 'No jobs available'}
                </h3>
                <p className="text-muted-foreground">
                  {user?.role === 'requester' 
                    ? 'Try adjusting your filters or create a new job request'
                    : 'Try adjusting your filters or check back later for new opportunities'
                  }
                </p>
              </div>
              {user?.role === 'requester' && (
                <Link href="/post-job">
                  <Button>Post Your First Job</Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
