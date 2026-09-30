import { COMMODITIES, GRADES, MARKET_LOCATIONS } from "@/lib/marketOptions";

export const FPO_CROPS = COMMODITIES;
export const FPO_GRADES = GRADES;
export const FPO_STATES = Object.keys(MARKET_LOCATIONS);

export function districtsForState(state: string): string[] {
  return MARKET_LOCATIONS[state] ?? [];
}

export function committeesForDistrict(district: string): string[] {
  return district ? [`${district} APMC`, `${district} Market Yard`] : [];
}

export function validFpoLocation(state: string, district: string, committee: string): boolean {
  const validDistrict = districtsForState(state).includes(district);
  return validDistrict && (!committee || committeesForDistrict(district).includes(committee));
}
