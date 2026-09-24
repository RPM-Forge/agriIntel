"use client";

import { useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/dashboard/PageHeader";
import EmptyState from "@/components/dashboard/EmptyState";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Icon } from "@/components/dashboard/Icon";
import { useDashboard } from "@/components/dashboard/DashboardShell";

type TabId = "overview" | "members" | "lots" | "announcements";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "members", label: "Members" },
  { id: "lots", label: "Available Lots" },
  { id: "announcements", label: "Announcements" },
];

export default function FpoPage() {
  const { role } = useDashboard();
  const [tab, setTab] = useState<TabId>("overview");

  if (role === "buyer") {
    return (
      <div>
        <PageHeader title="FPO" sub="Meet and transact with FPOs near you." />
        <section className="card">
          <EmptyState
            icon="users"
            title="This page is for sellers"
            sub="FPOs are farmer producer organisations run by the farmers themselves. Buyers can connect with suppliers via Orders and Payments."
            action={
              <Link href="/dashboard/orders" className="btn btn--green btn--sm">
                View Orders
                <Icon name="arrowRight" size={15} />
              </Link>
            }
          />
        </section>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="FPO" sub="Farmer Producer Organisations near you" />

      <div className="dash-tabs" role="tablist" aria-label="FPO sections">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={`dash-tab${tab === item.id ? " is-active" : ""}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="dash-stack">
        {tab === "overview" && (
          <section className="card">
            <EmptyState
              icon="users"
              title="You are not a member of any FPO yet"
              sub="Joining an FPO lets you pool produce with neighbouring farmers and sell in bulk at better rates."
            />
            <div className="dash-note">
              <Icon name="info" size={16} />
              An FPO (Farmer Producer Organisation) pools your harvest with other farmers for collective marketing, quality checks and better price discovery.
            </div>
          </section>
        )}

        {tab === "members" && (
          <section className="card">
            <EmptyState
              icon="users"
              title="No members to show yet"
              sub="Members of your FPO will be listed here."
            />
          </section>
        )}

        {tab === "lots" && (
          <section className="card">
            <EmptyState
              icon="sprout"
              title="No available lots"
              sub="Lots pooled by your FPO will be listed here once you join."
            />
          </section>
        )}

        {tab === "announcements" && (
          <section className="card">
            <EmptyState
              icon="bell"
              title="No announcements yet"
              sub="Meeting notices, season updates and FPO news will appear here."
            />
          </section>
        )}
      </div>

      <section className="card">
        <header className="card__head">
          <h3 className="card__title">How FPO benefits work</h3>
        </header>
        <div className="fpo-benefits">
          <span>
            <StatusBadge tone="green">Collective selling</StatusBadge>
            <p>Pool produce to reach larger, better-paying buyers.</p>
          </span>
          <span>
            <StatusBadge tone="blue">Shared logistics</StatusBadge>
            <p>Combine loads to lower transport cost per quintal.</p>
          </span>
          <span>
            <StatusBadge tone="orange">Community strength</StatusBadge>
            <p>Better bargaining power through verified farmer groups.</p>
          </span>
        </div>
      </section>
    </div>
  );
}