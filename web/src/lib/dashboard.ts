export type Role = "buyer" | "seller";

export interface DashboardUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: Role;
  verified?: boolean;
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export const NAV_SELLER: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "grid" },
  { label: "Market Prices", href: "/dashboard/market-prices", icon: "chartBar" },
  { label: "AI Advice", href: "/dashboard/ai-advice", icon: "sparkle" },
  { label: "My Produce", href: "/dashboard/my-produce", icon: "sprout" },
  { label: "FPO Marketplace", href: "/dashboard/fpo", icon: "users" },
  { label: "Payments", href: "/dashboard/payments", icon: "banknote" },
  { label: "Transportation", href: "/dashboard/transportation", icon: "truck" },
  { label: "My Sales", href: "/dashboard/orders", icon: "box" },
  { label: "Profile", href: "/dashboard/profile", icon: "user" },
];

export const NAV_BUYER: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "grid" },
  { label: "Market Prices", href: "/dashboard/market-prices", icon: "chartBar" },
  { label: "FPO Marketplace", href: "/dashboard/fpo", icon: "users" },
  { label: "Orders", href: "/dashboard/orders", icon: "box" },
  { label: "Payments", href: "/dashboard/payments", icon: "banknote" },
  { label: "Transportation", href: "/dashboard/transportation", icon: "truck" },
  { label: "Profile", href: "/dashboard/profile", icon: "user" },
];

export function navForRole(role: Role): NavItem[] {
  return role === "seller" ? NAV_SELLER : NAV_BUYER;
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

export function roleLabel(role: Role): string {
  return role === "seller" ? "Farmer / Seller" : "Buyer";
}