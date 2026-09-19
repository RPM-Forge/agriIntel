const STATE_ALIASES: Record<string, string> = {
  Delhi: "NCT of Delhi",
  "NCT of Delhi": "NCT of Delhi",
  Chhattisgarh: "Chattisgarh",
};

function pickDetail(payload: unknown, fallback: string): string {
  if (typeof payload === "string" && payload.trim()) return payload;
  if (!payload || typeof payload !== "object") return fallback;
  const record = payload as { detail?: unknown; error?: unknown };
  if (typeof record.detail === "string" && record.detail.trim()) return record.detail;
  if (typeof record.error === "string" && record.error.trim()) return record.error;
  if (Array.isArray(record.detail)) {
    return record.detail
      .map((item) =>
        item && typeof item === "object" && "msg" in item
          ? String((item as { msg: unknown }).msg)
          : String(item),
      )
      .join(" ");
  }
  return fallback;
}

export async function GET(req: Request) {
  const base = (process.env.AI_SERVICE_URL ?? "http://127.0.0.1:8001").trim().replace(/\/$/, "");
  const { searchParams } = new URL(req.url);

  const commodity = (searchParams.get("commodity") ?? "").trim();
  const stateRaw = (searchParams.get("state") ?? "").trim();
  const district = (searchParams.get("district") ?? "").trim();
  const grade = (searchParams.get("grade") ?? "").trim();
  const state = STATE_ALIASES[stateRaw] ?? stateRaw;

  if (!commodity || !state) {
    return Response.json({ error: "Commodity and state are required." }, { status: 400 });
  }

  const params = new URLSearchParams({ commodity, state });
  if (district) params.set("district", district);
  if (grade) params.set("grade", grade);

  try {
    const res = await fetch(`${base}/predict-price?${params.toString()}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    const text = await res.text();
    let payload: unknown = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = { detail: text || `The price model returned HTTP ${res.status}.` };
    }

    if (!res.ok) {
      return Response.json(
        { error: pickDetail(payload, `The price model returned HTTP ${res.status}.`) },
        { status: res.status },
      );
    }

    return Response.json({ data: payload });
  } catch {
    return Response.json(
      {
        error: `Cannot reach the price model at ${base}. Make sure it is running (port 8001).`,
      },
      { status: 502 },
    );
  }
}
