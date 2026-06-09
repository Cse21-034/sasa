import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth-context';
import {
  UserCheck, Users, FileText, TrendingUp, AlertCircle, Briefcase, Loader2, ArrowRight,
  CheckCircle2, MapPin, Wrench, ShieldCheck, LayoutDashboard, MessageSquare,
  Menu as MenuIcon, ChevronRight, Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const SIDEBAR_BG = 'linear-gradient(180deg, #1a3a3a 0%, #162e2e 100%)';

const navItems = [
  { label: 'Dashboard',            icon: LayoutDashboard, path: '/admin' },
  { label: 'User Verification',    icon: UserCheck,       path: '/admin/verification' },
  { label: 'Users Management',     icon: Users,           path: '/admin/users' },
  { label: 'Reports & Disputes',   icon: FileText,        path: '/admin/reports' },
  { label: 'Jobs Analytics',       icon: TrendingUp,      path: '/admin/analytics' },
  { label: 'Migration Requests',   icon: MapPin,          path: '/admin/migrations' },
  { label: 'Category Verifications', icon: Wrench,        path: '/admin/category-verifications' },
  { label: 'Messages',             icon: MessageSquare,   path: '/messages' },
];

function Sidebar({ open, onClose, location }: { open: boolean; onClose: () => void; location: string }) {
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed top-0 left-0 h-full z-40 w-60 flex flex-col transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:h-auto lg:z-auto`}
        style={{ background: SIDEBAR_BG }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-white/10 flex-shrink-0">
          <img src="/logo-icon.png" alt="JobTradeSasa" className="h-8 w-auto max-w-[140px] object-contain" />
        </div>

        {/* Nav */}
        <nav className="flex-1 py-5 px-3 space-y-0.5 overflow-y-auto">
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest px-3 mb-2">Menu</p>
          {navItems.slice(0, 1).map((item) => (
            <Link key={item.label} href={item.path}>
              <a onClick={onClose} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${location === item.path ? 'bg-primary text-white shadow-md' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
                <item.icon className="h-4 w-4 flex-shrink-0" />{item.label}
                {location === item.path && <ChevronRight className="h-3 w-3 ml-auto" />}
              </a>
            </Link>
          ))}

          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest px-3 mt-4 mb-2">Management</p>
          {navItems.slice(1).map((item) => (
            <Link key={item.label} href={item.path}>
              <a onClick={onClose} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${location === item.path ? 'bg-primary text-white shadow-md' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
                <item.icon className="h-4 w-4 flex-shrink-0" />{item.label}
                {location === item.path && <ChevronRight className="h-3 w-3 ml-auto" />}
              </a>
            </Link>
          ))}
        </nav>

        {/* Admin chip */}
        <div className="px-4 py-4 border-t border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white flex-shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">Admin Panel</p>
              <p className="text-white/50 text-[10px]">jobtradesasa.com</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

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
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: stats, isLoading } = useAdminOverview();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} location={location} />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="h-16 flex-shrink-0 flex items-center justify-between px-4 md:px-6 bg-card border-b border-border/40 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors">
              <MenuIcon className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-bold text-foreground">Admin Panel</h1>
          </div>
          <Link href="/profile">
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="h-4 w-4" /> Profile
            </Button>
          </Link>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">

          {/* Profile banner */}
          <div className="w-full" style={{ background: 'linear-gradient(135deg, #1a3a3a 0%, #274345 60%, #2a4d4f 100%)' }}>
            <div className="px-4 md:px-6 py-6 md:py-8">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <ShieldCheck className="h-10 w-10 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-extrabold text-white mb-0.5">{user?.name ?? 'Administrator'}</h2>
                  <p className="text-white/60 text-sm mb-2">{user?.email}</p>
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
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {statCards.map((s) => (
                    <div key={s.label} className="rounded-2xl border border-border/50 bg-card p-4 flex items-center justify-between shadow-sm">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                        <p className="text-2xl font-extrabold text-foreground">{s.value}</p>
                      </div>
                      <div className={`w-12 h-12 rounded-full ${s.bg} flex items-center justify-center flex-shrink-0`}>
                        <s.icon className={`h-6 w-6 ${s.color}`} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Management tools */}
                <div>
                  <h3 className="text-lg font-bold mb-4">Management Tools</h3>
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
        </main>
      </div>
    </div>
  );
}
