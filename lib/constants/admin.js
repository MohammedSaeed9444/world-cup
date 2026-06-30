/** Only this email may access /admin and mutate matches via RLS policies. */
export const ADMIN_EMAIL = "mohammedsaeed9444@gmail.com";

/** Common World Cup nations — used as datalist suggestions; free-text still allowed. */
export const WORLD_CUP_TEAMS = [
  "Argentina",
  "Australia",
  "Belgium",
  "Brazil",
  "Canada",
  "Colombia",
  "Croatia",
  "Ecuador",
  "England",
  "France",
  "Germany",
  "Ghana",
  "Iran",
  "Japan",
  "Mexico",
  "Morocco",
  "Netherlands",
  "Poland",
  "Portugal",
  "Qatar",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "South Korea",
  "Spain",
  "Switzerland",
  "Tunisia",
  "USA",
  "Uruguay",
  "Wales",
];

/** Preset offsets (minutes before kickoff) for prediction deadline. */
export const DEADLINE_OFFSET_OPTIONS = [
  { label: "1 minute before kickoff", value: 1 },
  { label: "5 minutes before kickoff", value: 5 },
  { label: "15 minutes before kickoff", value: 15 },
  { label: "30 minutes before kickoff", value: 30 },
  { label: "1 hour before kickoff", value: 60 },
  { label: "At kickoff (no early close)", value: 0 },
];
