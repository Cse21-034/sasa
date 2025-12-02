import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '@shared/schema';

// 🆕 Extend User type to include verification and status flags
interface ExtendedUser extends User {
  isVerified: boolean;
  isIdentityVerified: boolean;
  status: 'active' | 'blocked' | 'deactivated';
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
          lastLogin: parsedUser.lastLogin ?? null,
        });
      } catch (error) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  // 🔥 FIXED: Improved logout with proper cleanup and redirect
  const logout = () => {
    // Clear user state
    setUser(null);
    
    // Clear all auth-related data
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    // Clear any cached queries
    sessionStorage.clear();
    
    // Force redirect to landing page
    window.location.href = '/';
    
    // Force a hard reload to clear all cached data
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
