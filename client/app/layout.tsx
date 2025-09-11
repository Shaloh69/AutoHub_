import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import { Link } from "@heroui/link";
import clsx from "clsx";

import { Providers } from "./providers";

import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: {
    default: "Task Manager",
    template: `%s - Task Manager`,
  },
  description: "A modern task management application built with Next.js and Node.js",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
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
          "min-h-screen text-foreground bg-background font-sans antialiased",
          fontSans.variable,
        )}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
          <div className="relative flex flex-col min-h-screen">
            <Navbar />
            <main className="container mx-auto pt-16 px-6 flex-grow max-w-7xl">
              {children}
            </main>
            <footer className="w-full flex items-center justify-center py-6 border-t border-divider">
              <div className="flex items-center gap-1 text-current">
                <span className="text-default-600">Task Manager API &copy; 2024</span>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}