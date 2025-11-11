import { useQuery } from '@tanstack/react-query';
import { Loader2, Briefcase, DollarSign, Users, TrendingUp, CheckCircle2, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface AnalyticsData {
    totalJobs: number;
    completedJobs: number;
    jobsByStatus: { status: string; count: number }[];
    topProviders: { id: string; name: string; completedJobs: number; rating: string }[];
}

const useAdminAnalytics = () => {
  return useQuery<AnalyticsData>({
    queryKey: ['adminAnalytics'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/analytics');
      return res.json();
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });
};

export default function AdminAnalytics() {
  const { data: stats, isLoading } = useAdminAnalytics();
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  const completionRate = stats?.totalJobs ? ((stats.completedJobs / stats.totalJobs) * 100).toFixed(1) : '0';
  const totalJobs = stats?.totalJobs || 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <TrendingUp className="h-7 w-7 text-primary" />
            Jobs Analytics
        </h1>
        <p className="text-muted-foreground">Platform-wide job performance and provider metrics.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
              <Briefcase className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalJobs}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Jobs</CardTitle>
              <CheckCircle2 className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.completedJobs}</div>
              <p className="text-xs text-muted-foreground">{completionRate}% Completion Rate</p>
            </CardContent>
          </Card>
          
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Provider</CardTitle>
              <Users className="h-5 w-5 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold truncate">
                  {stats?.topProviders[0]?.name || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                  {stats?.topProviders[0]?.completedJobs || 0} jobs / {stats?.topProviders[0]?.rating || 0} 
                  <span className='ml-1'>★</span>
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Earning</CardTitle>
              <DollarSign className="h-5 w-5 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">N/A</div>
              <p className="text-xs text-muted-foreground">Need price data</p>
            </CardContent>
          </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Jobs by Status Chart */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Jobs by Status</CardTitle>
            <CardDescription>Distribution of jobs across their lifecycle.</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.jobsByStatus && totalJobs > 0 ? (
                <div className="space-y-4">
                  {stats.jobsByStatus.map((item: any) => {
                    const percentage = (item.count / totalJobs) * 100;
                    return (
                      <div key={item.status} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium capitalize">{item.status}</span>
                          <span className="text-muted-foreground">{item.count} jobs</span>
                        </div>
                        <Progress value={percentage} className="w-full h-2" />
                      </div>
                    );
                  })}
                </div>
            ) : (
                <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground">
                    No job data available.
                </div>
            )}
          </CardContent>
        </Card>

        {/* Top Providers Table */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Top 5 Service Providers</CardTitle>
            <CardDescription>Ranked by number of completed jobs.</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.topProviders && stats.topProviders.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Rank</TableHead>
                            <TableHead>Provider</TableHead>
                            <TableHead>Rating</TableHead>
                            <TableHead className="text-right">Completed Jobs</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stats.topProviders.map((provider, index) => (
                            <TableRow key={provider.id}>
                                <TableCell className="font-medium">{index + 1}</TableCell>
                                <TableCell>{provider.name}</TableCell>
                                <TableCell className='flex items-center gap-1'>
                                    {provider.rating} 
                                    <Star className='h-3 w-3 fill-yellow-400 text-yellow-400' />
                                </TableCell>
                                <TableCell className="text-right">{provider.completedJobs}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                 <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground">
                    No provider data to rank.
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
