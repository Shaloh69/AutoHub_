// ==========================================
// app/layout.tsx - Root Layout with Premium Styling
// ==========================================

import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import { Link } from "@heroui/link";
import clsx from "clsx";

import { Providers } from "./providers";
import { AuthProvider } from "@/contexts/AuthContext";

import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import Navigation from "@/components/Navigation";
import { AnimatedBackground } from "@/components/background";

export const metadata: Metadata = {
  title: {
    default: "AutoHub Elite - Premium Automotive Marketplace",
    template: `%s - AutoHub Elite`,
  },
  description: "The ultimate destination for luxury automotive excellence. Discover premium vehicles with AutoHub's curated collection from elite dealers and private collectors worldwide.",
  keywords: [
    "luxury cars", "premium vehicles", "automotive marketplace", "elite cars", "supercar dealership", 
    "luxury car sales", "premium automotive", "high-end vehicles", "exotic cars", "AutoHub Elite"
  ],
  authors: [{ name: "AutoHub Elite Team" }],
  creator: "AutoHub Elite",
  metadataBase: new URL("https://autohub-elite.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://autohub-elite.com",
    title: "AutoHub Elite - Premium Automotive Marketplace",
    description: "The ultimate destination for luxury automotive excellence. Discover premium vehicles with AutoHub's curated collection from elite dealers and private collectors worldwide.",
    siteName: "AutoHub Elite",
    images: [
      {
        url: "https://autohub-elite.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "AutoHub Elite - Premium Automotive Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AutoHub Elite - Premium Automotive Marketplace",
    description: "The ultimate destination for luxury automotive excellence. Discover premium vehicles with AutoHub's curated collection from elite dealers and private collectors worldwide.",
    images: ["https://autohub-elite.com/og-image.png"],
    creator: "@autohub_elite",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0A0A0A" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0A" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={clsx(
          "min-h-screen bg-transparent text-white font-sans antialiased selection:bg-primary-600 selection:text-white overflow-x-hidden",
          fontSans.variable,
        )}
      >
        {/* Animated Background - Applied to all pages */}
        <AnimatedBackground />

        <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
          <AuthProvider>
            <div className="relative flex flex-col min-h-screen z-10">
              {/* Navigation */}
              <Navigation />
              
              {/* Main Content */}
              <main className="container mx-auto pt-6 px-6 flex-grow max-w-7xl">
                <div className="animate-fade-in">
                  {children}
                </div>
              </main>
              
              {/* Premium Footer */}
              <footer className="w-full bg-black/80 backdrop-blur-sm border-t border-dark-700">
                <div className="container mx-auto px-6 py-16 max-w-7xl">
                  {/* Main Footer Content */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Brand Section */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="flex items-center gap-4 group">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-red-dark rounded-2xl flex items-center justify-center shadow-red-glow group-hover:scale-110 transition-all duration-300">
                            <span className="text-white font-bold text-2xl">A</span>
                          </div>
                          <div className="absolute inset-0 bg-primary-600/30 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                        <div>
                          <h3 className="text-3xl font-bold text-gradient-red">AutoHub</h3>
                          <p className="text-primary-500 font-semibold tracking-wide">Elite Automotive</p>
                        </div>
                      </div>

                      <p className="text-gray-300 text-lg leading-relaxed max-w-2xl">
                        Your premier destination for luxury automotive excellence. Connecting discerning collectors,
                        dealers, and enthusiasts with the world's finest vehicles since 2024.
                      </p>
                      
                      <div className="flex gap-6">
                        <Link
                          isExternal
                          href={siteConfig.links.twitter}
                          className="group flex items-center justify-center w-12 h-12 bg-black/30 backdrop-blur-sm border border-dark-700 hover:bg-primary-600 hover:border-primary-500 rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-red-glow"
                        >
                          <svg className="w-6 h-6 text-gray-400 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19.633 7.997c.013.175.013.349.013.523 0 5.325-4.053 11.461-11.46 11.461-2.282 0-4.402-.661-6.186-1.809.324.037.636.05.973.05a8.07 8.07 0 0 0 5.001-1.721 4.036 4.036 0 0 1-3.767-2.793c.249.037.499.062.761.062.361 0 .724-.05 1.061-.137a4.027 4.027 0 0 1-3.23-3.953v-.05c.537.299 1.16.486 1.82.511a4.022 4.022 0 0 1-1.796-3.354c0-.748.199-1.434.548-2.032a11.457 11.457 0 0 0 8.306 4.215c-.062-.3-.1-.611-.1-.923a4.026 4.026 0 0 1 4.028-4.028c1.16 0 2.207.486 2.943 1.272a7.957 7.957 0 0 0 2.556-.973 4.02 4.02 0 0 1-1.771 2.22 8.073 8.073 0 0 0 2.319-.624 8.645 8.645 0 0 1-2.019 2.083z"/>
                          </svg>
                        </Link>

                        <Link
                          isExternal
                          href={siteConfig.links.github}
                          className="group flex items-center justify-center w-12 h-12 bg-black/30 backdrop-blur-sm border border-dark-700 hover:bg-primary-600 hover:border-primary-500 rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-red-glow"
                        >
                          <svg className="w-6 h-6 text-gray-400 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12.026 2c-5.509 0-9.974 4.465-9.974 9.974 0 4.406 2.857 8.145 6.821 9.465.499.09.679-.217.679-.481 0-.237-.008-.865-.011-1.696-2.775.602-3.361-1.338-3.361-1.338-.452-1.152-1.107-1.459-1.107-1.459-.905-.619.069-.605.069-.605 1.002.07 1.527 1.028 1.527 1.028.89 1.524 2.336 1.084 2.902.829.091-.645.351-1.085.635-1.334-2.214-.251-4.542-1.107-4.542-4.93 0-1.087.389-1.979 1.024-2.675-.101-.253-.446-1.268.099-2.64 0 0 .837-.269 2.742 1.021a9.582 9.582 0 0 1 2.496-.336 9.554 9.554 0 0 1 2.496.336c1.906-1.291 2.742-1.021 2.742-1.021.545 1.372.203 2.387.099 2.64.64.696 1.024 1.587 1.024 2.675 0 3.833-2.33 4.675-4.552 4.922.355.308.675.916.675 1.846 0 1.334-.012 2.41-.012 2.737 0 .267.178.577.687.479C19.146 20.115 22 16.379 22 11.974 22 6.465 17.535 2 12.026 2z"/>
                          </svg>
                        </Link>

                        <Link
                          isExternal
                          href={siteConfig.links.discord}
                          className="group flex items-center justify-center w-12 h-12 bg-black/30 backdrop-blur-sm border border-dark-700 hover:bg-primary-600 hover:border-primary-500 rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-red-glow"
                        >
                          <svg className="w-6 h-6 text-gray-400 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14.82 4.26a10.14 10.14 0 0 0-.53 1.1 14.66 14.66 0 0 0-4.58 0 10.14 10.14 0 0 0-.53-1.1 16 16 0 0 0-4.13 1.3 17.33 17.33 0 0 0-3 11.59 16.6 16.6 0 0 0 5.07 2.59A12.89 12.89 0 0 0 8.23 18a9.65 9.65 0 0 1-1.71-.83 3.39 3.39 0 0 0 .42-.33 11.66 11.66 0 0 0 10.12 0q.21.18.42.33a10.84 10.84 0 0 1-1.71.84 12.41 12.41 0 0 0 1.08 1.78 16.44 16.44 0 0 0 5.06-2.59 17.22 17.22 0 0 0-3-11.59 16.09 16.09 0 0 0-4.09-1.35zM8.68 14.81a1.94 1.94 0 0 1-1.8-2 1.93 1.93 0 0 1 1.8-2 1.93 1.93 0 0 1 1.8 2 1.93 1.93 0 0 1-1.8 2zm6.64 0a1.94 1.94 0 0 1-1.8-2 1.93 1.93 0 0 1 1.8-2 1.92 1.92 0 0 1 1.8 2 1.92 1.92 0 0 1-1.8 2z"/>
                          </svg>
                        </Link>

                        <Link
                          isExternal
                          href={siteConfig.links.support}
                          className="group flex items-center justify-center w-12 h-12 bg-black/30 backdrop-blur-sm border border-dark-700 hover:bg-primary-600 hover:border-primary-500 rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-red-glow"
                        >
                          <svg className="w-6 h-6 text-gray-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                    
                    {/* Quick Links */}
                    <div className="space-y-6">
                      <h4 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 bg-primary-600 rounded-full animate-pulse-red"></span>
                        Explore
                      </h4>
                      <ul className="space-y-4">
                        <li>
                          <Link
                            href="/cars"
                            className="text-gray-400 hover:text-primary-500 transition-colors duration-300 font-medium text-lg group flex items-center gap-2"
                          >
                            <span className="group-hover:translate-x-1 transition-transform duration-300">Browse Premium Cars</span>
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/seller/new"
                            className="text-gray-400 hover:text-primary-500 transition-colors duration-300 font-medium text-lg group flex items-center gap-2"
                          >
                            <span className="group-hover:translate-x-1 transition-transform duration-300">Sell Your Vehicle</span>
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/subscription"
                            className="text-gray-400 hover:text-primary-500 transition-colors duration-300 font-medium text-lg group flex items-center gap-2"
                          >
                            <span className="group-hover:translate-x-1 transition-transform duration-300">Elite Memberships</span>
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/about"
                            className="text-gray-400 hover:text-primary-500 transition-colors duration-300 font-medium text-lg group flex items-center gap-2"
                          >
                            <span className="group-hover:translate-x-1 transition-transform duration-300">About AutoHub</span>
                          </Link>
                        </li>
                      </ul>
                    </div>

                    {/* Support & Legal */}
                    <div className="space-y-6">
                      <h4 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 bg-primary-600 rounded-full animate-pulse-red"></span>
                        Support
                      </h4>
                      <ul className="space-y-4">
                        <li>
                          <Link
                            href="/support"
                            className="text-gray-400 hover:text-primary-500 transition-colors duration-300 font-medium text-lg group flex items-center gap-2"
                          >
                            <span className="group-hover:translate-x-1 transition-transform duration-300">Help Center</span>
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/contact"
                            className="text-gray-400 hover:text-primary-500 transition-colors duration-300 font-medium text-lg group flex items-center gap-2"
                          >
                            <span className="group-hover:translate-x-1 transition-transform duration-300">Contact Elite Support</span>
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/privacy"
                            className="text-gray-400 hover:text-primary-500 transition-colors duration-300 font-medium text-lg group flex items-center gap-2"
                          >
                            <span className="group-hover:translate-x-1 transition-transform duration-300">Privacy Policy</span>
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/terms"
                            className="text-gray-400 hover:text-primary-500 transition-colors duration-300 font-medium text-lg group flex items-center gap-2"
                          >
                            <span className="group-hover:translate-x-1 transition-transform duration-300">Terms of Service</span>
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  {/* Trust Indicators */}
                  <div className="border-t border-dark-800 pt-8 mb-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                      <div className="bg-black/40 backdrop-blur-md border border-dark-700 rounded-2xl p-6 group hover:scale-105 hover:border-primary-600 transition-all duration-300">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
                        <h5 className="font-bold text-white mb-1">Secure</h5>
                        <p className="text-sm text-gray-400">Bank-Level Security</p>
                      </div>

                      <div className="bg-black/40 backdrop-blur-md border border-dark-700 rounded-2xl p-6 group hover:scale-105 hover:border-primary-600 transition-all duration-300">
                        <div className="w-12 h-12 bg-gradient-red-dark rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300 shadow-red-glow">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </div>
                        <h5 className="font-bold text-white mb-1">Premium</h5>
                        <p className="text-sm text-gray-400">Elite Experience</p>
                      </div>

                      <div className="bg-black/40 backdrop-blur-md border border-dark-700 rounded-2xl p-6 group hover:scale-105 hover:border-primary-600 transition-all duration-300">
                        <div className="w-12 h-12 bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300 shadow-red-glow">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <h5 className="font-bold text-white mb-1">Support</h5>
                        <p className="text-sm text-gray-400">24/7 Concierge</p>
                      </div>

                      <div className="bg-black/40 backdrop-blur-md border border-dark-700 rounded-2xl p-6 group hover:scale-105 hover:border-primary-600 transition-all duration-300">
                        <div className="w-12 h-12 bg-gradient-to-r from-gray-700 to-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9-9a9 9 0 00-9 9m0 0a9 9 0 009 9" />
                          </svg>
                        </div>
                        <h5 className="font-bold text-white mb-1">Global</h5>
                        <p className="text-sm text-gray-400">Worldwide Network</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Footer Bottom */}
                  <div className="border-t border-dark-800 pt-8 flex flex-col lg:flex-row justify-between items-center gap-6">
                    <div className="text-center lg:text-left">
                      <p className="text-gray-400 text-lg">
                        &copy; 2024 AutoHub Elite. All rights reserved.
                      </p>
                      <p className="text-gray-500 text-sm mt-1">
                        Powered by premium automotive excellence and cutting-edge technology.
                      </p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2 text-gray-400">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse-red"></div>
                        <span className="text-sm font-medium">All systems operational</span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-sm font-medium">SSL Secured</span>
                      </div>
                    </div>
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