// ==========================================
// contexts/AuthContext.tsx - Complete Auth Context
// ==========================================

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiService } from '@/services/api';
import { User, ApiResponse } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<ApiResponse<any>>;
  register: (userData: RegisterData) => Promise<ApiResponse<any>>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<ApiResponse<User>>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isSeller: boolean;
  isDealer: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  canListCars: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  role?: string;
  city_id?: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setUser(null);
        return;
      }

      const response = await apiService.getProfile();
      
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        // Token might be expired, try to refresh
        const refreshResponse = await apiService.refreshToken();
        
        if (refreshResponse.success) {
          // Retry getting profile with new token
          const retryResponse = await apiService.getProfile();
          if (retryResponse.success && retryResponse.data) {
            setUser(retryResponse.data);
          } else {
            // Failed to get profile, clear everything
            localStorage.removeItem('token');
            localStorage.removeItem('refresh_token');
            setUser(null);
          }
        } else {
          // Refresh failed, clear everything
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<ApiResponse<any>> => {
    try {
      setLoading(true);
      const response = await apiService.login({ email, password });

      if (response.success) {
        // Load user profile after successful login
        await loadUser();
        return { success: true, data: response.data };
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<ApiResponse<any>> => {
    try {
      setLoading(true);
      const response = await apiService.register(userData);

      if (response.success) {
        // Load user profile after successful registration
        await loadUser();
        return { success: true, data: response.data };
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      router.push('/');
    }
  };

  const updateUser = async (userData: Partial<User>): Promise<ApiResponse<User>> => {
    try {
      const response = await apiService.updateProfile(userData);

      if (response.success && response.data) {
        setUser(response.data);
        return { success: true, data: response.data };
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Update failed',
      };
    }
  };

  const refreshUser = async () => {
    try {
      const response = await apiService.getProfile();
      if (response.success && response.data) {
        setUser(response.data);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  // Computed properties
  const isAuthenticated = !!user;
  const isSeller = user?.role === 'seller' || user?.role === 'dealer';
  const isDealer = user?.role === 'dealer';
  const isAdmin = user?.role === 'admin';
  const isModerator = user?.role === 'moderator' || isAdmin;
  const canListCars = isAuthenticated && isSeller && user?.email_verified && user?.phone_verified && !user?.is_banned;

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
    isAuthenticated,
    isSeller,
    isDealer,
    isAdmin,
    isModerator,
    canListCars,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for protected routes
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      // Store the intended destination
      sessionStorage.setItem('redirectAfterLogin', pathname);
      router.push('/auth/login');
    }
  }, [user, loading, pathname, router]);

  return { user, loading };
}

// Hook for seller routes
export function useRequireSeller() {
  const { user, loading, isSeller, canListCars } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        sessionStorage.setItem('redirectAfterLogin', pathname);
        router.push('/auth/login');
      } else if (!isSeller) {
        router.push('/');
      }
    }
  }, [user, loading, isSeller, pathname, router]);

  return { user, loading, canListCars };
}

// Hook for admin routes
export function useRequireAdmin() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        sessionStorage.setItem('redirectAfterLogin', pathname);
        router.push('/auth/login');
      } else if (!isAdmin) {
        router.push('/');
      }
    }
  }, [user, loading, isAdmin, pathname, router]);

  return { user, loading, isAdmin };
}

export default AuthProvider;