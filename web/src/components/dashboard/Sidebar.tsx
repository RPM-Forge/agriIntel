"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDashboard } from "./DashboardShell";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";

export default function Sidebar() {
  const { nav, pathname, sidebarOpen, setSidebarOpen } = useDashboard();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const close = () => setSidebarOpen(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Logout should still navigate even if the request fails.
    }
    router.push("/auth?mode=login");
  };

  const isActive = (href: string) => (href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href));

  return (
    <>
      <div className={`dash-sidebar${sidebarOpen ? " is-open" : ""}`}>
        <div className="dash-brand">
          <span className="dash-brand__mark">
            <Icon name="leaf" size={20} />
          </span>
          <span className="dash-brand__text">
            <strong>Agri Intel</strong>
            <small>Farm to Better Markets</small>
          </span>
          <button type="button" className="dash-sidebar__close" aria-label="Close menu" onClick={close}>
            <Icon name="close" size={18} />
          </button>
        </div>

        <nav className="dash-nav" aria-label="Dashboard">
          {nav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`dash-nav__item${active ? " is-active" : ""}`}
                onClick={close}
              >
                <span className="dash-nav__icon">
                  <Icon name={item.icon as IconName} size={19} />
                </span>
                <span className="dash-nav__label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="dash-sidebar__foot">
          <button type="button" className="dash-logout" onClick={handleLogout} disabled={loggingOut}>
            <span className="dash-nav__icon">
              <Icon name="logout" size={19} />
            </span>
            <span className="dash-nav__label">{loggingOut ? "Logging out…" : "Logout"}</span>
          </button>
        </div>
      </div>

      {sidebarOpen && <div className="dash-scrim" onClick={close} aria-hidden="true" />}
    </>
  );
}