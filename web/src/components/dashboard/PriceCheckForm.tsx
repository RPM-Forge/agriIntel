"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Icon } from "./Icon";
import { COMMODITIES, COMMODITIES_BY_STATE, GRADES, MARKET_LOCATIONS } from "@/lib/marketOptions";
import type { PriceQuery } from "@/lib/priceClient";

export interface PriceCheckFormValues {
  state: string;
  district: string;
  commodity: string;
  grade: string;
}

const DEFAULT_VALUES: PriceCheckFormValues = { state: "", district: "", commodity: "", grade: "" };

export default function PriceCheckForm({
  onSubmit,
  loading = false,
  submitLabel = "Check Rates & Demand",
  defaults,
}: {
  onSubmit: (query: PriceQuery) => void;
  loading?: boolean;
  submitLabel?: string;
  defaults?: Partial<PriceCheckFormValues>;
}) {
  const [form, setForm] = useState<PriceCheckFormValues>({ ...DEFAULT_VALUES, ...defaults });

  const setField = (key: keyof PriceCheckFormValues) => (value: string) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === "state") {
        next.district = "";
        next.commodity = "";
      }
      return next;
    });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.state || !form.district || !form.commodity || !form.grade) return;
    onSubmit({ ...form });
  };

  const complete = Boolean(form.state && form.district && form.commodity && form.grade);

  return (
    <form className="price-check" onSubmit={handleSubmit} noValidate>
      <div className="price-check__grid">
        <div>
          <label className="field__label" htmlFor="pc-commodity">
            Commodity
          </label>
          <select
            id="pc-commodity"
            className="field__select"
            value={form.commodity}
            onChange={(e) => setField("commodity")(e.target.value)}
          >
            <option value="">Select Commodity</option>
            {(form.state ? (COMMODITIES_BY_STATE[form.state] ?? COMMODITIES) : COMMODITIES).map((commodity) => (
              <option key={commodity} value={commodity}>
                {commodity}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="field__label" htmlFor="pc-state">
            State
          </label>
          <select
            id="pc-state"
            className="field__select"
            value={form.state}
            onChange={(e) => setField("state")(e.target.value)}
          >
            <option value="">Select State</option>
            {Object.keys(MARKET_LOCATIONS).map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="field__label" htmlFor="pc-district">
            District / Market
          </label>
          <select
            id="pc-district"
            className="field__select"
            value={form.district}
            onChange={(e) => setField("district")(e.target.value)}
            disabled={!form.state}
          >
            <option value="">{form.state ? "Select District" : "Select State first"}</option>
            {form.state &&
              (MARKET_LOCATIONS[form.state] ?? []).map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="field__label" htmlFor="pc-grade">
            Grade
          </label>
          <select
            id="pc-grade"
            className="field__select"
            value={form.grade}
            onChange={(e) => setField("grade")(e.target.value)}
          >
            <option value="">Select Grade</option>
            {GRADES.map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn btn--orange price-check__btn" disabled={loading || !complete}>
          {loading ? (
            <>
              <span className="spinner spinner--light" />
              Checking…
            </>
          ) : (
            <>
              <Icon name="trendingUp" size={17} />
              {submitLabel}
            </>
          )}
        </button>
      </div>
    </form>
  );
}