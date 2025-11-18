// ==========================================
// components/LayoutContent.tsx - Layout Content with Conditional Navigation
// ==========================================

'use client';

import { usePathname } from 'next/navigation';
import Navigation from '@/components/Navigation';

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Hide navigation for admin, seller, and dealer dashboard routes
  const shouldHideNav = pathname.startsWith('/admin') ||
                        pathname.startsWith('/seller') ||
                        pathname.startsWith('/dealer');

  return (
    <div className="relative flex flex-col min-h-screen z-10">
      {/* Conditional Navigation */}
      {!shouldHideNav && <Navigation />}

      {/* Main Content */}
      {!shouldHideNav ? (
        <main className="container mx-auto pt-6 px-6 flex-grow max-w-7xl">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      ) : (
        // For dashboard routes, children already contain their own layout
        <>{children}</>
      )}
    </div>
  );
}
