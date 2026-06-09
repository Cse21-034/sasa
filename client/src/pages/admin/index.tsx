import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth-context';
import {
  UserCheck, Users, FileText, TrendingUp, AlertCircle, Briefcase, Loader2, ArrowRight,
  CheckCircle2, MapPin, Wrench, ShieldCheck,
} from 'lucide-react';

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
    { label: 'Total Users',           value: stats?.totalUsersCount ?? 0,          icon: Users,        bg: 'bg-blue-100 dark:bg-blue-900/30',    color: 'text-blue-500',    accent: 'bg-gradient-to-r from-blue-500 to-blue-400' },
    { label: 'Total Jobs',            value: stats?.totalJobs ?? 0,                icon: Briefcase,    bg: 'bg-orange-100 dark:bg-orange-900/30', color: 'text-orange-500',  accent: 'bg-gradient-to-r from-orange-500 to-orange-400' },
    { label: 'Jobs Completed',        value: stats?.completedJobs ?? 0,            icon: CheckCircle2, bg: 'bg-emerald-100 dark:bg-emerald-900/30',color: 'text-emerald-500', accent: 'bg-gradient-to-r from-emerald-500 to-emerald-400' },
    { label: 'Pending Verifications', value: stats?.pendingVerificationCount ?? 0, icon: AlertCircle,  bg: 'bg-red-100 dark:bg-red-900/30',       color: 'text-red-500',     accent: 'bg-gradient-to-r from-red-500 to-red-400' },
  ];

  const menuItems = [
    { title: 'User Verification',      icon: UserCheck,  path: '/admin/verification',             badge: stats?.pendingVerificationCount > 0 ? `${stats.pendingVerificationCount} Pending` : null,         badgeColor: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',    desc: 'Approve or reject provider identity and document submissions.' },
    { title: 'Users Management',       icon: Users,      path: '/admin/users',                    badge: `${stats?.totalUsersCount ?? 0} Total`,                                                              badgeColor: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400', desc: 'View, block, deactivate and manage all user accounts.' },
    { title: 'Reports & Disputes',     icon: FileText,   path: '/admin/reports',                  badge: stats?.unresolvedReportsCount > 0 ? `${stats.unresolvedReportsCount} Unresolved` : null,            badgeColor: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400', desc: 'Review and resolve job reports and disputes.' },
    { title: 'Jobs Analytics',         icon: TrendingUp, path: '/admin/analytics',                badge: `${stats?.completedJobs ?? 0} Completed`,                                                            badgeColor: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400', desc: 'View platform metrics and provider performance.' },
    { title: 'Migration Requests',     icon: MapPin,     path: '/admin/migrations',               badge: stats?.pendingMigrationsCount > 0 ? `${stats.pendingMigrationsCount} Pending` : null,              badgeColor: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400', desc: 'Review provider requests to expand to new service areas.' },
    { title: 'Category Verifications', icon: Wrench,     path: '/admin/category-verifications',  badge: stats?.pendingCategoryVerificationsCount > 0 ? `${stats.pendingCategoryVerificationsCount} Pending` : null, badgeColor: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400', desc: 'Review provider category verification requests.' },
  ];

  return (
    <>
      {/* Profile banner */}
      <div className="w-full" style={{ background: 'linear-gradient(135deg, #1a3a3a 0%, #274345 60%, #2a4d4f 100%)' }}>
        <div className="px-4 md:px-6 py-5 md:py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg">
              <ShieldCheck className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-extrabold text-white mb-0.5 truncate">{user?.name ?? 'Administrator'}</h2>
              <p className="text-white/60 text-sm mb-2 truncate">{user?.email}</p>
              <span className="text-[11px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded-full">Platform Admin</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 py-6 space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {statCards.map((s) => (
                <div key={s.label} className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
                  <div className={`h-1 ${s.accent}`} />
                  <div className="p-4">
                    <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                      <s.icon className={`h-5 w-5 ${s.color}`} />
                    </div>
                    <p className="text-2xl sm:text-3xl font-black text-foreground leading-none">{s.value}</p>
                    <p className="text-[11px] text-muted-foreground mt-1.5 font-medium uppercase tracking-wide leading-tight">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Management tools */}
            <div>
              <h3 className="text-lg font-bold mb-4">Management Tools</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>{item.badge}</span>
                      )}
                    </div>
                    <h4 className="font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{item.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">{item.desc}</p>
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
    </>
  );
}
