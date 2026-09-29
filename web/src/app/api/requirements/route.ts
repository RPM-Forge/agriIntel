import { Types } from "mongoose";
import { getSessionUser, isJsonRecord, serverErrorResponse, unauthorizedResponse } from "@/lib/apiSession";
import { BuyerRequirement } from "@/lib/models/BuyerRequirement";

interface RequirementBody {
  crop?: unknown;
  grade?: unknown;
  quantity?: unknown;
  unit?: unknown;
  maxPricePerUnit?: unknown;
  location?: unknown;
  neededBy?: unknown;
  notes?: unknown;
}

const UNITS = ["kg", "quintal", "tonne"] as const;

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorizedResponse();

    const requirements =
      user.role === "buyer"
        ? await BuyerRequirement.find({ buyerId: new Types.ObjectId(user.id) }).sort({ createdAt: -1 }).lean()
        : await BuyerRequirement.find({ status: "open" }).sort({ createdAt: -1 }).lean();

    return Response.json({
      data: requirements.map(({ _id, buyerId, ...requirement }) => ({
        id: String(_id),
        buyerId: String(buyerId),
        ...requirement,
      })),
    });
  } catch (error) {
    return serverErrorResponse("load crop requirements", error);
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
  const body = payload as RequirementBody;

  const crop = typeof body.crop === "string" ? body.crop.trim() : "";
  const grade = typeof body.grade === "string" ? body.grade.trim() : "";
  const location = typeof body.location === "string" ? body.location.trim() : "";
  const notes = typeof body.notes === "string" ? body.notes.trim() : "";
  const quantity = Number(body.quantity);
  const unit = UNITS.find((option) => option === body.unit);
  const maxPricePerUnit =
    body.maxPricePerUnit === "" || body.maxPricePerUnit === undefined || body.maxPricePerUnit === null
      ? undefined
      : Number(body.maxPricePerUnit);
  const neededBy =
    typeof body.neededBy === "string" && body.neededBy ? new Date(body.neededBy) : undefined;

  if (!crop || crop.length > 80) return Response.json({ error: "Enter a crop name (up to 80 characters)." }, { status: 400 });
  if (!grade || grade.length > 40) return Response.json({ error: "Enter a grade or quality requirement (up to 40 characters)." }, { status: 400 });
  if (!location || location.length > 120) return Response.json({ error: "Enter a delivery location (up to 120 characters)." }, { status: 400 });
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 1_000_000) {
    return Response.json({ error: "Required quantity must be greater than zero." }, { status: 400 });
  }
  if (!unit) return Response.json({ error: "Choose a valid quantity unit." }, { status: 400 });
  if (maxPricePerUnit !== undefined && (!Number.isFinite(maxPricePerUnit) || maxPricePerUnit <= 0 || maxPricePerUnit > 1_000_000_000)) {
    return Response.json({ error: "Maximum price per unit must be greater than zero." }, { status: 400 });
  }
  if (neededBy && Number.isNaN(neededBy.getTime())) return Response.json({ error: "Choose a valid needed-by date." }, { status: 400 });
  if (notes.length > 500) return Response.json({ error: "Additional details must be 500 characters or fewer." }, { status: 400 });

  try {
    const user = await getSessionUser();
    if (!user) return unauthorizedResponse();
    if (user.role !== "buyer") return Response.json({ error: "Only buyers can post crop requirements." }, { status: 403 });

    const requirement = new BuyerRequirement({
      buyerId: new Types.ObjectId(user.id),
      buyerName: user.name,
      crop,
      grade,
      quantity,
      unit,
      ...(maxPricePerUnit !== undefined ? { maxPricePerUnit } : {}),
      location,
      ...(neededBy ? { neededBy } : {}),
      notes,
      status: "open",
    });
    await requirement.save();

    return Response.json(
      {
        data: {
          id: requirement.id,
          buyerId: user.id,
          buyerName: requirement.buyerName,
          crop: requirement.crop,
          grade: requirement.grade,
          quantity: requirement.quantity,
          unit: requirement.unit,
          maxPricePerUnit: requirement.maxPricePerUnit,
          location: requirement.location,
          neededBy: requirement.neededBy,
          notes: requirement.notes,
          status: requirement.status,
          createdAt: requirement.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return serverErrorResponse("post crop requirement", error);
  }
}
