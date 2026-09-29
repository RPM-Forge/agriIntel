"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/dashboard/PageHeader";
import EmptyState from "@/components/dashboard/EmptyState";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Icon } from "@/components/dashboard/Icon";
import { useDashboard } from "@/components/dashboard/DashboardShell";
import { apiRequest } from "@/lib/clientApi";
import { formatDate, formatRupees } from "@/lib/marketplace";
import type { ProduceLotRecord } from "@/lib/marketplace";

export default function MyProducePage() {
  const { role } = useDashboard();
  const [lots, setLots] = useState<ProduceLotRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadLots = useCallback(async () => {
    try {
      const result = await apiRequest<{ data: ProduceLotRecord[] }>("/api/produce?mine=true");
      setLots(result.data);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load produce listings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (role !== "seller") return;
    const timer = window.setTimeout(() => void loadLots(), 0);
    return () => window.clearTimeout(timer);
  }, [loadLots, role]);

  async function createListing(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = Object.fromEntries(form.entries());
    try {
      await apiRequest("/api/produce", { method: "POST", body: JSON.stringify(payload) });
      formElement.reset();
      await loadLots();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create the listing.");
    } finally {
      setSaving(false);
    }
  }

  async function closeListing(id: string) {
    setError("");
    try {
      await apiRequest(`/api/produce/${id}`, { method: "PATCH", body: JSON.stringify({ status: "closed" }) });
      await loadLots();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not close the listing.");
    }
  }

  if (role === "buyer") {
    return (
      <div>
        <PageHeader title="My Produce" sub="Manage the crop lots you want to sell." />
        <section className="card">
          <EmptyState
            icon="box"
            title="This page is for sellers"
            sub="Browse available produce and place an order from the Orders page."
            action={<Link href="/dashboard/orders" className="btn btn--green btn--sm">Browse Produce<Icon name="arrowRight" size={15} /></Link>}
          />
        </section>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="My Produce" sub="List and manage the crop lots you want to sell." />

      <section className="card">
        <header className="card__head">
          <h3 className="card__title"><span className="card__title-icon"><Icon name="plus" size={17} /></span>List produce</h3>
          <span className="card__meta">Buyers can order from your available quantity</span>
        </header>
        <form className="workflow-form" onSubmit={createListing}>
          <label className="field"><span className="field__label">Crop</span><input className="field__input" name="crop" required maxLength={80} placeholder="e.g. Wheat" /></label>
          <label className="field"><span className="field__label">Grade</span><input className="field__input" name="grade" required maxLength={40} placeholder="e.g. FAQ" /></label>
          <label className="field"><span className="field__label">Quantity</span><input className="field__input" name="quantity" type="number" min="0.01" step="any" required /></label>
          <label className="field"><span className="field__label">Unit</span><select className="field__select" name="unit" defaultValue="quintal"><option value="kg">Kilograms</option><option value="quintal">Quintals</option><option value="tonne">Tonnes</option></select></label>
          <label className="field"><span className="field__label">Price per unit (₹)</span><input className="field__input" name="pricePerUnit" type="number" min="0.01" step="0.01" required /></label>
          <label className="field"><span className="field__label">Pickup location</span><input className="field__input" name="location" required maxLength={120} placeholder="Village, district, state" /></label>
          <label className="field"><span className="field__label">Harvest date <small>(optional)</small></span><input className="field__input" name="harvestDate" type="date" /></label>
          <div className="workflow-form__actions"><button className="btn btn--green btn--sm" type="submit" disabled={saving}>{saving ? "Saving…" : "Publish listing"}<Icon name="arrowRight" size={15} /></button></div>
        </form>
        {error && <p className="workflow-error" role="alert">{error}</p>}
      </section>

      <section className="card">
        <header className="card__head"><h3 className="card__title">Your listings</h3><span className="card__meta">{lots.length} total</span></header>
        {loading ? <p className="workflow-muted">Loading your listings…</p> : lots.length === 0 ? (
          <EmptyState icon="sprout" title="No produce listed yet" sub="Publish a listing above to make your crop available to buyers." />
        ) : (
          <div className="workflow-list">
            {lots.map((lot) => (
              <article className="workflow-item" key={lot.id}>
                <div className="workflow-item__main">
                  <div className="workflow-item__title"><h4>{lot.crop} · {lot.grade}</h4><StatusBadge tone={lot.status === "available" ? "green" : lot.status === "sold" ? "blue" : "gray"}>{lot.status}</StatusBadge></div>
                  <p>{lot.availableQuantity} / {lot.quantity} {lot.unit} available · {formatRupees(lot.pricePerUnit)} / {lot.unit}</p>
                  <p>{lot.location} · Listed {formatDate(lot.createdAt)}</p>
                </div>
                {lot.status === "available" && <button className="btn btn--cream btn--sm" type="button" onClick={() => void closeListing(lot.id)}>Close listing</button>}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}