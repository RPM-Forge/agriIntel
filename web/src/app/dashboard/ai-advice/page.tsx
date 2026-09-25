"use client";

import { useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/dashboard/PageHeader";
import PriceCheckForm from "@/components/dashboard/PriceCheckForm";
import EmptyState from "@/components/dashboard/EmptyState";
import { Icon } from "@/components/dashboard/Icon";
import { formatINR, formatPct, usePrediction } from "@/lib/market";
import type { PriceQuery } from "@/lib/priceClient";
import { useDashboard } from "@/components/dashboard/DashboardShell";

const ADVICE_STEPS = [
  { title: "Check today&apos;s rate", text: "See the current mandi rate for your crop in your district." },
  { title: "Read the price outlook", text: "Understand whether prices are likely to rise or fall in the coming days." },
  { title: "Decide when to sell", text: "Use the recommendation to time your sale for a better price." },
];

export default function AIAdvicePage() {
  const { role } = useDashboard();
  const [query, setQuery] = useState<PriceQuery | null>(null);
  const { loading, data, error } = usePrediction(query);

  if (role === "buyer") {
    return (
      <div>
        <PageHeader title="AI Advice" sub="Data-driven recommendations for your buys." />
        <section className="card">
          <EmptyState
            icon="sparkle"
            title="This page is for sellers"
            sub="AI selling advice helps farmers time when to sell their harvest for a better price."
            action={
              <Link href="/dashboard/market-prices" className="btn btn--green btn--sm">
                Check Market Prices
                <Icon name="arrowRight" size={15} />
              </Link>
            }
          />
        </section>
      </div>
    );
  }

  const change =
    data && data.today != null && data.expected != null && data.today !== 0
      ? ((data.expected - data.today) / data.today) * 100
      : null;
  const direction = change == null ? null : change >= 0 ? "up" : "down";
  const magnitude = change == null ? null : formatPct(Math.abs(change));

  const headline =
    !data || data.today == null || direction == null
      ? null
      : direction === "down"
        ? `Prices may dip ~${magnitude} — consider selling soon.`
        : `Prices may rise ~${magnitude} — holding a little longer could pay off.`;

  return (
    <div>
      <PageHeader title="AI Advice" sub="Data-driven recommendations to help you time your sale for a better price." />

      <section className="card">
        <header className="card__head">
          <h3 className="card__title">
            <span className="card__title-icon card__title-icon--mint">
              <Icon name="sparkle" size={17} />
            </span>
            Get a recommendation
          </h3>
        </header>
        <PriceCheckForm onSubmit={setQuery} loading={loading} submitLabel="Get Selling Advice" />
      </section>

      <div className="dash-stack">
        {!query && (
          <div className="dash-hint">
            <span className="dash-hint__icon">
              <Icon name="sparkle" size={22} />
            </span>
            <div>
              <strong>Your AI recommendation will appear here</strong>
              <p>Select a crop, state, district and grade to get a personalised advice.</p>
            </div>
          </div>
        )}

        {loading && (
          <section className="card">
            <div className="dash-ai__loading">
              <span className="skeleton skeleton--heading" />
              <span className="skeleton skeleton--lines" />
              <span className="skeleton skeleton--lines" />
            </div>
          </section>
        )}

        {error && !loading && (
          <section className="card">
            <div className="dash-error">
              <span className="dash-error__icon">
                <Icon name="alertCircle" size={22} />
              </span>
              <div>
                <strong>Couldn&apos;t generate advice</strong>
                <p>{error}</p>
              </div>
            </div>
          </section>
        )}

        {data && data.today != null && !loading && (
          <section className="card">
            <header className="card__head">
              <h3 className="card__title">
                <span className="card__title-icon card__title-icon--mint">
                  <Icon name="sparkle" size={17} />
                </span>
                {query?.commodity} · {query?.district}, {query?.state}
              </h3>
              <span className="dash-badge dash-badge--new">NEW</span>
            </header>

            <div className="dash-ai">
              <h4 className="dash-ai__title">Seller advice</h4>
              {headline && <p className="dash-ai__pct">{headline}</p>}
              <div className="dash-ai__prices">
                <span>
                  <small>Today&apos;s rate</small>
                  <strong>{formatINR(data.today)}</strong>
                </span>
                <span>
                  <small>Expected price</small>
                  <strong>{formatINR(data.expected)}</strong>
                </span>
              </div>
              {data.recommendation && <p className="dash-ai__detail">{data.recommendation}</p>}
            </div>
          </section>
        )}

        <section className="card">
          <header className="card__head">
            <h3 className="card__title">How to use AI advice</h3>
          </header>
          <div className="advice-steps">
            {ADVICE_STEPS.map((step, index) => (
              <div className="advice-step" key={step.title}>
                <span className="advice-step__num">{index + 1}</span>
                <div>
                  <strong>{step.title}</strong>
                  <p>{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}