"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Icon } from "./Icon";
import { formatINR, trendOf, usePrediction } from "@/lib/market";
import type { PriceQuery } from "@/lib/priceClient";

export default function AIRecommendationCard({ mode = "sell" }: { mode?: "sell" | "buy" }) {
  const query = useMemo<PriceQuery>(
    () =>
      mode === "sell"
        ? { commodity: "Wheat", state: "Maharashtra", district: "Nashik", grade: "FAQ" }
        : { commodity: "Onion", state: "Maharashtra", district: "Pune", grade: "FAQ" },
    [mode],
  );
  const { loading, data, error } = usePrediction(query);
  const trend = trendOf(data);

  const headline =
    mode === "sell"
      ? trend.up === true && trend.pct
        ? `Good time to sell ${query.commodity}`
        : `Watch ${query.commodity} prices`
      : trend.up === false && trend.pct
        ? `Good time to buy ${query.commodity}`
        : `Watch ${query.commodity} prices`;

  const detail = data?.recommendation || null;

  return (
    <section className="card">
      <header className="card__head">
        <h3 className="card__title">
          <span className="card__title-icon card__title-icon--mint">
            <Icon name="sparkle" size={17} />
          </span>
          AI Recommendation
          <span className="dash-badge dash-badge--new">NEW</span>
        </h3>
      </header>

      <div className="dash-ai">
        {loading ? (
          <div className="dash-ai__loading">
            <span className="skeleton skeleton--heading" />
            <span className="skeleton skeleton--lines" />
            <span className="skeleton skeleton--lines" />
            <span className="skeleton skeleton--cta" />
          </div>
        ) : error ? (
          <p className="dash-ai__fallback">
            <Icon name="info" size={16} />
            The prediction service is currently unavailable. Check back shortly for AI advice.
          </p>
        ) : data?.today != null ? (
          <>
            <h4 className="dash-ai__title">{headline}</h4>
            {trend.pct ? (
              <p className="dash-ai__pct">
                {mode === "sell"
                  ? `Prices are expected to move ~${trend.pct} in the coming days around ${query.district}.`
                  : `Prices are expected to ease ~${trend.pct} around ${query.district}.`}
              </p>
            ) : null}
            <div className="dash-ai__prices">
              <span>
                <small>Today</small>
                <strong>{formatINR(data.today)}</strong>
              </span>
              <span>
                <small>Expected</small>
                <strong>{formatINR(data.expected)}</strong>
              </span>
            </div>
            {detail && <p className="dash-ai__detail">{detail}</p>}
          </>
        ) : (
          <p className="dash-ai__fallback">
            <Icon name="info" size={16} />
            No recommendation available for this crop yet.
          </p>
        )}
      </div>

      <div className="card__foot">
        <Link href="/dashboard/ai-advice" className="btn btn--green btn--sm">
          View Detailed Analysis
          <Icon name="arrowRight" size={15} />
        </Link>
      </div>
    </section>
  );
}