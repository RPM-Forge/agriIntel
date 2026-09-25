"use client";

import PageHeader from "@/components/dashboard/PageHeader";
import DataTable from "@/components/dashboard/DataTable";
import { useDashboard } from "@/components/dashboard/DashboardShell";

export default function OrdersPage() {
  const { role } = useDashboard();
  const isSeller = role === "seller";

  return (
    <div>
      <PageHeader
        title={isSeller ? "My Sales" : "Orders"}
        sub={isSeller ? "Offers and orders for your produce." : "Your purchase orders from suppliers."}
      />

      <section className="card">
        <header className="card__head">
          <h3 className="card__title">{isSeller ? "My Sales" : "Purchase Orders"}</h3>
        </header>
        {isSeller ? (
          <DataTable
            columns={[
              { key: "buyer", label: "Buyer" },
              { key: "crop", label: "Crop" },
              { key: "qty", label: "Quantity", align: "right" },
              { key: "value", label: "Lot Value", align: "right" },
              { key: "status", label: "Status" },
            ]}
            rows={[]}
            emptyIcon="box"
            emptyTitle="No sales yet"
            emptySub="When buyers place orders for your listed produce, they will appear here with their status."
          />
        ) : (
          <DataTable
            columns={[
              { key: "supplier", label: "Supplier" },
              { key: "crop", label: "Crop" },
              { key: "qty", label: "Quantity", align: "right" },
              { key: "amount", label: "Amount", align: "right" },
              { key: "status", label: "Status" },
            ]}
            rows={[]}
            emptyIcon="box"
            emptyTitle="No orders yet"
            emptySub="Orders you place with suppliers will appear here with their status."
          />
        )}
      </section>
    </div>
  );
}