import { Link, useLocation } from 'wouter';
import { Home, Briefcase, MessageSquare, User } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export function MobileNav() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  const navItems = [
    { href: '/jobs', icon: Home, label: 'Home', testId: 'nav-home' },
    { href: '/my-jobs', icon: Briefcase, label: 'Jobs', testId: 'nav-jobs' },
    { href: '/messages', icon: MessageSquare, label: 'Messages', testId: 'nav-messages' },
    { href: '/profile', icon: User, label: 'Profile', testId: 'nav-profile' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t glass-effect supports-[backdrop-filter]:bg-background/80 backdrop-blur-md safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <a
                className={`flex flex-col items-center justify-center flex-1 h-full gap-1 px-3 rounded-lg transition-all hover-elevate ${
                  isActive 
                    ? 'text-primary bg-primary/10' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                data-testid={item.testId}
              >
                <div className={`relative ${isActive ? 'scale-110' : ''} transition-transform`}>
                  <item.icon className="h-5 w-5" />
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></div>
                  )}
                </div>
                <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>
                  {item.label}
                </span>
              </a>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
