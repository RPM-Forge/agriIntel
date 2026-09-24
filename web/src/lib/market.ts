import { useEffect, useState } from "react";
import { getPricePrediction } from "./priceClient";
import type { PriceQuery } from "./priceClient";

export interface PriceData {
  today: number | null;
  expected: number | null;
  min: number | null;
  max: number | null;
  recommendation: string | null;
  raw: unknown;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value.replace(/[^0-9.-]/g, ""));
    if (Number.isFinite(n) && value.trim() !== "") return n;
  }
  return null;
}

export function parsePriceData(payload: unknown): PriceData {
  const raw = isRecord(payload) ? payload : {};
  return {
    today: asNumber(raw.today_actual_price ?? raw.current_price ?? raw.modal_price),
    expected: asNumber(raw.local_predicted_price ?? raw.predicted_price ?? raw.predictedPrice ?? raw.expected_price),
    min: asNumber(raw.min_price ?? raw.minimum_price ?? raw.predicted_min),
    max: asNumber(raw.max_price ?? raw.maximum_price ?? raw.predicted_max),
    recommendation: typeof raw.recommendation === "string" && raw.recommendation.trim() ? raw.recommendation.trim() : null,
    raw: payload,
  };
}

export function formatINR(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `₹${value.toLocaleString("en-IN")}`;
}

export function formatPct(value: number | null | undefined): string | null {
  if (value == null || !Number.isFinite(value)) return null;
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function trendOf(data: PriceData | null): { up: boolean; pct: string | null } {
  if (data && data.today != null && data.expected != null && data.today !== 0) {
    const diff = data.expected - data.today;
    return { up: diff >= 0, pct: formatPct((diff / data.today) * 100) };
  }
  return { up: true, pct: null };
}

export interface MarketRow {
  query: PriceQuery;
  label: string;
  market: string;
  data: PriceData | null;
  status: "loading" | "ok" | "error";
}

export function useMarketRows(queries: PriceQuery[]) {
  const [rows, setRows] = useState<MarketRow[]>(() =>
    queries.map((q) => ({ query: q, label: q.commodity, market: q.district, data: null, status: "loading" as const })),
  );
  const [queriesState, setQueriesState] = useState(queries);
  const [tick, setTick] = useState(0);

  if (queries !== queriesState) {
    setQueriesState(queries);
    setRows(queries.map((q) => ({ query: q, label: q.commodity, market: q.district, data: null, status: "loading" as const })));
  }

  useEffect(() => {
    let active = true;

    void Promise.all(
      queries.map(async (query) => {
        try {
          const res = await getPricePrediction(query);
          return { query, label: query.commodity, market: query.district, data: parsePriceData(res.data), status: "ok" as const };
        } catch {
          return { query, label: query.commodity, market: query.district, data: null, status: "error" as const };
        }
      }),
    ).then((results) => {
      if (active) setRows(results);
    });

    return () => {
      active = false;
    };
  }, [queries, tick]);

  return { rows, refresh: () => setTick((t) => t + 1) };
}

export interface PredictionState {
  loading: boolean;
  data: PriceData | null;
  error: string | null;
}

export function usePrediction(query: PriceQuery | null): PredictionState {
  const [queryState, setQueryState] = useState<PriceQuery | null>(query);
  const [state, setState] = useState<PredictionState>({ loading: query !== null, data: null, error: null });

  if (query !== queryState) {
    setQueryState(query);
    setState({ loading: query !== null, data: null, error: null });
  }

  useEffect(() => {
    if (!query) return;
    let active = true;
    getPricePrediction(query)
      .then((res) => {
        if (active) setState({ loading: false, data: parsePriceData(res.data), error: null });
      })
      .catch((err) => {
        if (active) {
          setState({
            loading: false,
            data: null,
            error: err instanceof Error ? err.message : "Could not fetch prices. Please try again.",
          });
        }
      });
    return () => {
      active = false;
    };
  }, [query]);

  return state;
}