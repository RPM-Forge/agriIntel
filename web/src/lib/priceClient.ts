export interface PriceQuery {
  state: string;
  district: string;
  commodity: string;
  grade: string;
}

export interface PricePredictionResponse {
  data?: unknown;
  error?: string;
}

export async function getPricePrediction(query: PriceQuery): Promise<PricePredictionResponse> {
  const params = new URLSearchParams({
    commodity: query.commodity,
    state: query.state,
    district: query.district,
    grade: query.grade,
  });

  const res = await fetch(`/api/ai/predict-price?${params.toString()}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  const payload = (await res.json().catch(() => ({}))) as PricePredictionResponse;

  if (!res.ok) {
    throw new Error(payload.error || `The price service returned an error (HTTP ${res.status}).`);
  }

  return payload;
}
