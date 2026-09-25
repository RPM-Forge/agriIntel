"use client";

import { useDashboard } from "./DashboardShell";
import { firstName } from "@/lib/dashboard";
import { Icon } from "./Icon";

export default function HeroBanner() {
  const { user, role } = useDashboard();
  const isSeller = role === "seller";

  return (
    <section className="dash-hero">
      <div className="dash-hero__photo" />
      <div className="dash-hero__shade" aria-hidden="true" />
      <div className="dash-hero__copy">
        <p className="dash-hero__eyebrow">
          <Icon name="sparkle" size={15} />
          {isSeller ? "Farmer Dashboard" : "Buyer Dashboard"}
        </p>
        <h2 className="dash-hero__title">
          Welcome back, {firstName(user.name)}!
        </h2>
        <p className="dash-hero__sub">
          {isSeller
            ? "Smarter markets. Better prices. A stronger tomorrow."
            : "Smarter sourcing. Fair deals. A stronger supply chain."}
        </p>
      </div>
      <div className="dash-hero__tag">
        <strong>{isSeller ? "Empowering Farmers" : "Empowering Buyers"}</strong>
        <span>Empowering Bharat</span>
      </div>
    </section>
  );
}