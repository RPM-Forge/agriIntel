"use client";

import PageHeader from "@/components/dashboard/PageHeader";
import ShipmentTracker from "@/components/dashboard/ShipmentTracker";
import DataTable from "@/components/dashboard/DataTable";
import { Icon } from "@/components/dashboard/Icon";
import { useDashboard } from "@/components/dashboard/DashboardShell";

export default function TransportationPage() {
  const { role } = useDashboard();
  const isSeller = role === "seller";

  return (
    <div>
      <PageHeader
        title="Transportation"
        sub={isSeller ? "Track your harvest from farm gate to buyer." : "Track your orders from supplier to delivery."}
      />

      <section className="card">
        <header className="card__head">
          <h3 className="card__title">
            <span className="card__title-icon">
              <Icon name="truck" size={17} />
            </span>
            Shipment Tracking
          </h3>
          <span className="card__meta">Pickup &rarr; In Transit &rarr; Out for Delivery &rarr; Delivered</span>
        </header>
        <ShipmentTracker currentStep={-1} />
        <div className="dash-note">
          <Icon name="info" size={16} />
          No active shipments yet. When transport is assigned, its progress will show here.
        </div>
      </section>

      <section className="card">
        <header className="card__head">
          <h3 className="card__title">Your Shipments</h3>
        </header>
        {isSeller ? (
          <DataTable
            columns={[
              { key: "order", label: "Order ID" },
              { key: "crop", label: "Crop" },
              { key: "qty", label: "Quantity", align: "right" },
              { key: "status", label: "Status" },
            ]}
            rows={[]}
            emptyIcon="truck"
            emptyTitle="No shipments yet"
            emptySub="Once a buyer places an order, the assigned transporter and delivery progress will appear here."
          />
        ) : (
          <DataTable
            columns={[
              { key: "order", label: "Order ID" },
              { key: "crop", label: "Crop" },
              { key: "qty", label: "Quantity", align: "right" },
              { key: "status", label: "Status" },
            ]}
            rows={[]}
            emptyIcon="truck"
            emptyTitle="No shipments yet"
            emptySub="Once you place an order, the transporter and delivery progress will appear here."
          />
        )}
      </section>
    </div>
  );
}