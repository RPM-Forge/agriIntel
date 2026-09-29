"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/dashboard/PageHeader";
import ShipmentTracker from "@/components/dashboard/ShipmentTracker";
import EmptyState from "@/components/dashboard/EmptyState";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Icon } from "@/components/dashboard/Icon";
import { useDashboard } from "@/components/dashboard/DashboardShell";
import { apiRequest } from "@/lib/clientApi";
import { formatDate } from "@/lib/marketplace";
import type { OrderRecord, ShipmentRecord, ShipmentStatus } from "@/lib/marketplace";

const TRACKABLE: ShipmentStatus[] = ["picked_up", "in_transit", "out_for_delivery", "delivered"];
const NEXT_STATUS: Partial<Record<ShipmentStatus, ShipmentStatus>> = {
  planned: "picked_up",
  picked_up: "in_transit",
  in_transit: "out_for_delivery",
  out_for_delivery: "delivered",
};
const NEXT_LABEL: Record<ShipmentStatus, string> = {
  planned: "Mark picked up",
  picked_up: "Mark in transit",
  in_transit: "Mark out for delivery",
  out_for_delivery: "Mark delivered",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function TransportationPage() {
  const { role } = useDashboard();
  const isSeller = role === "seller";
  const [shipments, setShipments] = useState<ShipmentRecord[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [shipmentResult, orderResult] = await Promise.all([
        apiRequest<{ data: ShipmentRecord[] }>("/api/shipments"),
        apiRequest<{ data: OrderRecord[] }>("/api/orders"),
      ]);
      setShipments(shipmentResult.data);
      setOrders(orderResult.data);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load transportation records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function createShipment(event: React.FormEvent<HTMLFormElement>, order: OrderRecord) {
    event.preventDefault();
    setBusyId(order.id);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await apiRequest("/api/shipments", {
        method: "POST",
        body: JSON.stringify({
          orderId: order.id,
          transporter: form.get("transporter"),
          trackingReference: form.get("trackingReference"),
          estimatedArrival: form.get("estimatedArrival"),
        }),
      });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create the shipment record.");
    } finally {
      setBusyId("");
    }
  }

  async function updateShipment(shipment: ShipmentRecord) {
    const status = NEXT_STATUS[shipment.status];
    if (!status) return;
    setBusyId(shipment.id);
    setError("");
    try {
      await apiRequest(`/api/shipments/${shipment.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update shipment progress.");
    } finally {
      setBusyId("");
    }
  }

  const assignedOrderIds = new Set(shipments.map((shipment) => shipment.orderId));
  const readyOrders = isSeller
    ? orders.filter((order) => order.status === "accepted" && !assignedOrderIds.has(order.id))
    : [];

  return (
    <div>
      <PageHeader title="Transportation" sub={isSeller ? "Assign transport and update delivery progress." : "Track accepted orders from pickup through delivery."} />

      {isSeller && readyOrders.length > 0 && (
        <section className="card">
          <header className="card__head"><h3 className="card__title"><span className="card__title-icon"><Icon name="truck" size={17} /></span>Arrange transport</h3><span className="card__meta">Accepted orders ready for dispatch</span></header>
          <div className="workflow-list">
            {readyOrders.map((order) => (
              <form className="workflow-item workflow-transport-form" key={order.id} onSubmit={(event) => void createShipment(event, order)}>
                <div className="workflow-item__main">
                  <div className="workflow-item__title"><h4>{order.crop} · {order.quantity} {order.unit}</h4><StatusBadge tone="green">Accepted</StatusBadge></div>
                  <p>Order #{order.id.slice(-8)} · Deliver to {order.deliveryLocation}</p>
                </div>
                <label className="field"><span className="field__label">Transporter</span><input className="field__input" name="transporter" required maxLength={100} placeholder="Transport company / driver" /></label>
                <label className="field"><span className="field__label">Tracking reference</span><input className="field__input" name="trackingReference" required maxLength={100} placeholder="Vehicle or consignment ID" /></label>
                <label className="field"><span className="field__label">Estimated arrival</span><input className="field__input" name="estimatedArrival" type="date" /></label>
                <button className="btn btn--green btn--sm" type="submit" disabled={busyId === order.id}>{busyId === order.id ? "Saving…" : "Assign shipment"}</button>
              </form>
            ))}
          </div>
        </section>
      )}

      <section className="card">
        <header className="card__head"><h3 className="card__title">Shipment tracking</h3><span className="card__meta">Pickup → In transit → Out for delivery → Delivered</span></header>
        {error && <p className="workflow-error" role="alert">{error}</p>}
        {loading ? <p className="workflow-muted">Loading shipments…</p> : shipments.length === 0 ? (
          <EmptyState icon="truck" title="No active shipments yet" sub={isSeller ? "Accept an order and assign transport to start tracking it." : "A shipment will appear after a seller arranges transport for your accepted order."} />
        ) : (
          <div className="workflow-list">
            {shipments.map((shipment) => {
              const step = TRACKABLE.indexOf(shipment.status);
              const currentStep = shipment.status === "planned" || shipment.status === "cancelled" ? -1 : step;
              const order = orders.find((item) => item.id === shipment.orderId);
              return (
                <article className="workflow-shipment" key={shipment.id}>
                  <div className="workflow-item__title"><h4>{shipment.crop} · {shipment.quantity} {shipment.unit}</h4><StatusBadge tone={shipment.status === "delivered" ? "green" : shipment.status === "cancelled" ? "gray" : "orange"}>{shipment.status.replaceAll("_", " ")}</StatusBadge></div>
                  <p className="workflow-shipment__meta">Order #{shipment.orderId.slice(-8)} · {isSeller ? `Buyer: ${order?.buyerName ?? "Buyer"}` : `Seller: ${order?.sellerName ?? "Seller"}`} · {shipment.deliveryLocation}</p>
                  <p className="workflow-shipment__meta">Transporter: {shipment.transporter} · Reference: {shipment.trackingReference} · ETA: {formatDate(shipment.estimatedArrival)}</p>
                  <ShipmentTracker currentStep={currentStep} />
                  <div className="workflow-shipment__foot">
                    <span>Updated {formatDate(shipment.history.at(-1)?.at)}</span>
                    {isSeller && NEXT_STATUS[shipment.status] && <button className="btn btn--green btn--sm" type="button" disabled={busyId === shipment.id} onClick={() => void updateShipment(shipment)}>{NEXT_LABEL[shipment.status]}</button>}
                    {shipment.status === "delivered" && isSeller && order?.status === "accepted" && <Link className="btn btn--cream btn--sm" href="/dashboard/orders">Complete order</Link>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
