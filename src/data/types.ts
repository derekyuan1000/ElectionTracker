export type Bloc =
  | "farleft"
  | "left"
  | "centerleft"
  | "green"
  | "center"
  | "liberal"
  | "centerright"
  | "right"
  | "farright"
  | "regional"
  | "other";

export const BLOC_LABEL: Record<Bloc, string> = {
  farleft: "Far-Left",
  left: "Left",
  centerleft: "Centre-Left",
  green: "Green",
  center: "Centre",
  liberal: "Liberal",
  centerright: "Centre-Right",
  right: "Right",
  farright: "Far-Right",
  regional: "Regional",
  other: "Other",
};

export const BLOC_ORDER: Bloc[] = [
  "farleft",
  "left",
  "centerleft",
  "green",
  "liberal",
  "center",
  "centerright",
  "right",
  "farright",
  "regional",
  "other",
];

export const BLOC_COLOR: Record<Bloc, string> = {
  farleft: "var(--bloc-farleft)",
  left: "var(--bloc-left)",
  centerleft: "var(--bloc-centerleft)",
  green: "var(--bloc-green)",
  center: "var(--bloc-center)",
  liberal: "var(--bloc-liberal)",
  centerright: "var(--bloc-centerright)",
  right: "var(--bloc-right)",
  farright: "var(--bloc-farright)",
  regional: "var(--bloc-regional)",
  other: "var(--bloc-other)",
};

export type Country = {
  code: string; // url slug
  name: string;
  flag: string; // emoji
  system: string;
  parliamentSize: number;
  majorityThreshold: number;
  electoralThreshold: number; // % to enter parliament; 0 if none
  nextElection: string; // ISO date
  memberships: string[];
  systemBlurb: string;
  formationBlurb: string;
  democracyScore: number;
  democracyTrend: number[]; // last 10 years
  governmentType: string;
  turnoutTrend: number[];
  governingParties: string[]; // party ids
  headOfGovernment: {
    name: string;
    title: string;
    partyId: string;
    since: string;
    resignedDate?: string;
  };
};

export type Party = {
  id: string; // slug, unique
  countryCode: string;
  name: string;
  abbr: string;
  bloc: Bloc;
  euStance: "Pro-EU" | "Anti-EU" | "Neutral";
  leader: string;
  description: string;
};

export type PolicyCategory =
  | "Economy & State"
  | "Society & Values"
  | "Environment & Climate"
  | "Migration & Integration"
  | "Democracy & Institutions";

export const POLICY_CATEGORIES: PolicyCategory[] = [
  "Economy & State",
  "Society & Values",
  "Environment & Climate",
  "Migration & Integration",
  "Democracy & Institutions",
];

export type PartyExtra = {
  /** Explicit hex brand color. Falls back to BLOC_COLOR[bloc] when absent. */
  color?: string;
  /** -10 social/state ←→ +10 market */
  compassX: number;
  /** -10 progressive ←→ +10 conservative */
  compassY: number;
  /** -10 anti-EU ←→ +10 pro-EU */
  euStanceScore: number;
  /** Score per policy category, 0 (left/progressive) … 100 (right/conservative) */
  policy: Record<PolicyCategory, number>;
  /** Optional prior-cycle score for delta display. */
  policyPrev?: Partial<Record<PolicyCategory, number>>;
  /** Free-form spectrum label, e.g. "Centre-Right", "Right-wing populist" */
  spectrumLabel: string;
  /** Secondary tag like Liberal, Green, Regional, Animal Welfare, Satire */
  categoryTag?: string;
  /** Core demographic */
  targetVoter: string;
  /** Whether the party still contests elections */
  historical?: boolean;
  /** European Parliament group affiliation, or "No affiliated group" */
  euGroup: string;
  /** Whether the party appears in the topline poll breakdown */
  inPolls?: boolean;
  /** % time in government (UK history proxy) */
  govShareLifetime?: number;
  /** Past general-election vote share, sparse map of year → % */
  historicResults?: { year: number; pct: number; seats: number }[];
};

export type FullParty = Party & PartyExtra;

export type Institute = {
  id: string;
  countryCode: string;
  name: string;
  reliability: number; // 0–100
};

export type Poll = {
  id: string;
  countryCode: string;
  instituteId: string;
  fieldworkEnd: string; // ISO
  publishDate: string;
  sampleSize: number;
  electionType: "national" | "regional" | "EU";
  results: Record<string, number>; // partyId -> %
};

export type ElectionResult = {
  date: string;
  type: "national" | "regional" | "EU";
  turnout: number;
  results: { partyId: string; pct: number; seats: number }[];
  coalitionFormed: string[]; // party ids
};
