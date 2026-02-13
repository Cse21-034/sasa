import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '@shared/schema';
import { queryClient } from './queryClient';

// 🆕 Extend User type to include verification and status flags
interface ExtendedUser extends User {
  isVerified: boolean;
  isIdentityVerified: boolean;
  status: 'active' | 'blocked' | 'deactivated';
  preferredLanguage: string;
  lastLogin?: Date | string | null;
}

interface AuthContextType {
  user: ExtendedUser | null;
  setUser: (user: ExtendedUser | null) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ExtendedUser | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser({ 
          ...parsedUser,
          isVerified: parsedUser.isVerified ?? false, 
          isIdentityVerified: parsedUser.isIdentityVerified ?? false,
          status: parsedUser.status ?? 'active',
          preferredLanguage: parsedUser.preferredLanguage ?? 'en',
          lastLogin: parsedUser.lastLogin ?? null,
        });
      } catch (error) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  // 🔥 TIER 6: IMPROVED LOGOUT - Complete cache wipeout
  const logout = () => {
    console.log('🔒 Logging out - clearing all caches...');
    
    // 1. Clear auth state
    setUser(null);
    
    // 2. Clear all local storage
    localStorage.clear();
    
    // 3. Clear session storage
    sessionStorage.clear();
    
    // 4. Clear React Query cache completely
    queryClient.clear();
    
    // 5. Clear browser HTTP cache via service worker (if exists)
    if (navigator.serviceWorker) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(reg => reg.unregister());
      });
    }
    
    // 6. Redirect to landing
    window.location.href = '/';
    
    // 7. Force hard reload (bypasses all caches)
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
