import { Link, useLocation } from 'wouter';
import { Home, Briefcase, MessageSquare, User, LayoutDashboard, FileText, Building2, Tag, Users, TrendingUp, UserCheck, Plus } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export function MobileNav() {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();

  const { data: conversations } = useQuery({
    queryKey: ['/api/messages/conversations'],
    enabled: isAuthenticated,
    refetchInterval: 30000,
    queryFn: async () => (await apiRequest('GET', '/api/messages/conversations')).json(),
  });
  const unreadMessages: number = conversations?.filter((c: any) => c.unreadCount > 0).length ?? 0;

  if (!isAuthenticated) return null;

  const adminItems = [
    { href: '/admin',               icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/verification',  icon: UserCheck,       label: 'Verify' },
    { href: '/promotions',          icon: TrendingUp,      label: 'Promos' },
    { href: '/profile',             icon: User,            label: 'Profile' },
  ];

  const supplierItems = [
    { href: '/suppliers',           icon: Building2,       label: 'Browse' },
    { href: '/messages',            icon: MessageSquare,   label: 'Messages' },
    { href: '/supplier/dashboard',  icon: Tag,             label: 'Dashboard' },
    { href: '/profile',             icon: User,            label: 'Profile' },
  ];

  const requesterItems = [
    { href: '/jobs',        icon: Briefcase,     label: 'My Jobs' },
    { href: '/messages',    icon: MessageSquare, label: 'Messages' },
    { href: '/promotions',  icon: Tag,           label: 'Promos' },
    { href: '/suppliers',   icon: Building2,     label: 'Suppliers' },
    { href: '/profile',     icon: User,          label: 'Profile' },
  ];

  const providerItems = [
    { href: '/jobs',                    icon: Home,          label: 'Browse' },
    { href: '/messages',                icon: MessageSquare, label: 'Messages' },
    { href: '/promotions',              icon: TrendingUp,    label: 'Promos' },
    { href: '/provider/applications',   icon: Briefcase,     label: 'My Jobs' },
    { href: '/profile',                 icon: User,          label: 'Profile' },
  ];

  let navItems = requesterItems;
  if (user?.role === 'admin')    navItems = adminItems;
  else if (user?.role === 'provider') navItems = providerItems;
  else if (user?.role === 'supplier') navItems = supplierItems;

  return (
    <>
      {/* FAB — Post Job (requester only) */}
      {user?.role === 'requester' && (
        <Link href="/post-job">
          <a
            className="md:hidden fixed right-4 z-50 bg-orange-500 hover:bg-orange-600 text-white rounded-full p-4 shadow-xl flex items-center justify-center active:scale-95 transition-transform"
            style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <Plus className="h-6 w-6" />
          </a>
        </Link>
      )}

      {/* Bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-950 border-t border-gray-200/70 dark:border-gray-800"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-around h-[60px] px-1">
          {navItems.map((item) => {
            const isActive = location === item.href || location.startsWith(item.href + '/');
            const showBadge = item.href === '/messages' && unreadMessages > 0;

            return (
              <Link key={item.href} href={item.href}>
                <a className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 py-2 relative transition-colors">
                  {/* active pill behind icon */}
                  {isActive && (
                    <span className="absolute top-1.5 w-10 h-7 rounded-full bg-orange-100 dark:bg-orange-950/50" />
                  )}

                  {/* icon + optional badge */}
                  <span className="relative z-10">
                    <item.icon
                      className={`h-[22px] w-[22px] transition-colors ${
                        isActive ? 'text-orange-500' : 'text-gray-400 dark:text-gray-500'
                      }`}
                      strokeWidth={isActive ? 2.2 : 1.8}
                    />
                    {showBadge && (
                      <span className="absolute -top-1 -right-1.5 h-4 w-4 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </span>
                    )}
                  </span>

                  <span
                    className={`text-[10px] font-medium z-10 transition-colors ${
                      isActive ? 'text-orange-500' : 'text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    {item.label}
                  </span>
                </a>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
