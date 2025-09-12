export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "AutoHub",
  description: "The ultimate destination for buying and selling premium vehicles. Discover your perfect car with AutoHub's curated selection of quality automobiles.",
  navItems: [
    {
      label: "Browse Cars",
      href: "/cars",
    },
    {
      label: "Sell Your Car",
      href: "/dashboard/create-listing",
    },
    {
      label: "How It Works",
      href: "/how-it-works",
    },
    {
      label: "About",
      href: "/about",
    },
  ],
  navMenuItems: [
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Browse Cars",
      href: "/cars",
    },
    {
      label: "Sell Car",
      href: "/dashboard/create-listing",
    },
    {
      label: "My Listings",
      href: "/dashboard",
    },
    {
      label: "Subscription",
      href: "/subscription",
    },
    {
      label: "Profile Settings",
      href: "/dashboard/profile",
    },
    {
      label: "Support",
      href: "/support",
    },
    {
      label: "Logout",
      href: "/logout",
    },
  ],
  links: {
    github: "https://github.com/autohub",
    twitter: "https://twitter.com/autohub_official",
    docs: "https://docs.autohub.com",
    discord: "https://discord.gg/autohub",
    sponsor: "https://github.com/sponsors/autohub",
    support: "https://support.autohub.com",
  },
};
