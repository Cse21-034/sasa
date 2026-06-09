import { useLocation } from 'wouter';
import { CardContent } from '@/components/ui/card';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  UserCheck, Users, FileText, TrendingUp, AlertCircle, Briefcase, Loader2, ArrowRight,
  CheckCircle2, MapPin, Wrench, ShieldCheck, LayoutDashboard,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth-context';

const useAdminOverview = () =>
  useQuery({
    queryKey: ['adminOverviewStats'],
    queryFn: async () => {
      const [analytics, verification, reports, totalUsers, migrations, categoryVerifications] = await Promise.all([
        apiRequest('GET', '/api/admin/analytics').then((r) => r.json()),
        apiRequest('GET', '/api/admin/verification/pending').then((r) => r.json()),
        apiRequest('GET', '/api/admin/reports?status=unresolved').then((r) => r.json()),
        apiRequest('GET', '/api/admin/users').then((r) => r.json()),
        apiRequest('GET', '/api/admin/migrations/pending').then((r) => r.json()),
        apiRequest('GET', '/api/admin/provider-category-verifications').then((r) => r.json()),
      ]);
      return {
        ...analytics,
        pendingVerificationCount: verification.length,
        unresolvedReportsCount: reports.length,
        totalUsersCount: totalUsers.length,
        pendingMigrationsCount: migrations.length,
        pendingCategoryVerificationsCount: categoryVerifications.length,
      };
    },
    refetchInterval: 60000,
  });

export default function AdminDashboardHub() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: stats, isLoading } = useAdminOverview();

  const statCards = [
    { label: 'Total Users',            value: stats?.totalUsersCount ?? 0,         icon: Users,        bg: 'bg-blue-100 dark:bg-blue-900/30',    iconColor: 'text-blue-500' },
    { label: 'Total Jobs',             value: stats?.totalJobs ?? 0,               icon: Briefcase,    bg: 'bg-orange-100 dark:bg-orange-900/30', iconColor: 'text-orange-500' },
    { label: 'Jobs Completed',         value: stats?.completedJobs ?? 0,           icon: CheckCircle2, bg: 'bg-emerald-100 dark:bg-emerald-900/30',iconColor: 'text-emerald-500' },
    { label: 'Pending Verifications',  value: stats?.pendingVerificationCount ?? 0,icon: AlertCircle,  bg: 'bg-red-100 dark:bg-red-900/30',       iconColor: 'text-red-500' },
  ];

  const menuItems = [
    {
      title: 'User Verification', icon: UserCheck, path: '/admin/verification',
      description: 'Approve or reject provider identity and document submissions.',
      badge: stats?.pendingVerificationCount > 0 ? `${stats.pendingVerificationCount} Pending` : null,
      badgeColor: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    },
    {
      title: 'Users Management', icon: Users, path: '/admin/users',
      description: 'View, block, deactivate and manage all user accounts.',
      badge: `${stats?.totalUsersCount ?? 0} Total`,
      badgeColor: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Reports & Disputes', icon: FileText, path: '/admin/reports',
      description: 'Review and resolve job reports and disputes raised by users.',
      badge: stats?.unresolvedReportsCount > 0 ? `${stats.unresolvedReportsCount} Unresolved` : null,
      badgeColor: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    },
    {
      title: 'Jobs Analytics', icon: TrendingUp, path: '/admin/analytics',
      description: 'View platform metrics, job completion rates, and provider performance.',
      badge: `${stats?.completedJobs ?? 0} Completed`,
      badgeColor: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Migration Requests', icon: MapPin, path: '/admin/migrations',
      description: 'Review and approve provider requests to expand to new service areas.',
      badge: stats?.pendingMigrationsCount > 0 ? `${stats.pendingMigrationsCount} Pending` : null,
      badgeColor: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    },
    {
      title: 'Category Verifications', icon: Wrench, path: '/admin/category-verifications',
      description: 'Review and approve provider requests for category verification.',
      badge: stats?.pendingCategoryVerificationsCount > 0 ? `${stats.pendingCategoryVerificationsCount} Pending` : null,
      badgeColor: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    },
  ];

  return (
    <div className="min-h-screen bg-background">

      {/* ── Profile banner ── */}
      <div className="w-full" style={{ background: 'linear-gradient(135deg, #1a3a3a 0%, #274345 60%, #2a4d4f 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-10">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg">
              <ShieldCheck className="h-10 w-10 text-white" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl font-extrabold text-white mb-1">{user?.name ?? 'Administrator'}</h1>
              <p className="text-white/70 text-sm mb-2">{user?.email}</p>
              <span className="text-[11px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded-full">
                Platform Admin
              </span>
            </div>

            <div className="hidden md:flex items-center gap-2 text-white/60 text-xs">
              <LayoutDashboard className="h-4 w-4" />
              Admin Panel
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 space-y-8">

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
        ) : (
          <>
            {/* ── Stat cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((s) => (
                <Card key={s.label} className="border border-border/50 shadow-sm">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                      <p className="text-2xl font-extrabold text-foreground">{s.value}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-full ${s.bg} flex items-center justify-center flex-shrink-0`}>
                      <s.icon className={`h-6 w-6 ${s.iconColor}`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* ── Management tools ── */}
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">Management Tools</h2>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {menuItems.map((item) => (
                  <div
                    key={item.path}
                    onClick={() => setLocation(item.path)}
                    className="cursor-pointer rounded-2xl border border-border/50 bg-card p-5 shadow-sm hover:shadow-md hover:border-primary/40 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <item.icon className="h-5 w-5 text-primary" />
                      </div>
                      {item.badge && (
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">{item.description}</p>
                    <span className="text-xs font-semibold text-primary flex items-center gap-1">
                      Go to Section <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
