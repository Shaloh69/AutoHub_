// ==========================================
// components/Navigation.tsx - Modern Clean Navigation with Animated Logo
// ==========================================

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
} from '@heroui/navbar';
import {Button} from "@heroui/button";
import {Dropdown, DropdownTrigger, DropdownMenu, DropdownItem} from "@heroui/dropdown";
import {Badge} from "@heroui/badge";
import {
  Car, Heart, User, LogOut, Settings, Bell,
  Plus, LayoutDashboard, MessageCircle, Package,
  Shield, Menu, Crown, Search, Home
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated, isSeller, isAdmin } = useAuth();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Animated car logo - drives at random intervals
  useEffect(() => {
    const scheduleNextAnimation = () => {
      // Random interval between 8-15 seconds
      const delay = Math.random() * 7000 + 8000;

      animationTimeoutRef.current = setTimeout(() => {
        setIsAnimating(true);

        // Animation lasts 3 seconds
        setTimeout(() => {
          setIsAnimating(false);
          scheduleNextAnimation();
        }, 3000);
      }, delay);
    };

    scheduleNextAnimation();

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  // Role-based theme configuration
  const getRoleTheme = () => {
    if (isAdmin) {
      return {
        gradient: 'from-purple-600 via-purple-500 to-indigo-600',
        accentColor: 'purple',
        accent: 'text-purple-400',
        accentHover: 'hover:text-purple-300',
        badge: 'bg-purple-600',
        bgOverlay: 'bg-purple-900/10',
        borderColor: 'border-purple-500/20',
        roleIcon: Shield,
        roleLabel: 'ADMIN',
      };
    } else if (isSeller) {
      return {
        gradient: 'from-orange-600 via-orange-500 to-red-600',
        accentColor: 'orange',
        accent: 'text-orange-400',
        accentHover: 'hover:text-orange-300',
        badge: 'bg-orange-600',
        bgOverlay: 'bg-orange-900/10',
        borderColor: 'border-orange-500/20',
        roleIcon: Package,
        roleLabel: 'SELLER',
      };
    } else {
      return {
        gradient: 'from-blue-600 via-cyan-500 to-teal-600',
        accentColor: 'blue',
        accent: 'text-blue-400',
        accentHover: 'hover:text-blue-300',
        badge: 'bg-blue-600',
        bgOverlay: 'bg-blue-900/10',
        borderColor: 'border-blue-500/20',
        roleIcon: null,
        roleLabel: null,
      };
    }
  };

  const theme = getRoleTheme();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const loadNotifications = async () => {
    try {
      const response = await apiService.getUnreadCount();
      if (response.success && response.data) {
        setUnreadCount(response.data.unread_count);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const RoleIcon = theme.roleIcon;

  return (
    <>
      {/* Top gradient line */}
      <div className={`h-1 w-full bg-gradient-to-r ${theme.gradient}`} />

      <Navbar
        maxWidth="2xl"
        isBordered={false}
        isMenuOpen={isMenuOpen}
        onMenuOpenChange={setIsMenuOpen}
        classNames={{
          base: 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 shadow-sm',
          wrapper: 'px-4 sm:px-6 lg:px-8 h-16',
          item: 'data-[active=true]:font-semibold',
        }}
      >
        {/* Mobile Menu Toggle */}
        <NavbarContent className="md:hidden" justify="start">
          <NavbarMenuToggle
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            className="text-gray-700 dark:text-gray-300"
          >
            <Menu size={24} />
          </NavbarMenuToggle>
        </NavbarContent>

        {/* Logo - Mobile */}
        <NavbarContent className="md:hidden" justify="center">
          <NavbarBrand>
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative overflow-hidden">
                <Car
                  className={`${theme.accent} transition-all duration-300 group-hover:scale-110 ${
                    isAnimating ? 'animate-drive' : ''
                  }`}
                  size={28}
                  strokeWidth={2.5}
                />
              </div>
              <span className="font-black text-xl bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                AutoHub
              </span>
            </Link>
          </NavbarBrand>
        </NavbarContent>

        {/* Logo & Primary Nav - Desktop */}
        <NavbarContent className="hidden md:flex gap-8" justify="start">
          <NavbarBrand className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className={`absolute inset-0 ${theme.bgOverlay} rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className={`relative p-2 rounded-lg bg-gradient-to-br ${theme.gradient} shadow-lg transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                  <Car
                    className={`text-white transition-all duration-300 ${
                      isAnimating ? 'animate-drive' : ''
                    }`}
                    size={28}
                    strokeWidth={2.5}
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-black text-2xl bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent leading-none">
                  AutoHub
                </span>
                <span className={`text-[10px] font-semibold ${theme.accent} tracking-wider uppercase`}>
                  Philippines
                </span>
              </div>
            </Link>
          </NavbarBrand>

          <div className="flex items-center gap-1">
            <NavbarItem>
              <Link
                href="/"
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                  pathname === '/'
                    ? `bg-gradient-to-r ${theme.gradient} text-white shadow-md`
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Home size={16} />
                <span className="hidden lg:inline">Home</span>
              </Link>
            </NavbarItem>

            <NavbarItem>
              <Link
                href="/cars"
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                  pathname === '/cars'
                    ? `bg-gradient-to-r ${theme.gradient} text-white shadow-md`
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Search size={16} />
                <span className="hidden lg:inline">Browse Cars</span>
              </Link>
            </NavbarItem>

            {isSeller && (
              <>
                <NavbarItem>
                  <Link
                    href="/seller/dashboard"
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                      pathname.startsWith('/seller')
                        ? `bg-gradient-to-r ${theme.gradient} text-white shadow-md`
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <LayoutDashboard size={16} />
                    <span className="hidden lg:inline">Dashboard</span>
                  </Link>
                </NavbarItem>

                <NavbarItem>
                  <Link
                    href="/subscription"
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                      pathname === '/subscription'
                        ? `bg-gradient-to-r ${theme.gradient} text-white shadow-md`
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Crown size={16} />
                    <span className="hidden lg:inline">Subscription</span>
                  </Link>
                </NavbarItem>
              </>
            )}

            {isAdmin && (
              <NavbarItem>
                <Link
                  href="/admin"
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                    pathname.startsWith('/admin')
                      ? `bg-gradient-to-r ${theme.gradient} text-white shadow-md`
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Shield size={16} />
                  <span className="hidden lg:inline">Admin</span>
                </Link>
              </NavbarItem>
            )}
          </div>
        </NavbarContent>

        {/* Right Side Actions */}
        <NavbarContent justify="end" className="gap-2">
          {isAuthenticated ? (
            <>
              {/* Role Badge */}
              {RoleIcon && theme.roleLabel && (
                <div className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border ${theme.borderColor} ${theme.bgOverlay} backdrop-blur-sm`}>
                  <RoleIcon size={14} className={theme.accent} />
                  <span className={`text-xs font-bold ${theme.accent} tracking-wide`}>
                    {theme.roleLabel}
                  </span>
                </div>
              )}

              {/* Notifications */}
              <NavbarItem>
                <Button
                  isIconOnly
                  variant="light"
                  as={Link}
                  href="/notifications"
                  className="relative text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Notifications"
                >
                  <Badge
                    content={unreadCount}
                    color="danger"
                    isInvisible={unreadCount === 0}
                    size="sm"
                    shape="circle"
                  >
                    <Bell size={20} />
                  </Badge>
                </Button>
              </NavbarItem>

              {/* Favorites */}
              <NavbarItem className="hidden sm:flex">
                <Button
                  isIconOnly
                  variant="light"
                  as={Link}
                  href="/favorites"
                  className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Favorites"
                >
                  <Heart size={20} />
                </Button>
              </NavbarItem>

              {/* User Menu */}
              <NavbarItem>
                <Dropdown placement="bottom-end">
                  <DropdownTrigger>
                    <Button
                      variant="flat"
                      className={`flex items-center gap-2 px-3 py-2 h-10 bg-gradient-to-r ${theme.gradient} hover:opacity-90 text-white font-medium shadow-md transition-all duration-200 hover:shadow-lg`}
                    >
                      <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xs font-bold overflow-hidden border-2 border-white/30">
                        {user?.profile_image ? (
                          <img
                            src={user.profile_image}
                            alt={user.first_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          `${user?.first_name[0]}${user?.last_name[0]}`
                        )}
                      </div>
                      <span className="hidden md:inline text-sm font-semibold">
                        {user?.first_name}
                      </span>
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu aria-label="User actions" className="w-56">
                    <DropdownItem
                      key="profile-header"
                      className="h-14 gap-2"
                      textValue="Profile header"
                    >
                      <div className="flex flex-col">
                        <p className="font-semibold text-sm">
                          {user?.first_name} {user?.last_name}
                        </p>
                        <p className="text-xs text-default-500">{user?.email}</p>
                      </div>
                    </DropdownItem>

                    <DropdownItem
                      key="profile"
                      startContent={<User size={18} />}
                      as={Link}
                      href="/profile"
                    >
                      My Profile
                    </DropdownItem>

                    {isSeller && (
                      <>
                        <DropdownItem
                          key="dashboard"
                          startContent={<LayoutDashboard size={18} />}
                          as={Link}
                          href="/seller/dashboard"
                        >
                          Seller Dashboard
                        </DropdownItem>
                        <DropdownItem
                          key="subscription"
                          startContent={<Crown size={18} />}
                          as={Link}
                          href="/subscription"
                          className="text-orange-600 dark:text-orange-400"
                        >
                          Manage Subscription
                        </DropdownItem>
                        <DropdownItem
                          key="create"
                          startContent={<Plus size={18} />}
                          as={Link}
                          href="/seller/new"
                        >
                          Create Listing
                        </DropdownItem>
                      </>
                    )}

                    <DropdownItem
                      key="favorites"
                      startContent={<Heart size={18} />}
                      as={Link}
                      href="/favorites"
                    >
                      Favorites
                    </DropdownItem>

                    <DropdownItem
                      key="settings"
                      startContent={<Settings size={18} />}
                      as={Link}
                      href="/settings"
                    >
                      Settings
                    </DropdownItem>

                    <DropdownItem
                      key="logout"
                      color="danger"
                      startContent={<LogOut size={18} />}
                      onPress={handleLogout}
                      className="text-danger"
                    >
                      Logout
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </NavbarItem>
            </>
          ) : (
            <>
              <NavbarItem className="hidden sm:flex">
                <Button
                  as={Link}
                  href="/auth/login"
                  variant="bordered"
                  className="font-medium border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Login
                </Button>
              </NavbarItem>
              <NavbarItem>
                <Button
                  as={Link}
                  href="/auth/register"
                  className={`font-semibold bg-gradient-to-r ${theme.gradient} text-white shadow-md hover:shadow-lg transition-all duration-200`}
                >
                  Sign Up
                </Button>
              </NavbarItem>
            </>
          )}
        </NavbarContent>

        {/* Mobile Menu */}
        <NavbarMenu className="bg-white dark:bg-gray-900 pt-6 gap-3">
          <NavbarMenuItem>
            <Link
              href="/"
              className={`w-full px-4 py-3 rounded-lg font-medium flex items-center gap-3 transition-colors ${
                pathname === '/'
                  ? `bg-gradient-to-r ${theme.gradient} text-white`
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <Home size={20} />
              Home
            </Link>
          </NavbarMenuItem>

          <NavbarMenuItem>
            <Link
              href="/cars"
              className={`w-full px-4 py-3 rounded-lg font-medium flex items-center gap-3 transition-colors ${
                pathname === '/cars'
                  ? `bg-gradient-to-r ${theme.gradient} text-white`
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <Search size={20} />
              Browse Cars
            </Link>
          </NavbarMenuItem>

          {isAuthenticated && (
            <NavbarMenuItem>
              <Link
                href="/favorites"
                className={`w-full px-4 py-3 rounded-lg font-medium flex items-center gap-3 transition-colors ${
                  pathname === '/favorites'
                    ? `bg-gradient-to-r ${theme.gradient} text-white`
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <Heart size={20} />
                Favorites
              </Link>
            </NavbarMenuItem>
          )}

          {isSeller && (
            <>
              <NavbarMenuItem className="mt-4">
                <div className="px-4 py-2 flex items-center gap-2">
                  <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
                  <span className={`text-xs font-bold ${theme.accent} uppercase tracking-wider`}>
                    Seller Menu
                  </span>
                  <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
                </div>
              </NavbarMenuItem>

              <NavbarMenuItem>
                <Link
                  href="/seller/dashboard"
                  className={`w-full px-4 py-3 rounded-lg font-medium flex items-center gap-3 transition-colors ${
                    pathname.startsWith('/seller')
                      ? `bg-gradient-to-r ${theme.gradient} text-white`
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <LayoutDashboard size={20} />
                  Dashboard
                </Link>
              </NavbarMenuItem>

              <NavbarMenuItem>
                <Link
                  href="/subscription"
                  className={`w-full px-4 py-3 rounded-lg font-medium flex items-center gap-3 transition-colors ${
                    pathname === '/subscription'
                      ? `bg-gradient-to-r ${theme.gradient} text-white`
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Crown size={20} />
                  Subscription
                </Link>
              </NavbarMenuItem>

              <NavbarMenuItem>
                <Link
                  href="/seller/new"
                  className="w-full px-4 py-3 rounded-lg font-medium flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Plus size={20} />
                  Create Listing
                </Link>
              </NavbarMenuItem>
            </>
          )}

          {isAdmin && (
            <>
              <NavbarMenuItem className="mt-4">
                <div className="px-4 py-2 flex items-center gap-2">
                  <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
                  <span className={`text-xs font-bold ${theme.accent} uppercase tracking-wider`}>
                    Admin Menu
                  </span>
                  <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
                </div>
              </NavbarMenuItem>

              <NavbarMenuItem>
                <Link
                  href="/admin"
                  className={`w-full px-4 py-3 rounded-lg font-medium flex items-center gap-3 transition-colors ${
                    pathname.startsWith('/admin')
                      ? `bg-gradient-to-r ${theme.gradient} text-white`
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Shield size={20} />
                  Admin Panel
                </Link>
              </NavbarMenuItem>
            </>
          )}

          {!isAuthenticated && (
            <>
              <NavbarMenuItem className="mt-4">
                <Button
                  as={Link}
                  href="/auth/login"
                  variant="bordered"
                  className="w-full font-medium border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Button>
              </NavbarMenuItem>
              <NavbarMenuItem>
                <Button
                  as={Link}
                  href="/auth/register"
                  className={`w-full font-semibold bg-gradient-to-r ${theme.gradient} text-white shadow-md`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Button>
              </NavbarMenuItem>
            </>
          )}
        </NavbarMenu>
      </Navbar>

      <style jsx global>{`
        @keyframes drive {
          0% {
            transform: translateX(0) rotate(0deg);
          }
          25% {
            transform: translateX(100px) rotate(-5deg);
          }
          50% {
            transform: translateX(200px) rotate(0deg);
          }
          75% {
            transform: translateX(100px) rotate(5deg);
          }
          100% {
            transform: translateX(0) rotate(0deg);
          }
        }

        .animate-drive {
          animation: drive 3s ease-in-out;
        }
      `}</style>
    </>
  );
}
