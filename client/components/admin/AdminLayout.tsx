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
  ChevronRight, Search, Home, Calendar, History
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
      label: 'Cars Management',
      href: '/admin/cars',
      icon: Car,
      description: 'View All Listings'
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
      label: 'Transaction History',
      href: '/admin/transaction-history',
      icon: History,
      description: 'Payment Audit Trail'
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

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-transparent relative overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-black/40 backdrop-blur-xl border-r border-purple-700/30 transition-all duration-300 z-50 flex flex-col ${
          sidebarOpen ? 'w-72' : 'w-20'
        }`}
      >
        {/* Logo & Toggle */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          {sidebarOpen ? (
            <>
              <Link href="/admin" className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-violet-800 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Shield className="text-white" size={22} />
                </div>
                <div>
                  <h1 className="text-white font-bold text-xl">AutoHub</h1>
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

        {/* Admin Badge & Date - Moved from navbar */}
        {sidebarOpen && (
          <div className="px-4 py-3 border-b border-gray-700 bg-black/20 space-y-2">
            <div className="flex items-center justify-between">
              <Chip size="sm" className="bg-purple-600/20 border border-purple-500/30 font-medium">
                <div className="flex items-center gap-1">
                  <Shield size={12} className="text-purple-400" />
                  <span className="text-purple-300">Admin Access</span>
                </div>
              </Chip>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                className="text-gray-400 hover:text-white"
              >
                <Bell size={18} />
              </Button>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Calendar size={14} />
              <span>{getCurrentDate()}</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="p-3 space-y-2 flex-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all group ${
                  active
                    ? 'bg-gradient-to-r from-purple-600 to-violet-700 text-white shadow-lg shadow-purple-500/30'
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

          {/* Quick Links */}
          {sidebarOpen && (
            <div className="pt-4 mt-4 border-t border-gray-700">
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
        </nav>

        {/* User Profile */}
        <div className={`p-4 border-t border-gray-700 bg-black/20 ${
          sidebarOpen ? '' : 'flex justify-center'
        }`}>
          {sidebarOpen ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar
                  src={user?.avatar_url}
                  name={user?.full_name || user?.email}
                  size="sm"
                  className="border-2 border-purple-500"
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
      <main className={`transition-all duration-300 min-h-screen relative z-10 ${sidebarOpen ? 'ml-72' : 'ml-20'}`}>
        {/* Page Content - No navbar */}
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
