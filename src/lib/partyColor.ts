import { BLOC_COLOR } from "@/data/types";
import type { FullParty, Party } from "@/data/types";

export function partyColor(party: FullParty | Party): string {
  if ("color" in party && party.color) return party.color;
  return BLOC_COLOR[party.bloc];
}
