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
import { Button } from '@heroui/button';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/dropdown';
import { Badge } from '@heroui/badge';
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
        base: 'bg-white dark:bg-gray-900',
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
          <Link href="/" className="font-bold text-xl flex items-center gap-2">
            <Car className="text-blue-600" size={28} />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AutoHub
            </span>
          </Link>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden sm:flex gap-4" justify="start">
        <NavbarBrand>
          <Link href="/" className="font-bold text-xl flex items-center gap-2">
            <Car className="text-blue-600" size={28} />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AutoHub
            </span>
          </Link>
        </NavbarBrand>

        <NavbarItem>
          <Link
            href="/cars"
            className={`text-sm ${
              pathname === '/cars'
                ? 'text-blue-600 font-semibold'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            Browse Cars
          </Link>
        </NavbarItem>

        {isSeller && (
          <NavbarItem>
            <Link
              href="/seller/dashboard"
              className={`text-sm ${
                pathname.startsWith('/seller')
                  ? 'text-blue-600 font-semibold'
                  : 'text-gray-600 hover:text-blue-600'
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
              className={`text-sm flex items-center gap-1 ${
                pathname.startsWith('/admin')
                  ? 'text-blue-600 font-semibold'
                  : 'text-gray-600 hover:text-blue-600'
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
                className="relative"
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
                    className="flex items-center gap-2"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
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
                    <span className="hidden md:inline">
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
              >
                Login
              </Button>
            </NavbarItem>
            <NavbarItem>
              <Button
                as={Link}
                href="/auth/register"
                color="primary"
              >
                Sign Up
              </Button>
            </NavbarItem>
          </>
        )}
      </NavbarContent>

      {/* Mobile Menu */}
      <NavbarMenu>
        {menuItems.map((item, index) => {
          if (item.requireAuth && !isAuthenticated) return null;
          if (!item.public && !isAuthenticated) return null;

          return (
            <NavbarMenuItem key={`${item.label}-${index}`}>
              <Link
                href={item.href}
                className="w-full text-lg"
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
              <p className="text-xs text-gray-500 uppercase mt-4 mb-2">
                Seller Menu
              </p>
            </NavbarMenuItem>
            {sellerMenuItems.map((item, index) => (
              <NavbarMenuItem key={`seller-${index}`}>
                <Link
                  href={item.href}
                  className="w-full flex items-center gap-2"
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
                className="w-full"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Button>
            </NavbarMenuItem>
            <NavbarMenuItem>
              <Button
                as={Link}
                href="/auth/register"
                color="primary"
                className="w-full"
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