"use client";

import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import DataTable from "@/components/dashboard/DataTable";
import { useDashboard } from "@/components/dashboard/DashboardShell";

export default function PaymentsPage() {
  const { role } = useDashboard();
  const isSeller = role === "seller";

  return (
    <div>
      <PageHeader
        title="Payments"
        sub={isSeller ? "Track money received and pending for your crop sales." : "Track payments made and owed for your purchases."}
      />

      <section className="dash-stats" aria-label="Payment summary">
        {isSeller ? (
          <>
            <StatCard icon="rupee" title="Total Received" value="₹0" subtitle="This Season" href="/dashboard/payments" tone="green" />
            <StatCard icon="clock" title="Pending Payments" value="₹0" subtitle="Awaiting settlement" href="/dashboard/payments" tone="orange" />
            <StatCard icon="checkCircle" title="Settlements" value="0" subtitle="Completed" href="/dashboard/payments" tone="blue" />
            <StatCard icon="shield" title="Payment Mode" value="Bank" subtitle="Direct to account" href="/dashboard/payments" tone="violet" />
          </>
        ) : (
          <>
            <StatCard icon="wallet" title="Total Paid" value="₹0" subtitle="This Season" href="/dashboard/payments" tone="green" />
            <StatCard icon="clock" title="Amount Owed" value="₹0" subtitle="Pending payments" href="/dashboard/payments" tone="orange" />
            <StatCard icon="checkCircle" title="Invoices" value="0" subtitle="Completed" href="/dashboard/payments" tone="blue" />
            <StatCard icon="shield" title="Payment Mode" value="Bank" subtitle="Direct transfers" href="/dashboard/payments" tone="violet" />
          </>
        )}
      </section>

      <section className="card">
        <header className="card__head">
          <h3 className="card__title">Recent Transactions</h3>
        </header>
        {isSeller ? (
          <DataTable
            columns={[
              { key: "buyer", label: "Buyer" },
              { key: "amount", label: "Amount", align: "right" },
              { key: "date", label: "Date" },
              { key: "status", label: "Status" },
            ]}
            rows={[]}
            emptyIcon="receipt"
            emptyTitle="No transactions yet"
            emptySub="Payments for your crop sales will appear here once you start selling."
          />
        ) : (
          <DataTable
            columns={[
              { key: "supplier", label: "Supplier" },
              { key: "amount", label: "Amount", align: "right" },
              { key: "date", label: "Date" },
              { key: "status", label: "Status" },
            ]}
            rows={[]}
            emptyIcon="receipt"
            emptyTitle="No transactions yet"
            emptySub="Payments you make to suppliers will appear here once you buy produce."
          />
        )}
      </section>
    </div>
  );
}