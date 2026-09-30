"use client";

import { useEffect, useState } from "react";
import { useDashboard } from "@/components/dashboard/DashboardShell";
import HeroBanner from "@/components/dashboard/HeroBanner";
import StatCard from "@/components/dashboard/StatCard";
import MarketPriceTable from "@/components/dashboard/MarketPriceTable";
import AIRecommendationCard from "@/components/dashboard/AIRecommendationCard";
import RecentActivity from "@/components/dashboard/RecentActivity";
import { apiRequest } from "@/lib/clientApi";
import { formatRupees } from "@/lib/marketplace";
import type { DashboardSummary } from "@/lib/marketplace";

export default function DashboardIndex() {
  const { role } = useDashboard();
  const isSeller = role === "seller";
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryError, setSummaryError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void apiRequest<{ data: DashboardSummary }>("/api/dashboard/summary")
        .then((response) => setSummary(response.data))
        .catch((cause: unknown) => setSummaryError(cause instanceof Error ? cause.message : "Could not load dashboard summary."));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="dash-index">
      <HeroBanner />

      <section className="dash-stats" aria-label="Summary">
        {isSeller ? (
          <>
            <StatCard
              icon="sprout"
              title="Total Produce"
              value={summary ? `${summary.produceQuintals.toLocaleString("en-IN", { maximumFractionDigits: 2 })} Qt` : "—"}
              subtitle={summary ? `${summary.produceListings} crop listings` : summaryError || "Loading summary"}
              href="/dashboard/my-produce"
              tone="green"
            />
            <StatCard
              icon="rupee"
              title="Settled sales"
              value={summary ? formatRupees(summary.earnings) : "—"}
              subtitle="Manual records only"
              href="/dashboard/payments"
              tone="orange"
            />
            <StatCard
              icon="truck"
              title="Active Sales"
              value={summary ? String(summary.activeSales) : "—"}
              subtitle="Pending or accepted"
              href="/dashboard/orders"
              tone="blue"
            />
            <StatCard
              icon="users"
              title="FPO Marketplace"
              value="Sell in bulk"
              subtitle="Create lots and find FPO buyers"
              href="/dashboard/fpo"
              tone="violet"
            />
          </>
        ) : (
          <>
            <StatCard
              icon="rupee"
              title="Settled purchases"
              value={summary ? formatRupees(summary.totalPaid) : "—"}
              subtitle="Manual records only"
              href="/dashboard/payments"
              tone="green"
            />
            <StatCard
              icon="box"
              title="Active Orders"
              value={summary ? String(summary.activeOrders) : "—"}
              subtitle="Pending or accepted"
              href="/dashboard/orders"
              tone="orange"
            />
            <StatCard
              icon="truck"
              title="Deliveries Pending"
              value={summary ? String(summary.deliveriesPending) : "—"}
              subtitle="Shipments in progress"
              href="/dashboard/transportation"
              tone="violet"
            />
          </>
        )}
      </section>

      <div className={`dash-grid ${isSeller ? "dash-grid--3" : "dash-grid--2"}`}>
        <MarketPriceTable />
        {isSeller && <AIRecommendationCard mode="sell" />}
        <RecentActivity items={summary?.activity ?? []} error={summaryError} />
      </div>
    </div>
  );
}