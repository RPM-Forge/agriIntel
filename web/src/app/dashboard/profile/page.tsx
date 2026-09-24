"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Icon } from "@/components/dashboard/Icon";
import { useDashboard } from "@/components/dashboard/DashboardShell";
import { roleLabel } from "@/lib/dashboard";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="dash-kv__row">
      <span className="dash-kv__label">{label}</span>
      <span className="dash-kv__value">{value || "—"}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useDashboard();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

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
    <div>
      <PageHeader title="Profile" sub="Your account details on Agri Intel." />

      <section className="card">
        <header className="card__head">
          <h3 className="card__title">
            <span className="card__title-icon">
              <Icon name="user" size={17} />
            </span>
            Account Details
          </h3>
          <StatusBadge tone={user.verified ? "green" : "orange"}>
            {user.verified ? "Verified" : "Verification pending"}
          </StatusBadge>
        </header>

        <div className="profile-top">
          <span className="dash-user__avatar dash-user__avatar--lg">
            {user.name
              .trim()
              .split(/\s+/)
              .map((p) => p[0] ?? "")
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </span>
          <div>
            <h2>{user.name}</h2>
            <p>{roleLabel(user.role)}</p>
          </div>
        </div>

        <div className="dash-kv">
          <Row label="Full name" value={user.name} />
          <Row label="Phone" value={user.phone ?? ""} />
          <Row label="Email" value={user.email ?? ""} />
          <Row label="Account type" value={roleLabel(user.role)} />
          <Row label="Status" value={user.verified ? "Verified" : "Pending verification"} />
        </div>
      </section>

      <section className="card">
        <header className="card__head">
          <h3 className="card__title">
            <span className="card__title-icon">
              <Icon name="shield" size={17} />
            </span>
            Account Security
          </h3>
        </header>
        <div className="dash-note">
          <Icon name="lock" size={16} />
          Your account is protected by a password. Login and sign-up are handled securely on the server.
        </div>
        <button type="button" className="btn btn--outline-grey profile__logout" onClick={handleLogout} disabled={loggingOut}>
          <Icon name="logout" size={16} />
          {loggingOut ? "Logging out…" : "Logout of account"}
        </button>
      </section>
    </div>
  );
}