import { Types } from "mongoose";
import { getSessionUser, isJsonRecord, serverErrorResponse, unauthorizedResponse } from "@/lib/apiSession";
import { BuyerRequirement } from "@/lib/models/BuyerRequirement";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!isJsonRecord(payload)) return Response.json({ error: "Invalid request body." }, { status: 400 });
  if (payload.status !== "closed") {
    return Response.json({ error: "Requirements can only be closed." }, { status: 400 });
  }

  try {
    const user = await getSessionUser();
    if (!user) return unauthorizedResponse();
    if (user.role !== "buyer") return Response.json({ error: "Only buyers can close requirements." }, { status: 403 });

    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) return Response.json({ error: "Requirement not found." }, { status: 404 });
    const requirement = await BuyerRequirement.findOneAndUpdate(
      { _id: id, buyerId: user.id, status: "open" },
      { $set: { status: "closed" } },
      { new: true },
    ).lean();
    if (!requirement) return Response.json({ error: "Requirement not found or already closed." }, { status: 404 });
    return Response.json({ data: { id: String(requirement._id), status: requirement.status } });
  } catch (error) {
    return serverErrorResponse("close crop requirement", error);
  }
}
