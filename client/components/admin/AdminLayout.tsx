// ==========================================
// components/admin/AdminLayout.tsx - Admin Sidebar Layout
// ==========================================

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@heroui/button';
import { Avatar } from '@heroui/avatar';
import { Chip } from '@heroui/chip';
import {
  LayoutDashboard, MessageSquare, CreditCard, Shield,
  Users, Car, Settings, LogOut, Menu, X, Bell,
  ChevronRight, Search, Home
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  description: string;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigation: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      description: 'Overview & Analytics'
    },
    {
      label: 'Reviews',
      href: '/admin/reviews',
      icon: MessageSquare,
      description: 'Moderate Reviews'
    },
    {
      label: 'Payments',
      href: '/admin/payments',
      icon: CreditCard,
      description: 'Verify Subscriptions'
    },
    {
      label: 'Fraud Detection',
      href: '/admin/fraud-detection',
      icon: Shield,
      description: 'Security Monitoring'
    },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-black/40 backdrop-blur-xl border-r border-gray-700 transition-all duration-300 z-50 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo & Toggle */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          {sidebarOpen ? (
            <>
              <Link href="/admin" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                  <Shield className="text-white" size={20} />
                </div>
                <div>
                  <h1 className="text-white font-bold text-lg">AutoHub</h1>
                  <p className="text-xs text-gray-400">Admin Console</p>
                </div>
              </Link>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => setSidebarOpen(false)}
              >
                <X size={18} className="text-gray-400" />
              </Button>
            </>
          ) : (
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={() => setSidebarOpen(true)}
              className="w-full"
            >
              <Menu size={18} className="text-gray-400" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all group ${
                  active
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/30'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={20} className={active ? 'text-white' : 'text-gray-400 group-hover:text-white'} />
                {sidebarOpen && (
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${active ? 'text-white' : 'text-gray-300'}`}>
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{item.description}</p>
                  </div>
                )}
                {sidebarOpen && item.badge && (
                  <Chip size="sm" color="danger" variant="flat">
                    {item.badge}
                  </Chip>
                )}
                {!sidebarOpen && item.badge && (
                  <div className="absolute right-2 top-2 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Quick Links */}
        {sidebarOpen && (
          <div className="px-3 mt-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
              Quick Links
            </p>
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-all"
            >
              <Home size={18} />
              <span className="text-sm">Main Site</span>
            </Link>
          </div>
        )}

        {/* User Profile */}
        <div className={`absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700 bg-black/20 ${
          sidebarOpen ? '' : 'flex justify-center'
        }`}>
          {sidebarOpen ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar
                  src={user?.avatar_url}
                  name={user?.full_name || user?.email}
                  size="sm"
                  className="border-2 border-red-500"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.full_name || 'Admin'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="flat"
                color="danger"
                className="w-full"
                startContent={<LogOut size={16} />}
                onPress={logout}
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              color="danger"
              onPress={logout}
            >
              <LogOut size={16} />
            </Button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-black/40 backdrop-blur-xl border-b border-gray-700">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-white">
                {navigation.find(item => isActive(item.href))?.label || 'Dashboard'}
              </h2>
              <Chip size="sm" color="success" variant="flat">
                Admin
              </Chip>
            </div>

            <div className="flex items-center gap-3">
              <Button
                isIconOnly
                variant="flat"
                className="text-gray-400 hover:text-white"
              >
                <Bell size={20} />
              </Button>
              <div className="w-px h-6 bg-gray-700" />
              <div className="text-sm text-gray-400">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
