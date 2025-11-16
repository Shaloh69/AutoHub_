// ==========================================
// components/Navigation.tsx - Complete Navigation
// ==========================================

'use client';

import { useState, useEffect } from 'react';
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
  Shield, Menu
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated, isSeller, isAdmin } = useAuth();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Role-based theme configuration
  const getRoleTheme = () => {
    if (isAdmin) {
      return {
        navbar: 'bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 border-b-2 border-purple-600',
        navbarShadow: 'shadow-lg shadow-purple-500/20',
        accent: 'text-purple-400',
        accentHover: 'hover:text-purple-300',
        badge: 'bg-purple-600',
        buttonGradient: 'bg-gradient-to-r from-purple-600 to-indigo-600',
        buttonHover: 'hover:from-purple-500 hover:to-indigo-500',
        roleBadge: (
          <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 bg-purple-600/20 border border-purple-500/30 rounded-full">
            <Shield size={12} className="text-purple-400" />
            <span className="text-xs font-bold text-purple-300">ADMIN</span>
          </div>
        ),
      };
    } else if (isSeller) {
      return {
        navbar: 'bg-gradient-to-r from-orange-900 via-red-900 to-red-800 border-b-2 border-orange-600',
        navbarShadow: 'shadow-lg shadow-orange-500/20',
        accent: 'text-orange-400',
        accentHover: 'hover:text-orange-300',
        badge: 'bg-orange-600',
        buttonGradient: 'bg-gradient-to-r from-orange-600 to-red-600',
        buttonHover: 'hover:from-orange-500 hover:to-red-500',
        roleBadge: (
          <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 bg-orange-600/20 border border-orange-500/30 rounded-full">
            <Package size={12} className="text-orange-400" />
            <span className="text-xs font-bold text-orange-300">SELLER</span>
          </div>
        ),
      };
    } else {
      return {
        navbar: 'bg-gradient-to-r from-gray-900 via-black to-gray-900 border-b-2 border-gray-800',
        navbarShadow: 'shadow-lg shadow-red-500/10',
        accent: 'text-red-500',
        accentHover: 'hover:text-red-400',
        badge: 'bg-red-600',
        buttonGradient: 'bg-gradient-to-r from-red-600 to-red-700',
        buttonHover: 'hover:from-red-500 hover:to-red-600',
        roleBadge: null,
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

  const menuItems = [
    { label: 'Home', href: '/', public: true },
    { label: 'Browse Cars', href: '/cars', public: true },
    { label: 'Favorites', href: '/favorites', requireAuth: true },
    { label: 'Profile', href: '/profile', requireAuth: true },
  ];

  const sellerMenuItems = [
    { label: 'Dashboard', href: '/seller/dashboard', icon: <LayoutDashboard size={18} /> },
    { label: 'Create Listing', href: '/seller/cars/new', icon: <Plus size={18} /> },
    { label: 'Inquiries', href: '/seller/inquiries', icon: <MessageCircle size={18} /> },
    { label: 'Transactions', href: '/seller/transactions', icon: <Package size={18} /> },
  ];

  return (
    <Navbar
      maxWidth="xl"
      isBordered
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
      classNames={{
        base: `${theme.navbar} ${theme.navbarShadow}`,
        wrapper: 'px-4 sm:px-6',
      }}
    >
      {/* Mobile Menu Toggle */}
      <NavbarContent className="sm:hidden" justify="start">
        <NavbarMenuToggle
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          icon={<Menu size={24} />}
        />
      </NavbarContent>

      {/* Logo */}
      <NavbarContent className="sm:hidden pr-3" justify="center">
        <NavbarBrand>
          <Link href="/" className="font-bold text-xl flex items-center gap-2 group">
            <Car className={`${theme.accent} ${theme.accentHover} transition-colors`} size={28} />
            <span className="text-white font-black tracking-tight drop-shadow-lg">
              AutoHub
            </span>
          </Link>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden sm:flex gap-6" justify="start">
        <NavbarBrand className="flex items-center gap-3">
          <Link href="/" className="font-bold text-xl flex items-center gap-2 group">
            <Car className={`${theme.accent} ${theme.accentHover} transition-colors`} size={32} />
            <span className="text-white font-black tracking-tight drop-shadow-lg text-2xl">
              AutoHub
            </span>
          </Link>
          {theme.roleBadge}
        </NavbarBrand>

        <NavbarItem>
          <Link
            href="/cars"
            className={`text-sm font-semibold transition-all ${
              pathname === '/cars'
                ? `${theme.accent} underline underline-offset-4`
                : `text-gray-200 ${theme.accentHover}`
            }`}
          >
            Browse Cars
          </Link>
        </NavbarItem>

        {isSeller && (
          <NavbarItem>
            <Link
              href="/seller/dashboard"
              className={`text-sm font-semibold transition-all flex items-center gap-1.5 ${
                pathname.startsWith('/seller')
                  ? `${theme.accent} underline underline-offset-4`
                  : `text-gray-200 ${theme.accentHover}`
              }`}
            >
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
          </NavbarItem>
        )}

        {isAdmin && (
          <NavbarItem>
            <Link
              href="/admin"
              className={`text-sm font-semibold transition-all flex items-center gap-1.5 ${
                pathname.startsWith('/admin')
                  ? `${theme.accent} underline underline-offset-4`
                  : `text-gray-200 ${theme.accentHover}`
              }`}
            >
              <Shield size={16} />
              Admin Panel
            </Link>
          </NavbarItem>
        )}
      </NavbarContent>

      {/* Right Side Actions */}
      <NavbarContent justify="end" className="gap-2">
        {isAuthenticated ? (
          <>
            {/* Notifications */}
            <NavbarItem>
              <Button
                isIconOnly
                variant="light"
                as={Link}
                href="/notifications"
                className={`relative text-gray-200 ${theme.accentHover} transition-colors`}
              >
                <Badge
                  content={unreadCount}
                  className={theme.badge}
                  isInvisible={unreadCount === 0}
                  size="sm"
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
                className={`text-gray-200 ${theme.accentHover} transition-colors`}
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
                    className={`flex items-center gap-2 ${theme.buttonGradient} ${theme.buttonHover} text-white font-semibold border-2 border-white/10 shadow-lg transition-all hover:scale-105`}
                  >
                    <div className={`w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-sm font-bold overflow-hidden border-2 border-white/30`}>
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
                    <span className="hidden md:inline text-white font-semibold drop-shadow">
                      {user?.first_name}
                    </span>
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="User actions">
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
                        key="create"
                        startContent={<Plus size={18} />}
                        as={Link}
                        href="/seller/cars/new"
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
                variant="flat"
                className="bg-white/10 backdrop-blur-sm border-2 border-white/20 hover:border-white/40 text-white font-semibold transition-all hover:bg-white/20"
              >
                Login
              </Button>
            </NavbarItem>
            <NavbarItem>
              <Button
                as={Link}
                href="/auth/register"
                className={`${theme.buttonGradient} ${theme.buttonHover} text-white font-bold shadow-lg transition-all hover:scale-105 border-2 border-white/10`}
              >
                Sign Up
              </Button>
            </NavbarItem>
          </>
        )}
      </NavbarContent>

      {/* Mobile Menu */}
      <NavbarMenu className="bg-dark-900 border-r border-dark-700">
        {menuItems.map((item, index) => {
          if (item.requireAuth && !isAuthenticated) return null;
          if (!item.public && !isAuthenticated) return null;

          return (
            <NavbarMenuItem key={`${item.label}-${index}`}>
              <Link
                href={item.href}
                className="w-full text-lg text-gray-300 hover:text-primary-500 font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            </NavbarMenuItem>
          );
        })}

        {isSeller && (
          <>
            <NavbarMenuItem>
              <p className="text-xs text-primary-500 uppercase mt-4 mb-2 font-bold">
                Seller Menu
              </p>
            </NavbarMenuItem>
            {sellerMenuItems.map((item, index) => (
              <NavbarMenuItem key={`seller-${index}`}>
                <Link
                  href={item.href}
                  className="w-full flex items-center gap-2 text-gray-300 hover:text-primary-500 font-medium transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </NavbarMenuItem>
            ))}
          </>
        )}

        {!isAuthenticated && (
          <>
            <NavbarMenuItem>
              <Button
                as={Link}
                href="/auth/login"
                variant="flat"
                className="w-full bg-dark-800 border border-dark-700 hover:border-primary-600 text-white font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Button>
            </NavbarMenuItem>
            <NavbarMenuItem>
              <Button
                as={Link}
                href="/auth/register"
                className="w-full bg-gradient-red-dark text-white font-bold shadow-red-glow"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign Up
              </Button>
            </NavbarMenuItem>
          </>
        )}
      </NavbarMenu>
    </Navbar>
  );
}