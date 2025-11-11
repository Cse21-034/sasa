import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '@shared/schema';

// 🆕 Update User type definition in local file to include isBlocked
interface ExtendedUser extends User {
  isVerified: boolean;
  isIdentityVerified: boolean;
  isBlocked: boolean; // 🆕 Added
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
        // Ensure parsed user has the new fields, defaulting to false if undefined (e.g., from old storage)
        const parsedUser = JSON.parse(storedUser);
        setUser({ 
          ...parsedUser,
          isVerified: parsedUser.isVerified ?? false, 
          isIdentityVerified: parsedUser.isIdentityVerified ?? false,
          isBlocked: parsedUser.isBlocked ?? false, // 🆕 Added
        });
      } catch (error) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
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
