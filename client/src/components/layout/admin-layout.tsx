import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard, UserCheck, Users, FileText, TrendingUp,
  MapPin, Wrench, MessageSquare, Menu as MenuIcon, ChevronRight, ShieldCheck,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard',             icon: LayoutDashboard, path: '/admin',                        section: 'menu' },
  { label: 'User Verification',     icon: UserCheck,       path: '/admin/verification',           section: 'management' },
  { label: 'Users Management',      icon: Users,           path: '/admin/users',                  section: 'management' },
  { label: 'Reports & Disputes',    icon: FileText,        path: '/admin/reports',                section: 'management' },
  { label: 'Jobs Analytics',        icon: TrendingUp,      path: '/admin/analytics',              section: 'management' },
  { label: 'Migration Requests',    icon: MapPin,          path: '/admin/migrations',             section: 'management' },
  { label: 'Category Verifications',icon: Wrench,          path: '/admin/category-verifications', section: 'management' },
  { label: 'Messages',              icon: MessageSquare,   path: '/messages',                     section: 'management' },
];

function Sidebar({ open, onClose, location }: { open: boolean; onClose: () => void; location: string }) {
  const menuItems  = navItems.filter((n) => n.section === 'menu');
  const mgmtItems  = navItems.filter((n) => n.section === 'management');
  const isActive   = (path: string) => location === path || (path !== '/admin' && location.startsWith(path));

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed top-0 left-0 h-full z-40 w-60 flex flex-col transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:h-screen`}
        style={{ background: 'linear-gradient(180deg, #1a3a3a 0%, #162e2e 100%)' }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-white/10 flex-shrink-0">
          <img src="/logo-icon.png" alt="JobTradeSasa" className="h-8 w-auto max-w-[140px] object-contain" />
        </div>

        {/* Nav */}
        <nav className="flex-1 py-5 px-3 overflow-y-auto space-y-0.5">
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest px-3 mb-2">Menu</p>
          {menuItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <a onClick={onClose} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                ${isActive(item.path) ? 'bg-primary text-white shadow-md' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
                {isActive(item.path) && <ChevronRight className="h-3 w-3 ml-auto" />}
              </a>
            </Link>
          ))}

          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest px-3 mt-5 mb-2">Management</p>
          {mgmtItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <a onClick={onClose} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                ${isActive(item.path) ? 'bg-primary text-white shadow-md' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
                {isActive(item.path) && <ChevronRight className="h-3 w-3 ml-auto" />}
              </a>
            </Link>
          ))}
        </nav>

        {/* Admin chip */}
        <div className="px-4 py-4 border-t border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="h-4 w-4 text-white" />
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

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} location={location} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 flex-shrink-0 flex items-center gap-3 px-4 md:px-6 bg-card border-b border-border/40 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <span className="text-lg font-bold text-foreground">Admin Panel</span>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
