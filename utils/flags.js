/**
 * Country flag emoji map for World Cup nations.
 * Uses Unicode regional indicator symbols — no external dependencies.
 */
const FLAGS = {
  Argentina: "🇦🇷",
  Australia: "🇦🇺",
  Belgium: "🇧🇪",
  Brazil: "🇧🇷",
  Canada: "🇨🇦",
  Colombia: "🇨🇴",
  Croatia: "🇭🇷",
  Ecuador: "🇪🇨",
  England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  France: "🇫🇷",
  Germany: "🇩🇪",
  Ghana: "🇬🇭",
  Iran: "🇮🇷",
  "Ivory Coast": "🇨🇮",
  Japan: "🇯🇵",
  Mexico: "🇲🇽",
  Morocco: "🇲🇦",
  Netherlands: "🇳🇱",
  Norway: "🇳🇴",
  Paraguay: "🇵🇾",
  Poland: "🇵🇱",
  Portugal: "🇵🇹",
  Qatar: "🇶🇦",
  "Saudi Arabia": "🇸🇦",
  Senegal: "🇸🇳",
  Serbia: "🇷🇸",
  "South Korea": "🇰🇷",
  Spain: "🇪🇸",
  Switzerland: "🇨🇭",
  Tunisia: "🇹🇳",
  USA: "🇺🇸",
  Uruguay: "🇺🇾",
  Wales: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
};

/**
 * Returns the flag emoji for a team name, or a neutral flag if unknown.
 * @param {string} teamName
 * @returns {string}
 */
export function getFlag(teamName) {
  return FLAGS[teamName] ?? "🏳️";
}
