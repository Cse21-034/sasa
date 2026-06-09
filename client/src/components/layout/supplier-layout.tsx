import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard, Tag, MessageSquare, Settings, Store, Menu as MenuIcon,
  ChevronRight, Building2, LogOut, User,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { NotificationPanel } from '@/components/notifications-panel';
import { useAuth } from '@/lib/auth-context';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const navItems = [
  { label: 'Dashboard',        icon: LayoutDashboard, path: '/supplier/dashboard' },
  { label: 'Promotions',       icon: Tag,             path: '/supplier/dashboard' },
  { label: 'Browse Suppliers', icon: Store,           path: '/supplier/browse' },
  { label: 'Messages',         icon: MessageSquare,   path: '/supplier/messages' },
  { label: 'Settings',         icon: Settings,        path: '/supplier/settings' },
];

function Sidebar({ open, onClose, location, companyName, logo }: {
  open: boolean; onClose: () => void; location: string;
  companyName?: string; logo?: string;
}) {
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
                  ${(location === item.path || (item.path !== '/supplier/dashboard' && location.startsWith(item.path)))
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

        {/* Company chip */}
        <div className="px-4 py-4 border-t border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white flex-shrink-0 overflow-hidden">
              {logo
                ? <img src={logo} alt={companyName} className="w-full h-full object-contain p-0.5"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                : <Building2 className="h-4 w-4" />}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{companyName || 'Supplier'}</p>
              <p className="text-white/50 text-[10px] truncate">Dashboard</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export function SupplierLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const { data: supplierProfile } = useQuery({
    queryKey: ['supplierProfile'],
    queryFn: async () => (await apiRequest('GET', '/api/supplier/profile')).json(),
    enabled: !!user,
  });

  const pageTitle = location === '/supplier/settings'         ? 'Business Settings'
                 : location.startsWith('/supplier/browse')  ? 'Browse Suppliers'
                 : location.startsWith('/supplier/messages') ? 'Messages'
                 : 'Supplier Dashboard';

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        location={location}
        companyName={supplierProfile?.companyName || user?.name}
        logo={supplierProfile?.logo}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 flex-shrink-0 flex items-center gap-2 px-3 md:px-6 bg-card border-b border-border/40 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden flex-shrink-0 p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <MenuIcon className="h-5 w-5" />
          </button>

          <span className="flex-1 min-w-0 truncate text-base sm:text-lg font-bold text-foreground">{pageTitle}</span>

          {/* Right controls */}
          <div className="flex-shrink-0 flex items-center gap-1">
            <ThemeToggle />
            <NotificationPanel />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="ml-1 rounded-full ring-2 ring-primary/30 hover:ring-primary transition-all">
                  <Avatar className="h-9 w-9">
                    {supplierProfile?.logo && (
                      <AvatarImage
                        src={supplierProfile.logo}
                        alt={supplierProfile.companyName}
                        className="object-contain p-0.5"
                      />
                    )}
                    <AvatarFallback className="bg-primary text-white font-bold text-sm">
                      {(supplierProfile?.companyName || user?.name)?.charAt(0).toUpperCase() || 'S'}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="font-semibold truncate">{supplierProfile?.companyName || user?.name}</p>
                  <p className="text-xs text-muted-foreground font-normal truncate">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation('/supplier/settings')} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
