"use client";

import { useDashboard } from "@/components/dashboard/DashboardShell";
import HeroBanner from "@/components/dashboard/HeroBanner";
import StatCard from "@/components/dashboard/StatCard";
import MarketPriceTable from "@/components/dashboard/MarketPriceTable";
import AIRecommendationCard from "@/components/dashboard/AIRecommendationCard";
import RecentActivity from "@/components/dashboard/RecentActivity";

export default function DashboardIndex() {
  const { role } = useDashboard();
  const isSeller = role === "seller";

  return (
    <div className="dash-index">
      <HeroBanner />

      <section className="dash-stats" aria-label="Summary">
        {isSeller ? (
          <>
            <StatCard
              icon="sprout"
              title="Total Produce"
              value="0 Qt"
              subtitle="No crop lots listed yet"
              href="/dashboard/my-produce"
              tone="green"
            />
            <StatCard
              icon="rupee"
              title="Total Earnings"
              value="₹0"
              subtitle="This Season"
              href="/dashboard/payments"
              tone="orange"
            />
            <StatCard
              icon="truck"
              title="Active Sales"
              value="0"
              subtitle="In Progress"
              href="/dashboard/orders"
              tone="blue"
            />
          </>
        ) : (
          <>
            <StatCard
              icon="rupee"
              title="Total Purchased"
              value="₹0"
              subtitle="This Season"
              href="/dashboard/payments"
              tone="green"
            />
            <StatCard
              icon="box"
              title="Active Orders"
              value="0"
              subtitle="In Progress"
              href="/dashboard/orders"
              tone="orange"
            />
            <StatCard
              icon="truck"
              title="Deliveries Pending"
              value="0"
              subtitle="On the way"
              href="/dashboard/transportation"
              tone="violet"
            />
          </>
        )}
      </section>

      <div className={`dash-grid ${isSeller ? "dash-grid--3" : "dash-grid--2"}`}>
        <MarketPriceTable />
        {isSeller && <AIRecommendationCard mode="sell" />}
        <RecentActivity />
      </div>
    </div>
  );
}