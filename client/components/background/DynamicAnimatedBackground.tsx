// components/background/DynamicAnimatedBackground.tsx
'use client';

import { usePathname } from 'next/navigation';
import { AnimatedBackground } from './AnimatedBackground';

export function DynamicAnimatedBackground() {
  const pathname = usePathname();

  // Determine color scheme based on current route
  const getColorScheme = (): 'red' | 'green' | 'purple' => {
    if (pathname.startsWith('/seller') || pathname.startsWith('/dealer')) {
      return 'green';
    }
    if (pathname.startsWith('/admin')) {
      return 'purple';
    }
    return 'red'; // Default for customer pages
  };

  return <AnimatedBackground colorScheme={getColorScheme()} />;
}

export default DynamicAnimatedBackground;
