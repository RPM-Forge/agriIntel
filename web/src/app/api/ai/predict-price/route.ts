



export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const commodity = searchParams.get("commodity");
  const state = searchParams.get("state");
  const district = searchParams.get("district");
  const grade = searchParams.get("grade");

  const params = new URLSearchParams({
    commodity: commodity ?? "",
    state: state ?? "",
    ...(district && { district }),
    ...(grade && { grade }),
  });

  const res = await fetch(`${process.env.AI_SERVICE_URL}/predict-price?${params}`);
  const data = await res.json();
  return Response.json({ data });
}
