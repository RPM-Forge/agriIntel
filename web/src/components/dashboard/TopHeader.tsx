"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import { useDashboard } from "./DashboardShell";
import { Icon } from "./Icon";
import { initials, roleLabel } from "@/lib/dashboard";

export default function TopHeader() {
  const { user, setSidebarOpen } = useDashboard();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/dashboard/market-prices?search=${encodeURIComponent(query.trim())}`);
    }
  };

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

  return (
    <header className="dash-header">
      <button type="button" className="dash-header__menu" aria-label="Open menu" onClick={() => setSidebarOpen(true)}>
        <Icon name="menu" size={22} />
      </button>

      <form className="dash-search" onSubmit={handleSearch} role="search">
        <span className="dash-search__icon">
          <Icon name="search" size={18} />
        </span>
        <input
          type="search"
          className="dash-search__input"
          placeholder="Search for crops, markets, FPOs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search for crops, markets, FPOs"
        />
      </form>

      <div className="dash-header__actions">
        <button type="button" className="dash-bell" aria-label="Notifications">
          <Icon name="bell" size={21} />
          <span className="dash-bell__dot" />
        </button>

        <div className="dash-user">
          <button
            type="button"
            className="dash-user__btn"
            aria-haspopup="true"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="dash-user__avatar">{initials(user.name)}</span>
            <span className="dash-user__meta">
              <span className="dash-user__name">{user.name}</span>
              <span className="dash-user__loc">{roleLabel(user.role)}</span>
            </span>
            <span className="dash-user__chev">
              <Icon name="chevronDown" size={16} />
            </span>
          </button>

          {menuOpen && (
            <>
              <div className="dash-user__pick" onClick={() => setMenuOpen(false)} aria-hidden="true" />
              <div className="dash-user__menu">
                <div className="dash-user__menu-head">
                  <span className="dash-user__avatar">{initials(user.name)}</span>
                  <span>
                    <strong>{user.name}</strong>
                    <small>{user.email || user.phone}</small>
                  </span>
                </div>
                <Link
                  href="/dashboard/profile"
                  className="dash-user__menu-item"
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon name="user" size={16} />
                  My Profile
                </Link>
                <button type="button" className="dash-user__menu-item" onClick={handleLogout} disabled={loggingOut}>
                  <Icon name="logout" size={16} />
                  {loggingOut ? "Logging out…" : "Logout"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}