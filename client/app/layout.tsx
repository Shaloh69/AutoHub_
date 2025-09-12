import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import { Link } from "@heroui/link";
import clsx from "clsx";

import { Providers } from "./providers";
import { AuthProvider } from "@/contexts/AuthContext";

import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: {
    default: "AutoHub - Premium Automotive Marketplace",
    template: `%s - AutoHub`,
  },
  description: "The ultimate destination for buying and selling premium vehicles. Discover your perfect car with AutoHub's curated selection of quality automobiles.",
  keywords: [
    "luxury cars", "premium vehicles", "automotive marketplace", "buy car", "sell car", 
    "used cars", "new cars", "car dealership", "automotive", "AutoHub"
  ],
  authors: [{ name: "AutoHub Team" }],
  creator: "AutoHub",
  metadataBase: new URL("https://autohub.example.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://autohub.example.com",
    title: "AutoHub - Premium Automotive Marketplace",
    description: "The ultimate destination for buying and selling premium vehicles. Discover your perfect car with AutoHub's curated selection of quality automobiles.",
    siteName: "AutoHub",
    images: [
      {
        url: "https://autohub.example.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "AutoHub - Premium Automotive Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AutoHub - Premium Automotive Marketplace",
    description: "The ultimate destination for buying and selling premium vehicles. Discover your perfect car with AutoHub's curated selection of quality automobiles.",
    images: ["https://autohub.example.com/og-image.png"],
    creator: "@autohub_official",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAFA" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0A" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body
        className={clsx(
          "min-h-screen text-autohub-secondary-900 bg-autohub-neutral-50 dark:text-autohub-neutral-50 dark:bg-autohub-secondary-900 font-sans antialiased",
          fontSans.variable,
        )}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
          <AuthProvider>
            <div className="relative flex flex-col min-h-screen">
              <Navbar />
              <main className="container mx-auto pt-6 px-6 flex-grow max-w-7xl">
                {children}
              </main>
              <footer className="w-full bg-autohub-secondary-900 border-t border-autohub-accent1-800">
                <div className="container mx-auto px-6 py-12 max-w-7xl">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand Section */}
                    <div className="col-span-1 md:col-span-2">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-autohub-primary-500 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-lg">A</span>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-autohub-neutral-50">AutoHub</h3>
                          <p className="text-sm text-autohub-accent2-500">Premium Automotive</p>
                        </div>
                      </div>
                      <p className="text-autohub-neutral-200 mb-4 max-w-md">
                        Your trusted partner in the premium automotive marketplace. 
                        Connecting discerning buyers with exceptional vehicles since 2024.
                      </p>
                      <div className="flex gap-4">
                        <Link
                          isExternal
                          href={siteConfig.links.twitter}
                          className="text-autohub-neutral-300 hover:text-autohub-accent2-500 transition-colors"
                        >
                          Twitter
                        </Link>
                        <Link
                          isExternal
                          href={siteConfig.links.github}
                          className="text-autohub-neutral-300 hover:text-autohub-accent2-500 transition-colors"
                        >
                          GitHub
                        </Link>
                        <Link
                          isExternal
                          href={siteConfig.links.support}
                          className="text-autohub-neutral-300 hover:text-autohub-accent2-500 transition-colors"
                        >
                          Support
                        </Link>
                      </div>
                    </div>
                    
                    {/* Quick Links */}
                    <div>
                      <h4 className="text-lg font-semibold text-autohub-neutral-50 mb-4">Quick Links</h4>
                      <ul className="space-y-2">
                        <li>
                          <Link href="/cars" className="text-autohub-neutral-300 hover:text-autohub-primary-500 transition-colors">
                            Browse Cars
                          </Link>
                        </li>
                        <li>
                          <Link href="/dashboard/create-listing" className="text-autohub-neutral-300 hover:text-autohub-primary-500 transition-colors">
                            Sell Your Car
                          </Link>
                        </li>
                        <li>
                          <Link href="/subscription" className="text-autohub-neutral-300 hover:text-autohub-accent2-500 transition-colors">
                            Premium Plans
                          </Link>
                        </li>
                        <li>
                          <Link href="/about" className="text-autohub-neutral-300 hover:text-autohub-primary-500 transition-colors">
                            About Us
                          </Link>
                        </li>
                      </ul>
                    </div>
                    
                    {/* Support */}
                    <div>
                      <h4 className="text-lg font-semibold text-autohub-neutral-50 mb-4">Support</h4>
                      <ul className="space-y-2">
                        <li>
                          <Link href="/support" className="text-autohub-neutral-300 hover:text-autohub-primary-500 transition-colors">
                            Help Center
                          </Link>
                        </li>
                        <li>
                          <Link href="/contact" className="text-autohub-neutral-300 hover:text-autohub-primary-500 transition-colors">
                            Contact Us
                          </Link>
                        </li>
                        <li>
                          <Link href="/privacy" className="text-autohub-neutral-300 hover:text-autohub-primary-500 transition-colors">
                            Privacy Policy
                          </Link>
                        </li>
                        <li>
                          <Link href="/terms" className="text-autohub-neutral-300 hover:text-autohub-primary-500 transition-colors">
                            Terms of Service
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="border-t border-autohub-accent1-800 mt-8 pt-8 text-center">
                    <p className="text-autohub-neutral-400">
                      &copy; 2024 AutoHub. All rights reserved. | Powered by premium automotive excellence.
                    </p>
                  </div>
                </div>
              </footer>
            </div>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
