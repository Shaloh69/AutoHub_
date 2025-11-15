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
        base: 'bg-black border-b border-dark-700',
        wrapper: 'px-4',
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
            <Car className="text-primary-600 group-hover:text-primary-500 transition-colors" size={28} />
            <span className="text-gradient-red font-black tracking-tight">
              AutoHub
            </span>
          </Link>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden sm:flex gap-4" justify="start">
        <NavbarBrand>
          <Link href="/" className="font-bold text-xl flex items-center gap-2 group">
            <Car className="text-primary-600 group-hover:text-primary-500 transition-colors" size={28} />
            <span className="text-gradient-red font-black tracking-tight">
              AutoHub
            </span>
          </Link>
        </NavbarBrand>

        <NavbarItem>
          <Link
            href="/cars"
            className={`text-sm font-medium transition-colors ${
              pathname === '/cars'
                ? 'text-primary-500 font-bold'
                : 'text-gray-300 hover:text-primary-500'
            }`}
          >
            Browse Cars
          </Link>
        </NavbarItem>

        {isSeller && (
          <NavbarItem>
            <Link
              href="/seller/dashboard"
              className={`text-sm font-medium transition-colors ${
                pathname.startsWith('/seller')
                  ? 'text-primary-500 font-bold'
                  : 'text-gray-300 hover:text-primary-500'
              }`}
            >
              Seller Dashboard
            </Link>
          </NavbarItem>
        )}

        {isAdmin && (
          <NavbarItem>
            <Link
              href="/admin"
              className={`text-sm flex items-center gap-1 font-medium transition-colors ${
                pathname.startsWith('/admin')
                  ? 'text-primary-500 font-bold'
                  : 'text-gray-300 hover:text-primary-500'
              }`}
            >
              <Shield size={16} />
              Admin
            </Link>
          </NavbarItem>
        )}
      </NavbarContent>

      {/* Right Side Actions */}
      <NavbarContent justify="end">
        {isAuthenticated ? (
          <>
            {/* Notifications */}
            <NavbarItem>
              <Button
                isIconOnly
                variant="light"
                as={Link}
                href="/notifications"
                className="relative text-gray-300 hover:text-primary-500 transition-colors"
              >
                <Badge
                  content={unreadCount}
                  color="danger"
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
                className="text-gray-300 hover:text-primary-500 transition-colors"
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
                    className="flex items-center gap-2 bg-dark-800 border border-dark-700 hover:border-primary-600 text-white transition-all"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-red-dark flex items-center justify-center text-white text-sm font-bold overflow-hidden shadow-red-glow">
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
                    <span className="hidden md:inline text-white font-medium">
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
                className="bg-dark-800 border border-dark-700 hover:border-primary-600 text-white font-medium transition-all"
              >
                Login
              </Button>
            </NavbarItem>
            <NavbarItem>
              <Button
                as={Link}
                href="/auth/register"
                className="bg-gradient-red-dark text-white font-bold shadow-red-glow hover:shadow-red-glow-lg transition-all hover:scale-105"
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