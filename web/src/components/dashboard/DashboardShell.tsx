"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { DashboardUser, NavItem } from "@/lib/dashboard";
import { navForRole } from "@/lib/dashboard";
import Sidebar from "./Sidebar";
import TopHeader from "./TopHeader";

interface DashboardContextValue {
  user: DashboardUser;
  role: "buyer" | "seller";
  nav: NavItem[];
  pathname: string;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboard(): DashboardContextValue {
  const value = useContext(DashboardContext);
  if (!value) {
    throw new Error("useDashboard must be used within DashboardShell.");
  }
  return value;
}

export default function DashboardShell({
  user,
  children,
}: {
  user: DashboardUser;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const nav = useMemo(() => navForRole(user.role), [user.role]);

  const value = useMemo<DashboardContextValue>(
    () => ({ user, role: user.role, nav, pathname, sidebarOpen, setSidebarOpen }),
    [user, nav, pathname, sidebarOpen],
  );

  return (
    <DashboardContext.Provider value={value}>
      <div className="dash">
        <Sidebar />
        <div className="dash-main">
          <TopHeader />
          <main className="dash-content">{children}</main>
        </div>
      </div>
    </DashboardContext.Provider>
  );
}