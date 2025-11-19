// components/background/DynamicAnimatedBackground.tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { AnimatedBackground } from './AnimatedBackground';

export function DynamicAnimatedBackground() {
  const { user, loading } = useAuth();

  // Determine color scheme based on user role
  const getColorScheme = (): 'red' | 'green' | 'purple' => {
    // Wait for auth to load before determining color
    if (loading || !user) {
      return 'red'; // Default for non-authenticated users
    }

    const userRole = user.role?.toUpperCase();

    // Admin gets purple theme
    if (userRole === 'ADMIN' || userRole === 'MODERATOR') {
      return 'purple';
    }

    // Sellers and Dealers get green theme
    if (userRole === 'SELLER' || userRole === 'DEALER') {
      return 'green';
    }

    // Customers and everyone else get red theme
    return 'red';
  };

  return <AnimatedBackground colorScheme={getColorScheme()} />;
}

export default DynamicAnimatedBackground;
