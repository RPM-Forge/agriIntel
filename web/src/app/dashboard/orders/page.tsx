"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable from "@/components/dashboard/DataTable";
import EmptyState from "@/components/dashboard/EmptyState";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { apiRequest } from "@/lib/clientApi";
import type { BuyerRequirementRecord, OrderRecord, OrderStatus, ProduceLotRecord, ShipmentRecord } from "@/lib/marketplace";
import { formatDate, formatRupees } from "@/lib/marketplace";
import { useDashboard } from "@/components/dashboard/DashboardShell";

export default function OrdersPage() {
  const { role } = useDashboard();
  const isSeller = role === "seller";
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [lots, setLots] = useState<ProduceLotRecord[]>([]);
  const [requirements, setRequirements] = useState<BuyerRequirementRecord[]>([]);
  const [deliveredOrderIds, setDeliveredOrderIds] = useState<Set<string>>(new Set());
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [orderResult, lotResult, shipmentResult, requirementResult] = await Promise.all([
        apiRequest<{ data: OrderRecord[] }>("/api/orders"),
        isSeller ? Promise.resolve({ data: [] as ProduceLotRecord[] }) : apiRequest<{ data: ProduceLotRecord[] }>("/api/produce"),
        isSeller ? apiRequest<{ data: ShipmentRecord[] }>("/api/shipments") : Promise.resolve({ data: [] as ShipmentRecord[] }),
        apiRequest<{ data: BuyerRequirementRecord[] }>("/api/requirements"),
      ]);
      setOrders(orderResult.data);
      setLots(lotResult.data);
      setDeliveredOrderIds(new Set(shipmentResult.data.filter((shipment) => shipment.status === "delivered").map((shipment) => shipment.orderId)));
      setRequirements(requirementResult.data);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load orders.");
    } finally {
      setLoading(false);
    }
  }, [isSeller]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function placeOrder(event: React.FormEvent<HTMLFormElement>, lot: ProduceLotRecord) {
    event.preventDefault();
    setBusyId(lot.id);
    setError("");
    try {
      await apiRequest("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          listingId: lot.id,
          quantity: quantities[lot.id] ?? "",
          deliveryLocation,
        }),
      });
      setQuantities((previous) => ({ ...previous, [lot.id]: "" }));
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not place the order.");
    } finally {
      setBusyId("");
    }
  }

  async function updateOrder(order: OrderRecord, status: OrderStatus) {
    setBusyId(order.id);
    setError("");
    try {
      await apiRequest(`/api/orders/${order.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update the order.");
    } finally {
      setBusyId("");
    }
  }

  async function postRequirement(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyId("requirement");
    setError("");
    const form = new FormData(event.currentTarget);
    const formElement = event.currentTarget;
    const payload = Object.fromEntries(form.entries());
    try {
      await apiRequest("/api/requirements", { method: "POST", body: JSON.stringify(payload) });
      formElement.reset();
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not post crop requirement.");
    } finally {
      setBusyId("");
    }
  }

  async function closeRequirement(id: string) {
    setBusyId(id);
    setError("");
    try {
      await apiRequest(`/api/requirements/${id}`, { method: "PATCH", body: JSON.stringify({ status: "closed" }) });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not close crop requirement.");
    } finally {
      setBusyId("");
    }
  }

  const statusTone = (status: OrderStatus) =>
    status === "accepted" || status === "fulfilled" ? "green" : status === "pending" ? "orange" : status === "rejected" ? "red" : "gray";

  return (
    <div>
      <PageHeader
        title={isSeller ? "My Sales" : "Orders"}
        sub={isSeller ? "Review incoming orders and manage accepted sales." : "Browse available produce and follow your purchase orders."}
      />

      <section className="card">
        <header className="card__head">
          <h3 className="card__title">{isSeller ? "Buyer crop requirements" : "Post a crop requirement"}</h3>
          <span className="card__meta">{isSeller ? "What buyers are looking for" : "Tell farmers what you need"}</span>
        </header>
        {!isSeller && (
          <form className="workflow-form" onSubmit={(event) => void postRequirement(event)}>
            <label className="field"><span className="field__label">Crop</span><input className="field__input" name="crop" required maxLength={80} placeholder="e.g. Wheat" /></label>
            <label className="field"><span className="field__label">Grade / quality</span><input className="field__input" name="grade" required maxLength={40} placeholder="e.g. FAQ or any grade" /></label>
            <label className="field"><span className="field__label">Quantity</span><input className="field__input" name="quantity" type="number" min="0.01" step="any" required /></label>
            <label className="field"><span className="field__label">Unit</span><select className="field__select" name="unit" defaultValue="quintal"><option value="kg">Kilograms</option><option value="quintal">Quintals</option><option value="tonne">Tonnes</option></select></label>
            <label className="field"><span className="field__label">Max price per unit (₹) <small>optional</small></span><input className="field__input" name="maxPricePerUnit" type="number" min="0.01" step="0.01" /></label>
            <label className="field"><span className="field__label">Delivery location</span><input className="field__input" name="location" required maxLength={120} placeholder="District, state" /></label>
            <label className="field"><span className="field__label">Needed by <small>optional</small></span><input className="field__input" name="neededBy" type="date" /></label>
            <label className="field workflow-form__wide"><span className="field__label">Additional details <small>optional</small></span><textarea className="field__input workflow-textarea" name="notes" maxLength={500} placeholder="Packaging, delivery, or other requirements" /></label>
            <div className="workflow-form__actions"><button className="btn btn--green btn--sm" type="submit" disabled={busyId === "requirement"}>{busyId === "requirement" ? "Saving…" : "Post requirement"}</button></div>
          </form>
        )}
        {error && <p className="workflow-error" role="alert">{error}</p>}
        {loading ? <p className="workflow-muted">Loading crop requirements…</p> : requirements.length === 0 ? (
          <EmptyState icon="search" title={isSeller ? "No open buyer requirements" : "No crop requirements yet"} sub={isSeller ? "Buyer requests for crops will appear here." : "Post the crop, quantity, and delivery location you need above."} />
        ) : (
          <div className="workflow-list">
            {requirements.map((requirement) => (
              <article className="workflow-item" key={requirement.id}>
                <div className="workflow-item__main">
                  <div className="workflow-item__title"><h4>{requirement.crop} · {requirement.grade}</h4><StatusBadge tone={requirement.status === "open" ? "green" : "gray"}>{requirement.status}</StatusBadge></div>
                  <p>{requirement.quantity} {requirement.unit} · {requirement.maxPricePerUnit ? `up to ${formatRupees(requirement.maxPricePerUnit)} / ${requirement.unit} · ` : ""}Delivery: {requirement.location}</p>
                  <p>{isSeller ? `Buyer: ${requirement.buyerName} · ` : ""}{requirement.neededBy ? `Needed by ${formatDate(requirement.neededBy)} · ` : ""}Posted {formatDate(requirement.createdAt)}</p>
                  {requirement.notes && <p>{requirement.notes}</p>}
                </div>
                {!isSeller && requirement.status === "open" && <button className="btn btn--cream btn--sm" type="button" disabled={busyId === requirement.id} onClick={() => void closeRequirement(requirement.id)}>Close request</button>}
              </article>
            ))}
          </div>
        )}
      </section>

      {!isSeller && (
        <section className="card">
          <header className="card__head"><h3 className="card__title">Available produce</h3><span className="card__meta">{lots.length} listings</span></header>
          <label className="field workflow-location"><span className="field__label">Delivery location</span><input className="field__input" value={deliveryLocation} onChange={(event) => setDeliveryLocation(event.target.value)} maxLength={160} placeholder="Village, district, state" /></label>
          {loading ? <p className="workflow-muted">Loading available produce…</p> : lots.length === 0 ? (
            <EmptyState icon="sprout" title="No produce available yet" sub="Sellers' active crop listings will appear here." />
          ) : (
            <div className="workflow-list">
              {lots.map((lot) => (
                <article className="workflow-item workflow-item--stack" key={lot.id}>
                  <div className="workflow-item__main">
                    <div className="workflow-item__title"><h4>{lot.crop} · {lot.grade}</h4><StatusBadge tone="green">Available</StatusBadge></div>
                    <p>{formatRupees(lot.pricePerUnit)} / {lot.unit} · {lot.availableQuantity} {lot.unit} available</p>
                    <p>Pickup: {lot.location} · Harvest: {formatDate(lot.harvestDate)}</p>
                  </div>
                  <form className="workflow-order-form" onSubmit={(event) => void placeOrder(event, lot)}>
                    <label className="field"><span className="field__label">Quantity ({lot.unit})</span><input className="field__input" type="number" min="0.01" max={lot.availableQuantity} step="any" required value={quantities[lot.id] ?? ""} onChange={(event) => setQuantities((previous) => ({ ...previous, [lot.id]: event.target.value }))} /></label>
                    <button className="btn btn--green btn--sm" type="submit" disabled={busyId === lot.id || !deliveryLocation.trim()}>{busyId === lot.id ? "Placing…" : "Place order"}</button>
                  </form>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="card">
        <header className="card__head">
          <h3 className="card__title">{isSeller ? "Incoming sales" : "Your orders"}</h3>
        </header>
        {error && <p className="workflow-error" role="alert">{error}</p>}
        {loading ? <p className="workflow-muted">Loading orders…</p> : orders.length === 0 ? (
          <EmptyState icon="box" title={isSeller ? "No sales yet" : "No orders yet"} sub={isSeller ? "Buyer orders for your produce will appear here." : "Place an order from one of the available produce listings above."} />
        ) : (
          <DataTable
            columns={isSeller ? [
              { key: "buyer", label: "Buyer" },
              { key: "crop", label: "Crop" },
              { key: "qty", label: "Quantity", align: "right" },
              { key: "value", label: "Order value", align: "right" },
              { key: "status", label: "Status" },
              { key: "action", label: "Actions" },
            ] : [
              { key: "supplier", label: "Seller" },
              { key: "crop", label: "Crop" },
              { key: "qty", label: "Quantity", align: "right" },
              { key: "amount", label: "Amount", align: "right" },
              { key: "status", label: "Status" },
              { key: "action", label: "Next step" },
            ]}
            rows={orders.map((order) => ({
              buyer: order.buyerName,
              supplier: order.sellerName,
              crop: <span>{order.crop}<small className="workflow-subline">{order.grade}</small></span>,
              qty: `${order.quantity} ${order.unit}`,
              value: formatRupees(order.amount),
              amount: formatRupees(order.amount),
              status: <StatusBadge tone={statusTone(order.status)}>{order.status}</StatusBadge>,
              action: isSeller ? (
                <div className="workflow-actions">
                  {order.status === "pending" && <><button className="btn btn--green btn--sm" type="button" disabled={busyId === order.id} onClick={() => void updateOrder(order, "accepted")}>Accept</button><button className="btn btn--cream btn--sm" type="button" disabled={busyId === order.id} onClick={() => void updateOrder(order, "rejected")}>Decline</button></>}
                  {order.status === "accepted" && deliveredOrderIds.has(order.id) && <button className="btn btn--green btn--sm" type="button" disabled={busyId === order.id} onClick={() => void updateOrder(order, "fulfilled")}>Complete order</button>}
                  {order.status === "accepted" && !deliveredOrderIds.has(order.id) && <Link className="btn btn--cream btn--sm" href="/dashboard/transportation">Arrange transport</Link>}
                  {order.status === "fulfilled" && <span>Complete</span>}
                </div>
              ) : order.status === "accepted" || order.status === "fulfilled" ? <Link className="btn btn--cream btn--sm" href="/dashboard/payments">Payments</Link> : order.status === "pending" ? <button className="btn btn--cream btn--sm" type="button" disabled={busyId === order.id} onClick={() => void updateOrder(order, "cancelled")}>Cancel</button> : <span>—</span>,
            }))}
          />
        )}
      </section>
    </div>
  );
}