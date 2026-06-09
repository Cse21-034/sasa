import { useMemo } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth-context';
import {
  UserCheck, Users, FileText, TrendingUp, AlertCircle, Briefcase, Loader2, ArrowRight,
  CheckCircle2, MapPin, Wrench, ShieldCheck, Mail,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
} from 'recharts';

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border/60 rounded-xl shadow-lg px-3 py-2 text-sm">
      {label && <p className="text-muted-foreground text-xs mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-bold" style={{ color: p.color || p.fill }}>
          {p.name}: <span className="text-foreground">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

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
    { label: 'Total Users',           value: stats?.totalUsersCount ?? 0,          icon: Users,        bg: 'bg-blue-100 dark:bg-blue-900/30',    color: 'text-blue-500' },
    { label: 'Total Jobs',            value: stats?.totalJobs ?? 0,                icon: Briefcase,    bg: 'bg-orange-100 dark:bg-orange-900/30', color: 'text-orange-500' },
    { label: 'Jobs Completed',        value: stats?.completedJobs ?? 0,            icon: CheckCircle2, bg: 'bg-emerald-100 dark:bg-emerald-900/30',color: 'text-emerald-500' },
    { label: 'Pending Verifications', value: stats?.pendingVerificationCount ?? 0, icon: AlertCircle,  bg: 'bg-red-100 dark:bg-red-900/30',       color: 'text-red-500' },
  ];

  const menuItems = [
    { title: 'User Verification',      icon: UserCheck,  path: '/admin/verification',             badge: stats?.pendingVerificationCount > 0 ? `${stats.pendingVerificationCount} Pending` : null,         badgeColor: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',    desc: 'Approve or reject provider identity and document submissions.' },
    { title: 'Users Management',       icon: Users,      path: '/admin/users',                    badge: `${stats?.totalUsersCount ?? 0} Total`,                                                              badgeColor: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400', desc: 'View, block, deactivate and manage all user accounts.' },
    { title: 'Reports & Disputes',     icon: FileText,   path: '/admin/reports',                  badge: stats?.unresolvedReportsCount > 0 ? `${stats.unresolvedReportsCount} Unresolved` : null,            badgeColor: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400', desc: 'Review and resolve job reports and disputes.' },
    { title: 'Jobs Analytics',         icon: TrendingUp, path: '/admin/analytics',                badge: `${stats?.completedJobs ?? 0} Completed`,                                                            badgeColor: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400', desc: 'View platform metrics and provider performance.' },
    { title: 'Migration Requests',     icon: MapPin,     path: '/admin/migrations',               badge: stats?.pendingMigrationsCount > 0 ? `${stats.pendingMigrationsCount} Pending` : null,              badgeColor: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400', desc: 'Review provider requests to expand to new service areas.' },
    { title: 'Category Verifications', icon: Wrench,     path: '/admin/category-verifications',  badge: stats?.pendingCategoryVerificationsCount > 0 ? `${stats.pendingCategoryVerificationsCount} Pending` : null, badgeColor: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400', desc: 'Review provider category verification requests.' },
  ];

  // Chart data
  const jobsDonutData = useMemo(() => {
    const completed = stats?.completedJobs ?? 0;
    const active    = Math.max(0, (stats?.totalJobs ?? 0) - completed);
    if (completed === 0 && active === 0) return [{ name: 'No jobs', value: 1 }];
    return [
      { name: 'Completed', value: completed },
      { name: 'Active',    value: active },
    ].filter(d => d.value > 0);
  }, [stats]);

  const platformBarData = useMemo(() => [
    { name: 'Users',        value: stats?.totalUsersCount ?? 0,          fill: '#3b82f6' },
    { name: 'Total Jobs',   value: stats?.totalJobs ?? 0,                fill: '#F8992D' },
    { name: 'Completed',    value: stats?.completedJobs ?? 0,            fill: '#10b981' },
    { name: 'Pending KYC',  value: stats?.pendingVerificationCount ?? 0, fill: '#ef4444' },
    { name: 'Reports',      value: stats?.unresolvedReportsCount ?? 0,   fill: '#f59e0b' },
  ], [stats]);

  const DONUT_COLORS = ['#10b981', '#F8992D'];

  return (
    <>
      {/* ── Profile Banner ── */}
      <div className="w-full relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a3a3a 0%, #274345 60%, #2a4d4f 100%)' }}>
        <div className="absolute -right-14 -top-14 w-64 h-64 rounded-full bg-white/[0.04] pointer-events-none" />
        <div className="absolute right-8 top-8 w-24 h-24 rounded-full bg-primary/10 pointer-events-none" />

        <div className="px-4 md:px-8 py-7 md:py-10 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Circular avatar — concept style */}
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 shadow-2xl ring-4 ring-orange-500/20">
              <ShieldCheck className="h-11 w-11 md:h-13 md:h-13 text-white" style={{ height: '2.75rem', width: '2.75rem' }} />
            </div>

            {/* Admin info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-tight mb-1.5">
                {user?.name ?? 'Administrator'}
              </h2>
              <div className="flex items-center gap-1.5 text-white/60 text-sm mb-3">
                <Mail className="h-3.5 w-3.5 text-white/40 flex-shrink-0" />
                {user?.email}
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30 px-3 py-1 rounded-full">
                  Platform Admin
                </span>
                <span className="text-xs text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                  <CheckCircle2 className="h-3 w-3" /> Full Access
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 py-6 space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
        ) : (
          <>
            {/* Stat cards — concept style */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((s) => (
                <div key={s.label} className="rounded-2xl border border-border/50 bg-card p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="text-sm text-muted-foreground font-medium mb-2 leading-tight">{s.label}</p>
                    <p className="text-3xl font-black text-foreground leading-none">{s.value}</p>
                  </div>
                  <div className={`w-14 h-14 rounded-full ${s.bg} flex items-center justify-center flex-shrink-0`}>
                    <s.icon className={`h-7 w-7 ${s.color}`} />
                  </div>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* Donut — Job completion rate */}
              <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
                <h3 className="font-bold text-base mb-1">Job Completion Rate</h3>
                <p className="text-xs text-muted-foreground mb-4">Completed vs active jobs</p>
                <div className="relative">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={jobsDonutData}
                        cx="50%" cy="50%"
                        innerRadius={65} outerRadius={90}
                        paddingAngle={jobsDonutData.length > 1 ? 4 : 0}
                        dataKey="value"
                        startAngle={90} endAngle={-270}
                      >
                        {jobsDonutData.map((_, i) => (
                          <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} strokeWidth={0} />
                        ))}
                      </Pie>
                      <ReTooltip content={<ChartTooltip />} />
                      <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-foreground/80">{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center label */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: -20 }}>
                    <div className="text-center">
                      <p className="text-2xl font-black text-foreground">{stats?.completedJobs ?? 0}</p>
                      <p className="text-[11px] text-muted-foreground font-medium">Completed</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bar — Platform overview */}
              <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
                <h3 className="font-bold text-base mb-1">Platform Overview</h3>
                <p className="text-xs text-muted-foreground mb-4">Key metrics at a glance</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={platformBarData} margin={{ top: 5, right: 5, left: -18, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.06} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.6 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.6 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <ReTooltip content={<ChartTooltip />} cursor={{ fill: 'currentColor', opacity: 0.04 }} />
                    <Bar dataKey="value" name="Count" radius={[6, 6, 0, 0]} maxBarSize={44}>
                      {platformBarData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
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
