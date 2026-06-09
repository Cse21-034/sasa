import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard, Tag, MessageSquare, Settings, Menu as MenuIcon,
  ChevronRight, Building2,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard',  icon: LayoutDashboard, path: '/supplier/dashboard' },
  { label: 'Promotions', icon: Tag,             path: '/supplier/dashboard' },
  { label: 'Messages',   icon: MessageSquare,   path: '/messages' },
  { label: 'Settings',   icon: Settings,        path: '/supplier/settings' },
];

function Sidebar({ open, onClose, location }: { open: boolean; onClose: () => void; location: string }) {
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
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest px-3 mb-2">Menu</p>
          {navItems.map((item) => (
            <Link key={item.label} href={item.path}>
              <a
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                  ${location === item.path
                    ? 'bg-primary text-white shadow-md'
                    : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
                {location === item.path && <ChevronRight className="h-3 w-3 ml-auto" />}
              </a>
            </Link>
          ))}
        </nav>

        {/* User chip */}
        <div className="px-4 py-4 border-t border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white flex-shrink-0">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">Supplier</p>
              <p className="text-white/50 text-[10px] truncate">Dashboard</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export function SupplierLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pageTitle = location === '/supplier/settings' ? 'Business Settings' : 'Supplier Dashboard';

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
          <span className="text-lg font-bold text-foreground">{pageTitle}</span>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
