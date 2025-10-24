import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Filter, SlidersHorizontal, Star, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';
import type { Job, Category } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

export default function BrowseJobs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');

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

  const filteredJobs = jobs?.filter((job) =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Enhanced Header */}
        <div className="mb-8 fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Browse Jobs</h1>
              <p className="text-muted-foreground">Find service requests near you</p>
            </div>
            <Badge className="badge-professional" variant="outline">
              {filteredJobs?.length || 0} Jobs Available
            </Badge>
          </div>
        </div>

        {/* Enhanced Filters */}
        <Card className="mb-8 card-hover glass-effect">
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 relative">
                <Input
                  placeholder="Search jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                  data-testid="input-search-jobs"
                />
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-12" data-testid="select-category">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-12" data-testid="select-sort">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="urgent">Urgent First</SelectItem>
                  <SelectItem value="distance">Nearest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Jobs Grid */}
        {jobsLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-0">
                  <Skeleton className="h-48 w-full" />
                  <div className="p-6 space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredJobs && filteredJobs.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-container">
            {filteredJobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <Card 
                  className="card-hover transition-all h-full group overflow-hidden" 
                  data-testid={`card-job-${job.id}`}
                >
                  <CardContent className="p-0">
                    {/* Card Header with Gradient */}
                    <div className={`p-6 pb-4 ${
                      job.urgency === 'emergency' 
                        ? 'bg-gradient-to-br from-destructive/10 to-destructive/5' 
                        : 'bg-gradient-to-br from-primary/5 to-secondary/5'
                    }`}>
                      <div className="flex items-start justify-between mb-3">
                        <Badge 
                          variant={job.urgency === 'emergency' ? 'destructive' : 'secondary'}
                          className="badge-professional"
                        >
                          {job.urgency === 'emergency' && <AlertCircle className="h-3 w-3 mr-1" />}
                          {job.urgency === 'emergency' ? 'Emergency' : 'Normal'}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-medium">
                          {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {job.title}
                      </h3>
                    </div>

                    {/* Card Body */}
                    <div className="p-6 pt-4 space-y-4">
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {job.description}
                      </p>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="text-muted-foreground truncate">
                            {job.address || 'Location not specified'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="badge-professional text-xs">
                            {job.category?.name || 'Uncategorized'}
                          </Badge>
                          {job.status === 'open' ? (
                            <Badge variant="outline" className="badge-professional text-xs bg-success/10 text-success border-success/20">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Open
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="badge-professional text-xs capitalize">
                              {job.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="px-6 pb-6 pt-2 border-t">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                        </div>
                        {job.urgency === 'emergency' && (
                          <span className="text-destructive font-medium">Urgent</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="glass-effect">
            <CardContent className="p-12 text-center fade-in-scale">
              <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
                <div className="rounded-full bg-muted p-6">
                  <Filter className="h-12 w-12 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your filters or search query to find more results
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="btn-professional mt-2"
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
