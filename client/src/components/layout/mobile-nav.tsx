import { Link, useLocation } from 'wouter';
import { Home, Briefcase, MessageSquare, User, LayoutDashboard, FileText, Building2, Tag, Users, TrendingUp, UserCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export function MobileNav() {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  // 🔥 ADDED: Admin navigation items
  const adminItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', testId: 'nav-admin-dashboard' },
    { href: '/admin/verification', icon: UserCheck, label: 'Verify', testId: 'nav-admin-verification' },
    { href: '/promotions', icon: TrendingUp, label: 'Promos', testId: 'nav-promotions' },
    { href: '/profile', icon: User, label: 'Profile', testId: 'nav-profile' },
  ];

  // Supplier navigation items
  const supplierItems = [
    { href: '/suppliers', icon: Building2, label: 'Browse', testId: 'nav-suppliers-browse' },
    { href: '/messages', icon: MessageSquare, label: 'Messages', testId: 'nav-messages' },
    { href: '/supplier/dashboard', icon: Tag, label: 'Dashboard', testId: 'nav-supplier-dashboard' },
    { href: '/profile', icon: User, label: 'Profile', testId: 'nav-profile' },
  ];

  const requesterItems = [
    { href: '/jobs', icon: Briefcase, label: 'My Jobs', testId: 'nav-jobs' },
    { href: '/messages', icon: MessageSquare, label: 'Messages', testId: 'nav-messages' },
    { href: '/suppliers', icon: Building2, label: 'Suppliers', testId: 'nav-suppliers' },
    { href: '/profile', icon: User, label: 'Profile', testId: 'nav-profile' },
  ];

  const providerItems = [
    { href: '/jobs', icon: Home, label: 'Browse', testId: 'nav-home' },
    { href: '/messages', icon: MessageSquare, label: 'Messages', testId: 'nav-messages' },
    { href: '/provider/applications', icon: Briefcase, label: 'Applications', testId: 'nav-applications' },
    { href: '/profile', icon: User, label: 'Profile', testId: 'nav-profile' },
  ];

  // 🔥 FIXED: Choose nav items based on role INCLUDING ADMIN
  let navItems = requesterItems;
  if (user?.role === 'admin') {
    navItems = adminItems;
  } else if (user?.role === 'provider') {
    navItems = providerItems;
  } else if (user?.role === 'supplier') {
    navItems = supplierItems;
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <a
                className={`flex flex-col items-center justify-center flex-1 h-full gap-1 hover-elevate transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
                data-testid={item.testId}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </a>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
