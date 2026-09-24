"use client";

import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import PriceCheckForm from "@/components/dashboard/PriceCheckForm";
import DataTable from "@/components/dashboard/DataTable";
import { Icon } from "@/components/dashboard/Icon";
import { formatINR, isRecord, parsePriceData, trendOf, useMarketRows, usePrediction } from "@/lib/market";
import { COMMODITIES, MARKET_LOCATIONS } from "@/lib/marketOptions";
import type { PriceQuery } from "@/lib/priceClient";

function HistoricalSparkline({ data }: { data: number[] }) {
  const w = 320;
  const h = 84;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const coords = data.map((p, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - 8 - ((p - min) / range) * (h - 24);
    return [x.toFixed(1), y.toFixed(1)] as const;
  });
  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  return (
    <svg className="hist-chart" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label="Historical price chart">
      <path d={area} fill="rgba(51, 131, 75, 0.16)" />
      <path d={line} fill="none" stroke="var(--green-600)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PriceBar({ data }: { data: NonNullable<ReturnType<typeof parsePriceData>> }) {
  const values = [data.today, data.expected, data.min, data.max].filter((v): v is number => v != null);
  const peak = Math.max(...values, 1);
  const row = (label: string, value: number | null, color: string) => {
    const width = value != null ? `${Math.max((value / peak) * 100, 4)}%` : "0%";
    return (
      <span className="price-bar__row">
        <span className="price-bar__label">{label}</span>
        <span className="price-bar__track">
          <span className="price-bar__fill" style={{ width, background: color }} />
        </span>
        <strong className="price-bar__value">{formatINR(value)}</strong>
      </span>
    );
  };
  return (
    <div className="price-bar">
      {row("Today", data.today, "var(--green-600)")}
      {row("Expected", data.expected, "var(--orange-500)")}
      {row("Minimum", data.min, "var(--gray-300)")}
      {row("Maximum", data.max, "var(--green-400)")}
    </div>
  );
}

export default function MarketPricesPage() {
  const [query, setQuery] = useState<PriceQuery | null>(null);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<string | undefined>(undefined);
  const isCollapsed = query === null;
  const pinned = useMemo(() => query, [query]);

  const { loading, data, error } = usePrediction(pinned);
  const trend = trendOf(data);

  const comparisonQueries = useMemo(() => {
    if (!pinned) return [];
    const districts = MARKET_LOCATIONS[pinned.state] ?? [];
    return districts.filter((d) => d !== pinned.district).slice(0, 3).map((district) => ({
      commodity: pinned.commodity,
      state: pinned.state,
      district,
      grade: pinned.grade,
    }));
  }, [pinned]);

  const { rows: comparisonRows } = useMarketRows(comparisonQueries);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const search = params.get("search");
    if (search && COMMODITIES.includes(search)) {
      const raf = requestAnimationFrame(() => setPrefill(search));
      return () => cancelAnimationFrame(raf);
    }
  }, []);

  const historical = useMemo(() => {
    if (!data || !isRecord(data.raw)) return null;
    const hist = data.raw.historical_prices ?? data.raw.history ?? data.raw.price_history;
    if (Array.isArray(hist) && hist.length > 1 && typeof hist[0] === "number") return hist as number[];
    return null;
  }, [data]);

  const handleSubmit = (next: PriceQuery) => {
    setQuery(next);
    setCheckedAt(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
  };

  return (
    <div>
      <PageHeader
        title="Market Prices"
        sub="Compare live mandi rates across districts and decide when to sell or buy."
      />

      <section className="card">
        <header className="card__head">
          <h3 className="card__title">
            <span className="card__title-icon">
              <Icon name="filter" size={17} />
            </span>
            Check Rates & Demand
          </h3>
        </header>
        <PriceCheckForm key={prefill ?? "default"} defaults={prefill ? { commodity: prefill } : undefined} onSubmit={handleSubmit} loading={loading} />
      </section>

      {isCollapsed && (
        <div className="dash-hint">
          <span className="dash-hint__icon">
            <Icon name="trendingUp" size={22} />
          </span>
          <div>
            <strong>Select your crop, state, district and grade</strong>
            <p>Live rates, price outlook and market comparison will appear here.</p>
          </div>
        </div>
      )}

      {!isCollapsed && (
        <div className="dash-stack">
          {loading && (
            <section className="card">
              <div className="card__head">
                <h3 className="card__title">Loading {query.commodity} rates…</h3>
              </div>
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
                  <strong>Couldn&apos;t fetch rates</strong>
                  <p>{error}</p>
                </div>
              </div>
            </section>
          )}

          {data && !loading && (
            <>
              <section className="card">
                <header className="card__head">
                  <h3 className="card__title">
                    <span className="card__title-icon">
                      <Icon name="grain" size={17} />
                    </span>
                    {query.commodity} · {query.district}, {query.state}
                    {checkedAt && <span className="card__meta">Updated {checkedAt}</span>}
                  </h3>
                </header>

                <div className="price-hero">
                  <div className="price-hero__main">
                    <span className="price-hero__label">Current Price</span>
                    <span className="price-hero__value">{formatINR(data.today)}</span>
                    <span className="price-hero__unit">per quintal</span>
                  </div>
                  {trend.pct && (
                    <span className={`dash-trend dash-trend--${trend.up ? "up" : "down"} price-hero__trend`}>
                      <Icon name={trend.up ? "arrowUp" : "arrowDown"} size={15} />
                      {trend.pct} expected
                    </span>
                  )}
                </div>

                <div className="price-stats">
                  <span>
                    <small>Today&apos;s rate</small>
                    <strong>{formatINR(data.today)}</strong>
                  </span>
                  <span>
                    <small>Expected price</small>
                    <strong>{formatINR(data.expected)}</strong>
                  </span>
                  <span>
                    <small>Minimum</small>
                    <strong>{formatINR(data.min)}</strong>
                  </span>
                  <span>
                    <small>Maximum</small>
                    <strong>{formatINR(data.max)}</strong>
                  </span>
                </div>

                <div className="card__sub">
                  <h4>Price outlook</h4>
                  <PriceBar data={data} />
                </div>

                {data.recommendation ? (
                  <div className="dash-ai__panel">
                    <p className="dash-ai__detail">{data.recommendation}</p>
                  </div>
                ) : null}
              </section>

              <section className="card">
                <header className="card__head">
                  <h3 className="card__title">Market Comparison</h3>
                  {checkedAt && <span className="card__meta">Same crop in nearby markets</span>}
                </header>
                <DataTable
                  columns={[
                    { key: "market", label: "Market" },
                    { key: "price", label: "Price (₹/Quintal)", align: "right" },
                    { key: "trend", label: "Trend" },
                  ]}
                  rows={comparisonRows.map((row) => {
                    const t = trendOf(row.data);
                    return {
                      market: <span className="dash-cell-muted">{row.market}<small>{row.query.state}</small></span>,
                      price:
                        row.status === "loading" ? (
                          <span className="skeleton skeleton--sm" />
                        ) : row.status === "error" ? (
                          <span className="dash-cell-muted">Unavailable</span>
                        ) : (
                          <strong className="dash-price">{formatINR(row.data?.today)}</strong>
                        ),
                      trend:
                        row.status === "loading" ? (
                          <span className="skeleton skeleton--xs" />
                        ) : t.pct ? (
                          <span className={`dash-trend dash-trend--${t.up ? "up" : "down"}`}>
                            <Icon name={t.up ? "arrowUp" : "arrowDown"} size={13} />
                            {t.pct}
                          </span>
                        ) : (
                          <span className="dash-cell-muted">—</span>
                        ),
                    };
                  })}
                  emptyIcon="chartBar"
                  emptyTitle="No comparison available"
                  emptySub="Try a different district to see nearby markets."
                />
              </section>

              <section className="card">
                <header className="card__head">
                  <h3 className="card__title">Historical Price Trend</h3>
                </header>
                {historical ? (
                  <HistoricalSparkline data={historical} />
                ) : (
                  <div className="dash-note">
                    <Icon name="info" size={16} />
                    Historical price series is not available for this crop and market yet.
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      )}
    </div>
  );
}