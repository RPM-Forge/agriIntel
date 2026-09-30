import { Types } from "mongoose";
import {
  getFpoCollections,
  stateDemoPoolForLot,
  poolMatchesLot,
  publicLot,
  sameText,
  verifiedFpoMatchesLot,
  type FpoLotRecord,
} from "@/lib/fpo";
import { getSessionUser, serverErrorResponse, unauthorizedResponse } from "@/lib/apiSession";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorizedResponse();

    const url = new URL(request.url);
    const lotId = url.searchParams.get("lotId") ?? "";
    const kind = url.searchParams.get("kind");
    if (!Types.ObjectId.isValid(lotId)) return Response.json({ error: "Choose a valid lot." }, { status: 400 });
    if (kind !== "verified" && kind !== "pools") return Response.json({ error: "Choose a valid match type." }, { status: 400 });

    const { users, verifiedFpos, demandPools } = await getFpoCollections();
    const seller = await users.findOne(
      { _id: new Types.ObjectId(user.id), "lots._id": new Types.ObjectId(lotId) },
      { projection: { lots: 1 } },
    );
    const lot = seller?.lots?.find((candidate) => String(candidate._id) === lotId) as FpoLotRecord | undefined;
    if (!lot) return Response.json({ error: "Lot not found." }, { status: 404 });

    if (kind === "verified") {
      const fpos = await verifiedFpos.find({ active: true }).toArray();
      const data = fpos
        .filter((fpo) => verifiedFpoMatchesLot(fpo, lot))
        .sort((left, right) => {
          const leftExactDistrict = left.serviceAreas.some(
            (area) => sameText(area.state, lot.state) && area.districts.some((district) => sameText(district, lot.district)),
          );
          const rightExactDistrict = right.serviceAreas.some(
            (area) => sameText(area.state, lot.state) && area.districts.some((district) => sameText(district, lot.district)),
          );
          return Number(rightExactDistrict) - Number(leftExactDistrict);
        })
        .map((fpo) => ({
          id: String(fpo._id),
          name: fpo.name,
          registrationNumber: fpo.registrationNumber,
          contactName: fpo.contactName,
          phone: fpo.phone,
          email: fpo.email,
          matchingLocation: lot.district,
        }));
      return Response.json({ data, lot: publicLot(lot) });
    }

    const statePool = stateDemoPoolForLot(lot);
    const statePoolKey = new RegExp(`^${statePool.demoKey}(?:-|$)`);
    const availableStatePool = await demandPools.findOne({
      demoKey: { $regex: statePoolKey },
      status: "open",
      $expr: { $gt: ["$quantity", "$filledQuantity"] },
    }, { projection: { _id: 1 } });
    if (!availableStatePool) {
      const existingStatePool = await demandPools.findOne(
        { demoKey: { $regex: statePoolKey } },
        { projection: { _id: 1 } },
      );
      if (existingStatePool) {
        statePool.demoKey = `${statePool.demoKey}-${new Types.ObjectId().toHexString()}`;
      }
      await demandPools.updateOne(
        { demoKey: statePool.demoKey },
        { $setOnInsert: statePool },
        { upsert: true },
      );
    }

    const pools = await demandPools.find({ status: "open" }).toArray();
    const data = pools
      .filter((pool) => poolMatchesLot(pool, lot))
      .sort((left, right) => {
        const leftRemaining = left.quantity - left.filledQuantity;
        const rightRemaining = right.quantity - right.filledQuantity;
        const leftCanComplete = leftRemaining <= lot.availableQuantity;
        const rightCanComplete = rightRemaining <= lot.availableQuantity;
        if (leftCanComplete !== rightCanComplete) return Number(rightCanComplete) - Number(leftCanComplete);
        return right.filledQuantity / right.quantity - left.filledQuantity / left.quantity;
      })
      .map((pool) => ({
        id: String(pool._id),
        buyerName: pool.buyerName,
        crop: pool.crop,
        grade: pool.grade,
        state: pool.state === "*" ? lot.state : pool.state,
        districts: pool.demoKey?.startsWith("demo-state-") || pool.districts.includes("*")
          ? [lot.district]
          : pool.districts,
        quantity: pool.quantity,
        filledQuantity: pool.filledQuantity,
        remainingQuantity: pool.quantity - pool.filledQuantity,
        unit: pool.unit,
        maxPricePerUnit: pool.maxPricePerUnit,
        deliveryDate: pool.deliveryDate,
      }));
    return Response.json({ data, lot: publicLot(lot) });
  } catch (error) {
    return serverErrorResponse("find FPO matches", error);
  }
}
