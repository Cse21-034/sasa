import { useQuery } from '@tanstack/react-query';
import { FileText, Download, Calendar, TrendingUp, DollarSign, Briefcase } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';

export default function Reports() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['reports', user?.role],
    queryFn: async () => {
      const endpoint = user?.role === 'provider' ? '/api/reports/provider' : '/api/reports/requester';
      const response = await apiRequest('GET', endpoint);
      return response.json();
    },
    enabled: !!user,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/categories');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="border-2">
              <CardHeader>
                <Skeleton className="h-4 w-32 mb-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories?.find((c: any) => c.id === parseInt(categoryId));
    return category?.name || 'Unknown';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Reports & Analytics</h1>
        <p className="text-muted-foreground">
          {user?.role === 'provider' 
            ? 'View your performance and earnings'
            : 'View detailed reports about your service requests'
          }
        </p>
      </div>

      {/* Summary Cards */}
      {user?.role === 'requester' && (
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs Posted</CardTitle>
              <Briefcase className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalJobs}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-success">{stats.completedJobs}</span> completed
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.completedJobs} of {stats.totalJobs} jobs
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalSpent.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Across all services
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {user?.role === 'provider' && (
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalEarnings}</div>
              <p className="text-xs text-muted-foreground">
                From completed jobs
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jobs Completed</CardTitle>
              <Briefcase className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedJobs}</div>
              <p className="text-xs text-muted-foreground">
                All time
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageRating}</div>
              <p className="text-xs text-muted-foreground">
                From clients
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reports Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Reports</TabsTrigger>
          <TabsTrigger value="export">Export Data</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {user?.role === 'requester' && stats.jobsByCategory && (
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Jobs by Category</CardTitle>
                <CardDescription>Distribution of your service requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(stats.jobsByCategory).map(([catId, count]: [string, any]) => {
                    const percentage = (count / stats.totalJobs) * 100;
                    return (
                      <div key={catId} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{getCategoryName(catId)}</span>
                          <span className="text-muted-foreground">{count} jobs</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-2">
            <CardHeader>
              <CardTitle>Activity Chart</CardTitle>
              <CardDescription>Your activity over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">
                  {user?.role === 'provider' 
                    ? 'Earnings and job completion chart'
                    : 'Job posting activity chart'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>
                {user?.role === 'provider' ? 'Recent Jobs' : 'Job History'}
              </CardTitle>
              <CardDescription>Detailed breakdown of your jobs</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentJobs && stats.recentJobs.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentJobs.map((job: any) => (
                    <Link key={job.id} href={`/jobs/${job.id}`}>
                      <a>
                        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                          <div className="space-y-1 flex-1">
                            <p className="font-medium">{job.title}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                              {job.category && (
                                <>
                                  <span>•</span>
                                  <span>{job.category.name}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant={job.status === 'completed' ? 'default' : 'secondary'}>
                              {job.status}
                            </Badge>
                            {(job.amountPaid || job.providerCharge) && (
                              <span className="font-semibold">
                                ${job.amountPaid || job.providerCharge}
                              </span>
                            )}
                          </div>
                        </div>
                      </a>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No jobs found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Export Reports</CardTitle>
              <CardDescription>Download your data in various formats</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="border-2">
                  <CardContent className="pt-6">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">Monthly Report</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Summary of all jobs from the past month
                    </p>
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardContent className="pt-6">
                    <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">Custom Date Range</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Export data for a specific time period
                    </p>
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Select & Download
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardContent className="pt-6">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">Transaction History</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      All payment and transaction records
                    </p>
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download CSV
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardContent className="pt-6">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">Analytics Report</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Detailed analytics and insights
                    </p>
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download Excel
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
