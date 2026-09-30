"use client";

import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import EmptyState from "@/components/dashboard/EmptyState";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Icon } from "@/components/dashboard/Icon";
import { apiRequest } from "@/lib/clientApi";
import { formatDate, formatRupees } from "@/lib/marketplace";
import {
  committeesForDistrict,
  districtsForState,
  FPO_CROPS,
  FPO_GRADES,
  FPO_STATES,
} from "@/lib/fpoOptions";

interface FpoLot {
  id: string;
  lotNumber: string;
  crop: string;
  grade: string;
  committee: string;
  state: string;
  district: string;
  quantity: number;
  availableQuantity: number;
  unit: string;
  createdAt: string;
}

interface VerifiedFpo {
  id: string;
  name: string;
  registrationNumber: string;
  contactName: string;
  phone: string;
  email: string;
  matchingLocation: string;
}

interface DemandPool {
  id: string;
  buyerName: string;
  crop: string;
  grade: string;
  state: string;
  districts: string[];
  quantity: number;
  filledQuantity: number;
  remainingQuantity: number;
  unit: string;
  maxPricePerUnit?: number;
  deliveryDate?: string;
}

type MatchKind = "verified" | "pools";

function FpoLotForm({
  initialLot,
  saving,
  onSave,
  onCancel,
}: {
  initialLot?: FpoLot;
  saving: boolean;
  onSave: (payload: Record<string, FormDataEntryValue>) => Promise<void>;
  onCancel?: () => void;
}) {
  const initialState = initialLot && FPO_STATES.includes(initialLot.state) ? initialLot.state : "Maharashtra";
  const [state, setState] = useState(initialState);
  const availableDistricts = districtsForState(state);
  const initialDistrictIsValid = availableDistricts.includes(initialLot?.district ?? "");
  const [district, setDistrict] = useState(initialDistrictIsValid ? initialLot?.district ?? "" : availableDistricts[0] ?? "");
  const availableCommittees = committeesForDistrict(district);
  const [committee, setCommittee] = useState(availableCommittees.includes(initialLot?.committee ?? "") ? initialLot?.committee ?? "" : "");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    await onSave(payload);
  }

  return (
    <form className="workflow-form" onSubmit={submit}>
      <label className="field">
        <span className="field__label">Commodity</span>
        <select className="field__select" name="crop" defaultValue={FPO_CROPS.includes(initialLot?.crop ?? "") ? initialLot?.crop : "Potato"} required>
          {FPO_CROPS.map((crop) => <option key={crop} value={crop}>{crop}</option>)}
        </select>
      </label>
      <label className="field">
        <span className="field__label">Grade / quality</span>
        <select className="field__select" name="grade" defaultValue={initialLot?.grade ?? "Grade A"} required>
          {FPO_GRADES.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
        </select>
      </label>
      <label className="field"><span className="field__label">Quantity</span><input className="field__input" name="quantity" type="number" min="0.01" step="any" required defaultValue={initialLot?.quantity ?? 60} /></label>
      <label className="field"><span className="field__label">Unit</span><select className="field__select" name="unit" defaultValue={initialLot?.unit ?? "tonne"}><option value="kg">Kilograms</option><option value="quintal">Quintals</option><option value="tonne">Tonnes</option></select></label>
      <label className="field">
        <span className="field__label">State</span>
        <select
          className="field__select"
          name="state"
          value={state}
          onChange={(event) => {
            const nextState = event.target.value;
            const nextDistrict = districtsForState(nextState)[0];
            setState(nextState);
            setDistrict(nextDistrict ?? "");
            setCommittee("");
          }}
          required
        >
          {FPO_STATES.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>
      <label className="field">
        <span className="field__label">District</span>
        <select
          className="field__select"
          name="district"
          value={district}
          onChange={(event) => {
            setDistrict(event.target.value);
            setCommittee("");
          }}
          required
        >
          {availableDistricts.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>
      <label className="field">
        <span className="field__label">Committee <small>(optional)</small></span>
        <select className="field__select" name="committee" value={committee} onChange={(event) => setCommittee(event.target.value)}>
          <option value="">Select committee</option>
          {availableCommittees.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>
      <div className="workflow-form__actions fpo-form-actions">
        {onCancel && <button className="btn btn--cream btn--sm" type="button" onClick={onCancel}>Cancel</button>}
        <button className="btn btn--green btn--sm" type="submit" disabled={saving}>
          {saving ? "Saving…" : initialLot ? "Save changes" : "Create lot"}<Icon name="arrowRight" size={15} />
        </button>
      </div>
    </form>
  );
}

export default function FpoPage() {
  const [lots, setLots] = useState<FpoLot[]>([]);
  const [selectedLot, setSelectedLot] = useState<FpoLot | null>(null);
  const [matchKind, setMatchKind] = useState<MatchKind | null>(null);
  const [verifiedFpos, setVerifiedFpos] = useState<VerifiedFpo[]>([]);
  const [pools, setPools] = useState<DemandPool[]>([]);
  const [poolQuantities, setPoolQuantities] = useState<Record<string, string>>({});
  const [editingLot, setEditingLot] = useState<FpoLot | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [saving, setSaving] = useState(false);
  const [joiningPool, setJoiningPool] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadLots = useCallback(async () => {
    const result = await apiRequest<{ data: FpoLot[] }>("/api/fpo/lots");
    setLots(result.data);
    return result.data;
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadLots()
        .then(() => setError(""))
        .catch((cause: unknown) => {
          setError(cause instanceof Error ? cause.message : "Could not load your FPO lots.");
        })
        .finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadLots]);

  async function saveNewLot(payload: Record<string, FormDataEntryValue>) {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await apiRequest("/api/fpo/lots", { method: "POST", body: JSON.stringify(payload) });
      await loadLots();
      setNotice("Lot created. Choose “Sell via FPO” on its card to find matching buyers.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create the lot.");
    } finally {
      setSaving(false);
    }
  }

  async function saveEditedLot(lot: FpoLot, payload: Record<string, FormDataEntryValue>) {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await apiRequest(`/api/fpo/lots/${lot.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      await loadLots();
      setEditingLot(null);
      setNotice(`Lot ${lot.lotNumber} updated.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update this lot.");
    } finally {
      setSaving(false);
    }
  }

  async function chooseMatch(kind: MatchKind) {
    if (!selectedLot) return;
    setMatchKind(kind);
    setLoadingMatches(true);
    setError("");
    setNotice("");
    try {
      const result = await apiRequest<{
        data: VerifiedFpo[] | DemandPool[];
        lot: FpoLot;
      }>(`/api/fpo/matches?lotId=${encodeURIComponent(selectedLot.id)}&kind=${kind}`);
      setSelectedLot(result.lot);
      if (kind === "verified") {
        const data = result.data as VerifiedFpo[];
        setVerifiedFpos(data);
      } else {
        const data = result.data as DemandPool[];
        setPools(data);
        setPoolQuantities(
          Object.fromEntries(data.map((pool) => [pool.id, String(Math.min(pool.remainingQuantity, result.lot.availableQuantity))])),
        );
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load matching FPO buyers.");
    } finally {
      setLoadingMatches(false);
    }
  }

  async function contributeToPool(pool: DemandPool) {
    if (!selectedLot) return;
    const quantity = Number(poolQuantities[pool.id]);
    const maximum = Math.min(pool.remainingQuantity, selectedLot.availableQuantity);
    if (!Number.isFinite(quantity) || quantity <= 0 || quantity > maximum) {
      setError(`Enter a quantity from 0.01 to ${maximum} ${pool.unit}.`);
      return;
    }

    setJoiningPool(pool.id);
    setError("");
    setNotice("");
    try {
      await apiRequest(`/api/fpo/pools/${pool.id}/contributions`, {
        method: "POST",
        body: JSON.stringify({ lotId: selectedLot.id, quantity }),
      });
      const refreshedLots = await loadLots();
      const refreshedLot = refreshedLots.find((lot) => lot.id === selectedLot.id) ?? null;
      setSelectedLot(refreshedLot);
      setNotice(`Added ${quantity} ${pool.unit} to ${pool.buyerName}'s demand pool.`);
      if (refreshedLot) {
        const result = await apiRequest<{ data: DemandPool[] }>(
          `/api/fpo/matches?lotId=${encodeURIComponent(refreshedLot.id)}&kind=pools`,
        );
        setPools(result.data);
        setPoolQuantities(
          Object.fromEntries(
            result.data.map((match) => [match.id, String(Math.min(match.remainingQuantity, refreshedLot.availableQuantity))]),
          ),
        );
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not add this quantity to the pool.");
    } finally {
      setJoiningPool("");
    }
  }

  function returnToLots() {
    setSelectedLot(null);
    setMatchKind(null);
    setVerifiedFpos([]);
    setPools([]);
    setError("");
    setNotice("");
  }

  return (
    <div>
      <PageHeader
        title="FPO marketplace"
        sub="Create a saved produce lot, then match it with verified FPOs or an open buyer pool."
        actions={selectedLot
          ? <button type="button" className="btn btn--cream btn--sm" onClick={returnToLots}><Icon name="chevronLeft" size={15} />All lots</button>
          : undefined}
      />

      
      {error && <p className="workflow-error" role="alert">{error}</p>}
      {notice && <p className="fpo-notice" role="status">{notice}</p>}

      {selectedLot ? (
        <>
          <section className="fpo-selected-lot">
            <div>
              <span className="fpo-eyebrow">Selected lot · {selectedLot.lotNumber}</span>
              <h2>{selectedLot.crop} · {selectedLot.grade}</h2>
              <p>{selectedLot.district}, {selectedLot.state} · {selectedLot.availableQuantity} {selectedLot.unit} available</p>
            </div>
            <StatusBadge tone={selectedLot.availableQuantity > 0 ? "green" : "gray"}>
              {selectedLot.availableQuantity > 0 ? "Ready to sell" : "Fully committed"}
            </StatusBadge>
          </section>

          {!matchKind ? (
            <section className="fpo-choice-grid" aria-label="Choose how to sell this lot">
              <button className="fpo-choice card" type="button" onClick={() => void chooseMatch("pools")} disabled={selectedLot.availableQuantity <= 0}>
                <span className="fpo-choice__icon"><Icon name="layers" size={22} /></span>
                <span className="fpo-choice__copy">
                  <strong>Demand-driven pool</strong>
                  <span>Join a buyer requirement with other sellers. Add only the quantity that remains open.</span>
                </span>
                <Icon name="arrowRight" size={18} />
              </button>
              <button className="fpo-choice card" type="button" onClick={() => void chooseMatch("verified")} disabled={selectedLot.availableQuantity <= 0}>
                <span className="fpo-choice__icon"><Icon name="badgeCheck" size={22} /></span>
                <span className="fpo-choice__copy">
                  <strong>Verified FPOs</strong>
                  <span>Find registered FPOs serving your crop, grade, state and district, with direct contact details.</span>
                </span>
                <Icon name="arrowRight" size={18} />
              </button>
            </section>
          ) : (
            <section className="card fpo-results">
              <header className="card__head">
                <h3 className="card__title">{matchKind === "verified" ? "Verified FPO matches" : "Matching demand pools"}</h3>
                <button className="btn btn--cream btn--sm" type="button" onClick={() => setMatchKind(null)}>Change selling method</button>
              </header>
              {loadingMatches ? <p className="workflow-muted">Finding matches…</p> : matchKind === "verified" ? (
                verifiedFpos.length === 0 ? (
                  <EmptyState icon="search" title="No verified FPO matches yet" sub="No active FPO currently covers this lot’s exact crop, grade and district. Try a demand-driven pool instead." />
                ) : (
                  <div className="fpo-match-list">
                    {verifiedFpos.map((fpo) => (
                      <article className="fpo-match-card" key={fpo.id}>
                        <div className="fpo-match-card__top">
                          <div><span className="fpo-eyebrow">Verified FPO · {fpo.registrationNumber}</span><h4>{fpo.name}</h4></div>
                          <StatusBadge tone="green">District match</StatusBadge>
                        </div>
                        <p>Contact: {fpo.contactName} · Serving {fpo.matchingLocation}</p>
                        <div className="fpo-contact-links">
                          <a href={`tel:${fpo.phone}`}><Icon name="phone" size={15} />{fpo.phone}</a>
                          <a href={`mailto:${fpo.email}`}><Icon name="mail" size={15} />{fpo.email}</a>
                        </div>
                      </article>
                    ))}
                  </div>
                )
              ) : pools.length === 0 ? (
                <EmptyState icon="layers" title="No open pools match this lot" sub="There are no open buyer pools for its crop, grade, location and unit right now." />
              ) : (
                <div className="fpo-match-list">
                  {pools.map((pool) => {
                    const maxContribution = Math.min(pool.remainingQuantity, selectedLot.availableQuantity);
                    const currentQuantity = poolQuantities[pool.id] ?? "";
                    return (
                      <article className="fpo-pool-card" key={pool.id}>
                        <div className="fpo-match-card__top">
                          <div><span className="fpo-eyebrow">Buyer demand pool</span><h4>{pool.buyerName}</h4></div>
                          <span className="fpo-pool-count">{pool.filledQuantity} / {pool.quantity} {pool.unit}</span>
                        </div>
                        <p>{pool.crop} · {pool.grade} · {pool.districts.join(", ")}, {pool.state}</p>
                        {pool.maxPricePerUnit !== undefined && <p>Buyer offer: {formatRupees(pool.maxPricePerUnit)} / {pool.unit}</p>}
                        <div className="fpo-progress" role="progressbar" aria-label={`${pool.buyerName} pool filled`} aria-valuemin={0} aria-valuemax={pool.quantity} aria-valuenow={pool.filledQuantity}>
                          <span style={{ width: `${Math.min(100, (pool.filledQuantity / pool.quantity) * 100)}%` }} />
                        </div>
                        <p className="fpo-pool-remaining">{pool.remainingQuantity} {pool.unit} still needed{pool.deliveryDate ? ` · Needed by ${formatDate(pool.deliveryDate)}` : ""}</p>
                        <form className="fpo-pool-join" onSubmit={(event) => { event.preventDefault(); void contributeToPool(pool); }}>
                          <label className="field">
                            <span className="field__label">Your contribution (max {maxContribution} {pool.unit})</span>
                            <input
                              className="field__input"
                              type="number"
                              min="0.01"
                              max={maxContribution}
                              step="any"
                              value={currentQuantity}
                              onChange={(event) => setPoolQuantities((current) => ({ ...current, [pool.id]: event.target.value }))}
                              required
                            />
                          </label>
                          <button className="btn btn--green btn--sm" type="submit" disabled={joiningPool === pool.id || maxContribution <= 0}>
                            {joiningPool === pool.id ? "Adding…" : "Add to pool"}<Icon name="arrowRight" size={15} />
                          </button>
                        </form>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </>
      ) : (
        <>
          <section className="card">
            <header className="card__head">
              <h3 className="card__title"><span className="card__title-icon"><Icon name="plus" size={17} /></span>Create a produce lot</h3>
              <span className="card__meta">A unique lot number is assigned automatically</span>
            </header>
            <FpoLotForm saving={saving} onSave={(payload) => saveNewLot(payload)} />
          </section>

          <section className="card">
            <header className="card__head"><h3 className="card__title">Your FPO lots</h3><span className="card__meta">{lots.length} total</span></header>
            {loading ? <p className="workflow-muted">Loading your lots…</p> : lots.length === 0 ? (
              <EmptyState icon="sprout" title="No FPO lots yet" sub="Create a lot above to discover verified FPOs and buyer demand pools." />
            ) : (
              <div className="workflow-list">
                {lots.map((lot) => (
                  <article className="workflow-item" key={lot.id}>
                    <div className="workflow-item__main">
                      <div className="workflow-item__title"><h4>{lot.crop} · {lot.grade}</h4><StatusBadge tone={lot.availableQuantity > 0 ? "green" : "gray"}>{lot.availableQuantity > 0 ? "Available" : "Committed"}</StatusBadge></div>
                      <p>{lot.availableQuantity} / {lot.quantity} {lot.unit} available · {lot.district}, {lot.state}</p>
                      <p>Lot {lot.lotNumber}{lot.committee ? ` · ${lot.committee}` : ""} · Created {formatDate(lot.createdAt)}</p>
                    </div>
                    <div className="fpo-lot-actions">
                      {lot.quantity === lot.availableQuantity && (
                        <button className="btn btn--cream btn--sm" type="button" onClick={() => { setEditingLot(lot); setError(""); setNotice(""); }}>
                          Edit lot<Icon name="edit" size={15} />
                        </button>
                      )}
                      <button className="btn btn--green btn--sm" type="button" onClick={() => { setSelectedLot(lot); setError(""); setNotice(""); }}>
                        Sell via FPO<Icon name="arrowRight" size={15} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
            {editingLot && (
              <div className="fpo-edit-panel">
                <header className="card__head"><h3 className="card__title">Edit lot {editingLot.lotNumber}</h3></header>
                <FpoLotForm
                  key={editingLot.id}
                  initialLot={editingLot}
                  saving={saving}
                  onSave={(payload) => saveEditedLot(editingLot, payload)}
                  onCancel={() => setEditingLot(null)}
                />
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
