// ==========================================
// components/LayoutContent.tsx - Layout Content with Conditional Navigation
// ==========================================

'use client';

import { usePathname } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Footer } from '@/components/Footer';

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Hide navigation and footer for admin, seller, and dealer dashboard routes
  const shouldHideNav = pathname.startsWith('/admin') ||
                        pathname.startsWith('/seller') ||
                        pathname.startsWith('/dealer');

  // Check if it's the homepage to allow full-width layout
  const isHomePage = pathname === '/';

  return (
    <div className="relative flex flex-col min-h-screen z-10">
      {/* Conditional Navigation */}
      {!shouldHideNav && <Navigation />}

      {/* Main Content */}
      {!shouldHideNav ? (
        <>
          <main className={isHomePage ? "flex-grow w-full" : "container mx-auto pt-6 px-6 flex-grow max-w-7xl"}>
            <div className={isHomePage ? "" : "animate-fade-in"}>
              {children}
            </div>
          </main>

          {/* Footer - only shown on customer pages */}
          <Footer />
        </>
      ) : (
        // For dashboard routes, children already contain their own layout (no footer)
        <>{children}</>
      )}
    </div>
  );
}
