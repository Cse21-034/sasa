import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'wouter';
import { Menu, Bell, User, Briefcase, MessageSquare, LayoutDashboard, FileText, Plus, Sparkles, Tag, ArrowRight, ShoppingBag, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { NotificationPanel } from '@/components/notifications-panel';
import { useAuth } from '@/lib/auth-context';
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  const { t } = useTranslation();
  const [prevNotificationCount, setPrevNotificationCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
   
  const isLandingPage = location === '/'; 
   
  // Query for unread messages count
  const { data: conversations } = useQuery({
    queryKey: ['/api/messages/conversations'],
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  // Query for pending verifications (admin only)
  const { data: pendingVerifications } = useQuery({
    queryKey: ['adminPendingVerification'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/verification/pending');
      return res.json();
    },
    enabled: isAuthenticated && user?.role === 'admin',
    refetchInterval: 60000,
  });

  // Query for unresolved reports (admin only)
  const { data: unresolvedReports } = useQuery({
    queryKey: ['adminUnresolvedReports'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/reports?status=unresolved');
      return res.json();
    },
    enabled: isAuthenticated && user?.role === 'admin',
    refetchInterval: 60000,
  });

  // Calculate notification counts
  const unreadMessagesCount = conversations?.filter((c: any) => c.unreadCount > 0).length || 0;
  const pendingVerificationsCount = pendingVerifications?.length || 0;
  const unresolvedReportsCount = unresolvedReports?.length || 0;
   
  const totalNotifications = isAuthenticated 
    ? (user?.role === 'admin' 
        ? pendingVerificationsCount + unresolvedReportsCount + unreadMessagesCount
        : unreadMessagesCount)
    : 0;

  // Play notification sound when count increases
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjGJ0fPTfzMGHm7A7+OZURE');
    }

    if (totalNotifications > prevNotificationCount && prevNotificationCount > 0) {
      audioRef.current?.play().catch(e => console.log('Audio play failed:', e));
    }
    
    setPrevNotificationCount(totalNotifications);
  }, [totalNotifications, prevNotificationCount]);

  return (
    <header 
      className="sticky top-0 z-50 w-full transition-all duration-300 shadow-2xl"
      style={{ 
        background: 'linear-gradient(135deg, #1a3a3a 0%, #274345 50%, #2a4d4f 100%)',
      }}
    >
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        
        {/* Logo Section */}
        <div className="flex items-center gap-8">
          <Link href="/">
            <div className="flex items-center gap-4 hover:opacity-90 transition-opacity rounded-xl px-4 py-2 cursor-pointer group">
              <img 
                src="/image.png" 
                alt="JobTradeSasa" 
                className="h-12 lg:h-16 w-auto object-contain drop-shadow-lg"
              />
            </div>
          </Link>

          {/* Landing Page Desktop Navigation */}
          {isLandingPage && !isAuthenticated && (
            <nav className="hidden lg:flex items-center gap-2 text-sm font-medium">
              <a href="/#popular-services" className="px-4 py-2 text-white/90 hover:text-orange-300 transition-colors rounded-lg hover:bg-white/5">
                Services
              </a>
              <a href="/#why-choose-us" className="px-4 py-2 text-white/90 hover:text-orange-300 transition-colors rounded-lg hover:bg-white/5">
                About
              </a>
              <a href="/#suppliers-section" className="px-4 py-2 text-white/90 hover:text-orange-300 transition-colors rounded-lg hover:bg-white/5">
                Suppliers
              </a>
              <Link href="/promotions">
                <a className="px-4 py-2 text-white/90 hover:text-orange-300 transition-colors rounded-lg hover:bg-white/5">
                  Promotions
                </a>
              </Link>
            </nav>
          )}

          {/* Authenticated Desktop Navigation */}
          {isAuthenticated && (
            <nav className="hidden lg:flex items-center gap-2">
              {user?.role === 'requester' && (
                <>
                  <Link href="/jobs">
                    <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-orange-300 transition-colors">
                      <Briefcase className="h-4 w-4 mr-2" />
                      {t('My Jobs')}
                    </Button>
                  </Link>
                  <Link href="/suppliers">
                    <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-orange-300 transition-colors">
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      {t('Suppliers & Organizations')}
                    </Button>
                  </Link>
                  <Link href="/messages">
                    <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-orange-300 transition-colors">
                      <MessageSquare className="h-4 w-4 mr-2" /> 
                      {t('Messages')}
                    </Button>
                  </Link>
                </>
              )}
              {user?.role === 'provider' && (
                <>
                  <Link href="/jobs">
                    <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-orange-300 transition-colors">
                      <Briefcase className="h-4 w-4 mr-2" />
                      {t('Browse Jobs')}
                    </Button>
                  </Link>
                  <Link href="/suppliers">
                    <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-orange-300 transition-colors">
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      {t('Suppliers & Organizations')}
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-orange-300 transition-colors">
                      <LayoutDashboard className="h-4 w-4 mr-2" /> 
                      {t('Dashboard')}
                    </Button>
                  </Link>
                  <Link href="/messages">
                    <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-orange-300 transition-colors">
                      <MessageSquare className="h-4 w-4 mr-2" /> 
                      {t('Messages')}
                    </Button>
                  </Link>
                </>
              )}
              {user?.role === 'supplier' && (
                <>
                  <Link href="/suppliers">
                    <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-orange-300 transition-colors">
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      {t('Browse')}
                    </Button>
                  </Link>
                  <Link href="/supplier/dashboard">
                    <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-orange-300 transition-colors">
                      <Tag className="h-4 w-4 mr-2" /> 
                      {t('Promotions')}
                    </Button>
                  </Link>
                  <Link href="/messages">
                    <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-orange-300 transition-colors">
                      <MessageSquare className="h-4 w-4 mr-2" /> 
                      {t('Messages')}
                    </Button>
                  </Link>
                </>
              )}
              {user?.role === 'admin' && (
                <Link href="/admin">
                  <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-orange-300 transition-colors">
                    <LayoutDashboard className="h-4 w-4 mr-2" /> {t('Dashboard')}
                  </Button>
                </Link>
              )}
            </nav>
          )}
        </div>
        
        {/* Right Section */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {isAuthenticated ? (
            <>
              {/* 🆕 Notification Panel */}
              <NotificationPanel />

              {user?.role === 'requester' && (
                <Link href="/post-job">
                  <Button className="hidden sm:flex bg-orange-500 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 hover:bg-orange-600">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('Post a Job')}
                  </Button>
                </Link>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-white/10 transition-all">
                    <Avatar className="h-10 w-10 ring-2 ring-orange-400">
                      <AvatarImage src={user?.profilePhotoUrl} alt={user?.name} />
                      <AvatarFallback className="bg-orange-500 text-white font-bold">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 border-2 border-orange-200 dark:border-orange-900">
                  <DropdownMenuLabel>
                    <div className="flex flex-col gap-2">
                      <p className="text-base font-bold truncate">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLocation('/profile')} className="cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900">
                    <User className="mr-2 h-4 w-4 text-orange-500" />
                    {t('Profile')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive hover:bg-red-100 dark:hover:bg-red-900">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('Logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-orange-300 transition-colors">
                  {t('Login')}
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-orange-500 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 hover:bg-orange-600 border-2 border-orange-400">
                  {t('Sign Up')}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
