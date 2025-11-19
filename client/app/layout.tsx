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
import { DynamicAnimatedBackground } from "@/components/background";
import LayoutContent from "@/components/LayoutContent";

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
        <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
          <AuthProvider>
            {/* Animated Background - Applied to all pages with dynamic colors */}
            <DynamicAnimatedBackground />

            <LayoutContent>
              {children}
            </LayoutContent>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}