"use client"

import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import { Kbd } from "@heroui/kbd";
import { Link } from "@heroui/link";
import { Input } from "@heroui/input";
import { Avatar } from "@heroui/avatar";
import { Badge } from "@heroui/badge";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { link as linkStyles } from "@heroui/theme";
import NextLink from "next/link";
import clsx from "clsx";
import { useRouter } from "next/navigation";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import {
  SearchIcon,
  PlusIcon,
  CarIcon,
  DashboardIcon,
} from "@/components/icons";
import { AutoHubLogo } from "@/components/AutoHubLogo";
import { useAuth } from "@/contexts/AuthContext";

export const Navbar = () => {
  const { user, isAuthenticated, logout, isAdmin, isModerator } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const searchInput = (
    <Input
      aria-label="Search"
      classNames={{
        inputWrapper: "bg-autohub-neutral-100 dark:bg-autohub-secondary-800 border-autohub-accent1-200 hover:border-autohub-primary-500 transition-colors",
        input: "text-sm placeholder:text-autohub-accent1-500",
      }}
      endContent={
        <Kbd className="hidden lg:inline-block bg-autohub-accent2-500 text-autohub-secondary-900" keys={["command"]}>
          K
        </Kbd>
      }
      labelPlacement="outside"
      placeholder="Search luxury cars..."
      startContent={
        <SearchIcon className="text-base text-autohub-accent1-500 pointer-events-none flex-shrink-0" />
      }
      type="search"
      variant="bordered"
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          const query = (e.target as HTMLInputElement).value;
          if (query.trim()) {
            router.push(`/cars?search=${encodeURIComponent(query)}`);
          }
        }
      }}
    />
  );

  return (
    <HeroUINavbar 
      maxWidth="xl" 
      position="sticky"
      classNames={{
        base: "bg-autohub-secondary-900 dark:bg-autohub-secondary-900 backdrop-blur-md border-b border-autohub-accent1-800",
        wrapper: "px-4 sm:px-6",
        brand: "gap-3 max-w-fit",
        content: "gap-4",
      }}
    >
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-3 group" href="/">
            <AutoHubLogo className="group-hover:scale-110 transition-transform duration-200" size={32} />
            <div className="flex flex-col">
              <p className="font-bold text-xl text-autohub-neutral-50 tracking-tight">AutoHub</p>
              <p className="text-xs text-autohub-accent2-500 font-medium">Premium Automotive</p>
            </div>
          </NextLink>
        </NavbarBrand>
        
        <ul className="hidden lg:flex gap-6 justify-start ml-8">
          <NavbarItem>
            <NextLink
              className={clsx(
                linkStyles({ color: "foreground" }),
                "text-autohub-neutral-100 hover:text-autohub-primary-500 transition-colors font-medium",
                "data-[active=true]:text-autohub-primary-500 data-[active=true]:font-semibold"
              )}
              href="/cars"
            >
              <CarIcon size={18} className="mr-2 inline" />
              Browse Cars
            </NextLink>
          </NavbarItem>
          {isAuthenticated && (
            <>
              <NavbarItem>
                <NextLink
                  className={clsx(
                    linkStyles({ color: "foreground" }),
                    "text-autohub-neutral-100 hover:text-autohub-primary-500 transition-colors font-medium",
                    "data-[active=true]:text-autohub-primary-500 data-[active=true]:font-semibold"
                  )}
                  href="/dashboard"
                >
                  <DashboardIcon size={18} className="mr-2 inline" />
                  Dashboard
                </NextLink>
              </NavbarItem>
              <NavbarItem>
                <NextLink
                  className={clsx(
                    linkStyles({ color: "foreground" }),
                    "text-autohub-neutral-100 hover:text-autohub-accent2-500 transition-colors font-medium",
                    "data-[active=true]:text-autohub-accent2-500 data-[active=true]:font-semibold"
                  )}
                  href="/subscription"
                >
                  Premium
                </NextLink>
              </NavbarItem>
            </>
          )}
          {(isAdmin || isModerator) && (
            <NavbarItem>
              <NextLink
                className={clsx(
                  linkStyles({ color: "foreground" }),
                  "text-autohub-accent2-500 hover:text-autohub-accent2-400 transition-colors font-medium",
                  "data-[active=true]:text-autohub-accent2-400 data-[active=true]:font-semibold"
                )}
                href="/admin"
              >
                Admin Panel
              </NextLink>
            </NavbarItem>
          )}
        </ul>
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        <NavbarItem className="hidden lg:flex">{searchInput}</NavbarItem>
        
        {isAuthenticated ? (
          <>
            <NavbarItem>
              <NotificationDropdown />
            </NavbarItem>
            <NavbarItem>
              <Button
                as={NextLink}
                href="/dashboard/create-listing"
                className="bg-autohub-primary-500 hover:bg-autohub-primary-600 text-white font-semibold shadow-autohub transition-all duration-200 hover:shadow-lg hover:scale-105"
                size="sm"
                startContent={<PlusIcon size={16} />}
              >
                Sell Car
              </Button>
            </NavbarItem>
            <NavbarItem>
              <Dropdown placement="bottom-end">
                <DropdownTrigger>
                  <Avatar
                    isBordered
                    as="button"
                    className="transition-transform hover:scale-105 border-autohub-accent2-500"
                    color="primary"
                    name={user?.firstName}
                    size="sm"
                    src={user?.profileImage}
                  />
                </DropdownTrigger>
                <DropdownMenu 
                  aria-label="Profile Actions" 
                  variant="flat"
                  className="bg-autohub-neutral-50 dark:bg-autohub-secondary-800"
                >
                  <DropdownItem key="profile" className="h-14 gap-2" textValue="profile">
                    <div className="flex flex-col">
                      <p className="font-semibold text-autohub-secondary-900 dark:text-autohub-neutral-100">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-sm text-autohub-accent1-600">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownItem>
                  <DropdownItem key="dashboard" as={NextLink} href="/dashboard">
                    Dashboard
                  </DropdownItem>
                  <DropdownItem key="profile-settings" as={NextLink} href="/dashboard/profile">
                    Profile Settings
                  </DropdownItem>
                  <DropdownItem key="subscription" as={NextLink} href="/subscription">
                    <div className="flex items-center justify-between w-full">
                      <span>Subscription</span>
                      <Badge 
                        content="Premium" 
                        color="warning" 
                        size="sm"
                        className="bg-autohub-accent2-500 text-autohub-secondary-900"
                      />
                    </div>
                  </DropdownItem>
                  <DropdownItem key="my-listings" as={NextLink} href="/dashboard">
                    My Listings
                  </DropdownItem>
                  {(isAdmin || isModerator) && (
                    <DropdownItem 
                      key="admin" 
                      as={NextLink} 
                      href="/admin"
                      className="text-autohub-accent2-600"
                    >
                      Admin Panel
                    </DropdownItem>
                  )}
                  <DropdownItem 
                    key="logout" 
                    color="danger" 
                    onPress={handleLogout}
                    className="text-autohub-primary-500"
                  >
                    Log Out
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </NavbarItem>
          </>
        ) : (
          <>
            <NavbarItem>
              <Button 
                as={NextLink} 
                href="/auth/login" 
                variant="light"
                className="text-autohub-neutral-100 hover:text-autohub-primary-500 font-medium"
              >
                Sign In
              </Button>
            </NavbarItem>
            <NavbarItem>
              <Button
                as={NextLink}
                className="bg-autohub-primary-500 hover:bg-autohub-primary-600 text-white font-semibold shadow-autohub transition-all duration-200 hover:shadow-lg hover:scale-105"
                href="/auth/register"
                variant="solid"
              >
                Join AutoHub
              </Button>
            </NavbarItem>
          </>
        )}
        
        <NavbarItem>
          <ThemeSwitch />
        </NavbarItem>
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        {isAuthenticated ? (
          <>
            <NotificationDropdown />
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Avatar
                  as="button"
                  className="transition-transform border-autohub-accent2-500"
                  color="primary"
                  name={user?.firstName}
                  size="sm"
                  src={user?.profileImage}
                />
              </DropdownTrigger>
              <DropdownMenu aria-label="Profile Actions" variant="flat">
                <DropdownItem key="dashboard" as={NextLink} href="/dashboard">
                  Dashboard
                </DropdownItem>
                <DropdownItem key="cars" as={NextLink} href="/cars">
                  Browse Cars
                </DropdownItem>
                <DropdownItem key="sell" as={NextLink} href="/dashboard/create-listing">
                  Sell Car
                </DropdownItem>
                <DropdownItem key="subscription" as={NextLink} href="/subscription">
                  Premium
                </DropdownItem>
                {(isAdmin || isModerator) && (
                  <DropdownItem key="admin" as={NextLink} href="/admin">
                    Admin Panel
                  </DropdownItem>
                )}
                <DropdownItem key="logout" color="danger" onPress={handleLogout}>
                  Log Out
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </>
        ) : (
          <>
            <Button as={NextLink} href="/auth/login" variant="light" size="sm">
              Sign In
            </Button>
          </>
        )}
        <ThemeSwitch />
        <NavbarMenuToggle className="text-autohub-neutral-100" />
      </NavbarContent>

      <NavbarMenu className="bg-autohub-secondary-900 border-t border-autohub-accent1-800">
        <div className="mx-4 mt-6 flex flex-col gap-4">
          <NavbarMenuItem>
            <NextLink
              className="text-autohub-neutral-100 hover:text-autohub-primary-500 font-medium text-lg transition-colors"
              href="/cars"
            >
              Browse Cars
            </NextLink>
          </NavbarMenuItem>
          {!isAuthenticated ? (
            <>
              <NavbarMenuItem>
                <NextLink 
                  className="text-autohub-neutral-100 hover:text-autohub-primary-500 font-medium text-lg transition-colors" 
                  href="/auth/login"
                >
                  Sign In
                </NextLink>
              </NavbarMenuItem>
              <NavbarMenuItem>
                <NextLink 
                  className="text-autohub-primary-500 hover:text-autohub-primary-400 font-semibold text-lg transition-colors" 
                  href="/auth/register"
                >
                  Join AutoHub
                </NextLink>
              </NavbarMenuItem>
            </>
          ) : (
            <>
              <NavbarMenuItem>
                <NextLink 
                  className="text-autohub-neutral-100 hover:text-autohub-primary-500 font-medium text-lg transition-colors" 
                  href="/dashboard"
                >
                  Dashboard
                </NextLink>
              </NavbarMenuItem>
              <NavbarMenuItem>
                <NextLink 
                  className="text-autohub-accent2-500 hover:text-autohub-accent2-400 font-medium text-lg transition-colors" 
                  href="/dashboard/create-listing"
                >
                  Sell Car
                </NextLink>
              </NavbarMenuItem>
              <NavbarMenuItem>
                <NextLink 
                  className="text-autohub-neutral-100 hover:text-autohub-primary-500 font-medium text-lg transition-colors" 
                  href="/subscription"
                >
                  Premium
                </NextLink>
              </NavbarMenuItem>
              {(isAdmin || isModerator) && (
                <NavbarMenuItem>
                  <NextLink 
                    className="text-autohub-accent2-500 hover:text-autohub-accent2-400 font-medium text-lg transition-colors" 
                    href="/admin"
                  >
                    Admin Panel
                  </NextLink>
                </NavbarMenuItem>
              )}
              <NavbarMenuItem>
                <Button 
                  className="bg-autohub-primary-500 hover:bg-autohub-primary-600 text-white font-semibold w-full mt-4" 
                  onPress={handleLogout}
                >
                  Log Out
                </Button>
              </NavbarMenuItem>
            </>
          )}
        </div>
      </NavbarMenu>
    </HeroUINavbar>
  );
};