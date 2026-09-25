"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Icon } from "./Icon";
import { formatINR, trendOf, useMarketRows } from "@/lib/market";
import type { PriceQuery } from "@/lib/priceClient";

const DEFAULT_QUERIES: PriceQuery[] = [
  { commodity: "Wheat", state: "Maharashtra", district: "Nashik", grade: "FAQ" },
  { commodity: "Onion", state: "Maharashtra", district: "Pune", grade: "FAQ" },
  { commodity: "Tomato", state: "Maharashtra", district: "Mumbai", grade: "FAQ" },
  { commodity: "Rice", state: "Madhya Pradesh", district: "Indore", grade: "FAQ" },
];

export default function MarketPriceTable() {
  const queries = useMemo(() => DEFAULT_QUERIES, []);
  const { rows } = useMarketRows(queries);

  return (
    <section className="card">
      <header className="card__head">
        <h3 className="card__title">
          <span className="card__title-icon">
            <Icon name="chartBar" size={17} />
          </span>
          Current Market Prices
        </h3>
        <Link href="/dashboard/market-prices" className="card__link">
          View More
          <Icon name="arrowRight" size={15} />
        </Link>
      </header>

      <div className="dash-table-wrap">
        <table className="dash-table">
          <thead>
            <tr>
              <th>Crop</th>
              <th>Market</th>
              <th className="is-right">Price (₹/Quintal)</th>
              <th>Trend</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const trend = trendOf(row.data);
              return (
                <tr key={`${row.query.commodity}-${row.query.district}`}>
                  <td>
                    <span className="dash-crop">
                      <span className="dash-crop__icon">
                        <Icon name="grain" size={15} />
                      </span>
                      {row.label}
                    </span>
                  </td>
                  <td className="dash-cell-muted">
                    {row.market}
                    <small>{row.query.state}</small>
                  </td>
                  <td className="is-right">
                    {row.status === "loading" ? (
                      <span className="skeleton skeleton--sm" />
                    ) : row.status === "error" ? (
                      <span className="dash-cell-muted">Unavailable</span>
                    ) : (
                      <strong className="dash-price">{formatINR(row.data?.today)}</strong>
                    )}
                  </td>
                  <td>
                    {row.status === "loading" ? (
                      <span className="skeleton skeleton--xs" />
                    ) : trend.pct ? (
                      <span className={`dash-trend dash-trend--${trend.up ? "up" : "down"}`}>
                        <Icon name={trend.up ? "arrowUp" : "arrowDown"} size={13} />
                        {trend.pct}
                      </span>
                    ) : (
                      <span className="dash-cell-muted">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {rows.every((row) => row.status === "error") && (
        <p className="dash-error-note">
          <Icon name="alertCircle" size={14} />
          Live rates could not be loaded. Check the AI price service and refresh.
        </p>
      )}
    </section>
  );
}