import { Types } from "mongoose";
import { getSessionUser, isJsonRecord, serverErrorResponse, unauthorizedResponse } from "@/lib/apiSession";
import { ProduceLot } from "@/lib/models/ProduceLot";
import type { IProduceLot } from "@/lib/models/ProduceLot";

interface ProduceBody {
  crop?: unknown;
  grade?: unknown;
  quantity?: unknown;
  unit?: unknown;
  pricePerUnit?: unknown;
  location?: unknown;
  harvestDate?: unknown;
}

const UNITS = ["kg", "quintal", "tonne"] as const;

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorizedResponse();

    const url = new URL(request.url);
    const mine = url.searchParams.get("mine") === "true";
    const lots = mine
      ? await ProduceLot.find({ sellerId: new Types.ObjectId(user.id) }).sort({ createdAt: -1 }).lean()
      : await ProduceLot.find({ status: "available", availableQuantity: { $gt: 0 } }).sort({ createdAt: -1 }).lean();
    return Response.json({
      data: lots.map(({ _id, sellerId, ...lot }) => ({
        id: String(_id),
        sellerId: String(sellerId),
        ...lot,
      })),
    });
  } catch (error) {
    return serverErrorResponse("load produce", error);
  }
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!isJsonRecord(payload)) return Response.json({ error: "Invalid request body." }, { status: 400 });
  const body = payload as ProduceBody;
  const crop = typeof body.crop === "string" ? body.crop.trim() : "";
  const grade = typeof body.grade === "string" ? body.grade.trim() : "";
  const location = typeof body.location === "string" ? body.location.trim() : "";
  const quantity = Number(body.quantity);
  const pricePerUnit = Number(body.pricePerUnit);
  const unit = UNITS.find((option) => option === body.unit);
  const harvestDate =
    typeof body.harvestDate === "string" && body.harvestDate ? new Date(body.harvestDate) : undefined;

  if (!crop || crop.length > 80) return Response.json({ error: "Enter a crop name (up to 80 characters)." }, { status: 400 });
  if (!grade || grade.length > 40) return Response.json({ error: "Enter a crop grade (up to 40 characters)." }, { status: 400 });
  if (!location || location.length > 120) return Response.json({ error: "Enter a pickup location (up to 120 characters)." }, { status: 400 });
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 1_000_000) {
    return Response.json({ error: "Quantity must be greater than zero." }, { status: 400 });
  }
  if (!Number.isFinite(pricePerUnit) || pricePerUnit <= 0 || pricePerUnit > 1_000_000_000) {
    return Response.json({ error: "Price per unit must be greater than zero." }, { status: 400 });
  }
  if (!unit) {
    return Response.json({ error: "Choose a valid quantity unit." }, { status: 400 });
  }
  if (harvestDate && Number.isNaN(harvestDate.getTime())) {
    return Response.json({ error: "Choose a valid harvest date." }, { status: 400 });
  }

  try {
    const user = await getSessionUser();
    if (!user) return unauthorizedResponse();
    if (user.role !== "seller") return Response.json({ error: "Only sellers can list produce." }, { status: 403 });

    const lot = new ProduceLot({
      sellerId: new Types.ObjectId(user.id),
      crop,
      grade,
      quantity,
      availableQuantity: quantity,
      unit,
      pricePerUnit,
      location,
      status: "available",
      ...(harvestDate ? { harvestDate } : {}),
    } satisfies Omit<IProduceLot, "createdAt" | "updatedAt">);
    await lot.save();
    return Response.json(
      {
        data: {
          id: lot.id,
          sellerId: user.id,
          crop: lot.crop,
          grade: lot.grade,
          quantity: lot.quantity,
          availableQuantity: lot.availableQuantity,
          unit: lot.unit,
          pricePerUnit: lot.pricePerUnit,
          location: lot.location,
          harvestDate: lot.harvestDate,
          status: lot.status,
          createdAt: lot.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return serverErrorResponse("create produce listing", error);
  }
}
