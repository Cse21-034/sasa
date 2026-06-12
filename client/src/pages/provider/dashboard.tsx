import { useQuery } from '@tanstack/react-query';
import { TrendingUp, DollarSign, Clock, Star, Briefcase, CheckCircle2, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth-context';
import { Link } from 'wouter';
import { formatPula } from '@/lib/utils';

export default function ProviderDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/provider/stats'],
  });

  const { data: recentJobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['/api/provider/recent-jobs'],
  });

  const statCards = [
    {
      title: 'Earnings',
      value: formatPula(stats?.totalEarnings || 0),
      icon: DollarSign,
      description: 'This month',
      accent: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      title: 'Completed',
      value: stats?.completedJobs || 0,
      icon: CheckCircle2,
      description: 'All time',
      accent: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Rating',
      value: stats?.averageRating ? Number(stats.averageRating).toFixed(1) : '—',
      icon: Star,
      description: 'From clients',
      accent: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      title: 'Response',
      value: stats?.avgResponseTime ? `${stats.avgResponseTime}m` : '—',
      icon: Clock,
      description: 'Avg time',
      accent: 'text-sky-500',
      bg: 'bg-sky-500/10',
    },
  ];

  const statusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (status === 'completed') return 'secondary';
    if (status === 'in_progress') return 'default';
    return 'outline';
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">

      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Welcome back, {user?.name?.split(' ')[0]}</p>
      </div>

      {/* Stats grid — 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {statsLoading
          ? [1, 2, 3, 4].map((i) => (
              <Card key={i} className="rounded-2xl">
                <CardContent className="p-4">
                  <Skeleton className="h-8 w-8 rounded-xl mb-3" />
                  <Skeleton className="h-6 w-16 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))
          : statCards.map((stat) => (
              <Card key={stat.title} className="rounded-2xl border border-border/60">
                <CardContent className="p-4">
                  <div className={`h-9 w-9 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                    <stat.icon className={`h-5 w-5 ${stat.accent}`} />
                  </div>
                  <p className="text-xl font-bold leading-none mb-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.title}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">{stat.description}</p>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Recent Jobs */}
      <Card className="rounded-2xl border border-border/60">
        <CardHeader className="pb-3 pt-5 px-5">
          <CardTitle className="text-base">Recent Jobs</CardTitle>
          <CardDescription className="text-xs">Your latest assignments</CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          {jobsLoading ? (
            <div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3 border-b border-border/30">
                  <Skeleton className="h-10 w-10 rounded-xl flex-shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4 mb-1.5" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : recentJobs && recentJobs.length > 0 ? (
            recentJobs.map((job: any, idx: number) => (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <a className={`flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/30 active:bg-muted/50 ${
                  idx < recentJobs.length - 1 ? 'border-b border-border/30' : ''
                }`}>
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-tight truncate">{job.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{job.requester?.name}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={statusVariant(job.status)} className="text-[11px] capitalize">
                      {job.status?.replace('_', ' ')}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                  </div>
                </a>
              </Link>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Briefcase className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No recent jobs yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
