export interface PriceQuery {
  state: string;
  district: string;
  commodity: string;
  grade: string;
}

export interface PricePredictionResponse {
  data?: unknown;
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
  });

  if (!res.ok) {
    throw new Error(`The price service returned an error (HTTP ${res.status}).`);
  }

  return (await res.json()) as PricePredictionResponse;
}