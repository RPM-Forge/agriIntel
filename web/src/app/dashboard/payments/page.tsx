"use client";

import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import DataTable from "@/components/dashboard/DataTable";
import EmptyState from "@/components/dashboard/EmptyState";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { useDashboard } from "@/components/dashboard/DashboardShell";
import { apiRequest } from "@/lib/clientApi";
import { formatDate, formatRupees } from "@/lib/marketplace";
import type { OrderRecord, PaymentRecord, PaymentStatus } from "@/lib/marketplace";

export default function PaymentsPage() {
  const { role } = useDashboard();
  const isSeller = role === "seller";
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [paymentResult, orderResult] = await Promise.all([
        apiRequest<{ data: PaymentRecord[] }>("/api/payments"),
        apiRequest<{ data: OrderRecord[] }>("/api/orders"),
      ]);
      setPayments(paymentResult.data);
      setOrders(orderResult.data);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load payment records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function createPayment(event: React.FormEvent<HTMLFormElement>, order: OrderRecord) {
    event.preventDefault();
    setBusyId(order.id);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await apiRequest("/api/payments", {
        method: "POST",
        body: JSON.stringify({
          orderId: order.id,
          method: form.get("method"),
          reference: form.get("reference"),
        }),
      });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create the payment record.");
    } finally {
      setBusyId("");
    }
  }

  async function updatePayment(payment: PaymentRecord, status: PaymentStatus) {
    setBusyId(payment.id);
    setError("");
    try {
      await apiRequest(`/api/payments/${payment.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update the payment record.");
    } finally {
      setBusyId("");
    }
  }

  const recordedOrderIds = new Set(payments.map((payment) => payment.orderId));
  const eligibleOrders = !isSeller
    ? orders.filter((order) => ["accepted", "fulfilled"].includes(order.status) && !recordedOrderIds.has(order.id))
    : [];
  const settled = payments.filter((payment) => payment.status === "settled");
  const pending = payments.filter((payment) => payment.status === "pending");
  const settledAmount = settled.reduce((total, payment) => total + payment.amount, 0);
  const pendingAmount = pending.reduce((total, payment) => total + payment.amount, 0);
  const statusTone = (status: PaymentStatus) => status === "settled" ? "green" : status === "pending" ? "orange" : "gray";

  return (
    <div>
      <PageHeader
        title="Payments"
        sub={isSeller ? "Review payment records for accepted crop sales." : "Record and track payments for accepted orders."}
      />

      <section className="dash-stats" aria-label="Payment summary">
        <StatCard icon={isSeller ? "rupee" : "wallet"} title="Marked settled" value={formatRupees(settledAmount)} subtitle={`${settled.length} manual records`} href="" tone="green" />
        <StatCard icon="clock" title="Pending records" value={formatRupees(pendingAmount)} subtitle={`${pending.length} awaiting confirmation`} href="" tone="orange" />
        <StatCard icon="checkCircle" title="Payment Records" value={String(payments.length)} subtitle="Across your orders" href="" tone="blue" />
      </section>

      {!isSeller && eligibleOrders.length > 0 && (
        <section className="card">
          <header className="card__head"><h3 className="card__title">Record a payment</h3></header>
          <div className="workflow-list">
            {eligibleOrders.map((order) => (
              <form className="workflow-item workflow-payment-form" key={order.id} onSubmit={(event) => void createPayment(event, order)}>
                <div className="workflow-item__main">
                  <div className="workflow-item__title"><h4>{order.crop} · {formatRupees(order.amount)}</h4><StatusBadge tone="green">{order.status}</StatusBadge></div>
                  <p>Order #{order.id.slice(-8)} · {order.quantity} {order.unit} · Seller: {order.sellerName}</p>
                </div>
                <label className="field"><span className="field__label">Method</span><select className="field__select" name="method" defaultValue="bank_transfer"><option value="bank_transfer">Bank transfer</option><option value="upi">UPI</option><option value="cash">Cash</option><option value="other">Other</option></select></label>
                <label className="field"><span className="field__label">Reference <small>(optional)</small></span><input className="field__input" name="reference" maxLength={100} placeholder="Transfer / receipt reference" /></label>
                <button className="btn btn--green btn--sm" type="submit" disabled={busyId === order.id}>{busyId === order.id ? "Saving…" : "Create record"}</button>
              </form>
            ))}
          </div>
        </section>
      )}

      <section className="card">
        <header className="card__head"><h3 className="card__title">Recent transactions</h3></header>
        {error && <p className="workflow-error" role="alert">{error}</p>}
        {loading ? <p className="workflow-muted">Loading payment records…</p> : payments.length === 0 ? (
          <EmptyState icon="receipt" title="No payment records yet" sub={isSeller ? "Buyer payment records for your accepted orders will appear here." : "Create a payment record once an order is accepted."} />
        ) : (
          <DataTable
            columns={[
              { key: "party", label: isSeller ? "Buyer" : "Seller" },
              { key: "crop", label: "Order" },
              { key: "amount", label: "Amount", align: "right" },
              { key: "method", label: "Method" },
              { key: "date", label: "Date" },
              { key: "status", label: "Status" },
              { key: "action", label: "Action" },
            ]}
            rows={payments.map((payment) => {
              const order = orders.find((item) => item.id === payment.orderId);
              return {
                party: isSeller ? order?.buyerName ?? "Buyer" : order?.sellerName ?? "Seller",
                crop: <span>{payment.crop}<small className="workflow-subline">#{payment.orderId.slice(-8)}</small></span>,
                amount: formatRupees(payment.amount),
                method: payment.method.replace("_", " "),
                date: formatDate(payment.settledAt ?? payment.createdAt),
                status: <StatusBadge tone={statusTone(payment.status)}>{payment.status}</StatusBadge>,
                action: isSeller && payment.status === "pending"
                  ? <button className="btn btn--green btn--sm" type="button" disabled={busyId === payment.id} onClick={() => void updatePayment(payment, "settled")}>Record as settled</button>
                  : !isSeller && payment.status === "pending"
                    ? <button className="btn btn--cream btn--sm" type="button" disabled={busyId === payment.id} onClick={() => void updatePayment(payment, "cancelled")}>Cancel record</button>
                    : !isSeller && payment.status === "cancelled"
                      ? <button className="btn btn--cream btn--sm" type="button" disabled={busyId === payment.id} onClick={() => void updatePayment(payment, "pending")}>Reopen record</button>
                    : "—",
              };
            })}
          />
        )}
      </section>
    </div>
  );
}
