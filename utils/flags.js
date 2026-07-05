/**
 * Flag assets for World Cup teams.
 *
 * SVG_FLAGS — teams that have a real SVG file in /public/flags/.
 * EMOJI_FLAGS — Unicode emoji fallback for all other nations.
 */

const SVG_FLAGS = {
  Argentina:   "/flags/Argentina.svg",
  Belgium:     "/flags/Belgium.svg",
  Brazil:      "/flags/Brazil.svg",
  Colombia:    "/flags/Colombia.svg",
  Egypt:       "/flags/Egypt.svg",
  England:     "/flags/England.svg",
  France:      "/flags/France.svg",
  Mexico:      "/flags/Mexico.svg",
  Morocco:     "/flags/Morocco.svg",
  Norway:      "/flags/Norway.svg",
  Portugal:    "/flags/Portugal.svg",
  Spain:       "/flags/Spain.svg",
  Switzerland: "/flags/Switzerland.svg",
  USA:         "/flags/USA.svg",
};

const EMOJI_FLAGS = {
  Australia:      "🇦🇺",
  Canada:         "🇨🇦",
  Croatia:        "🇭🇷",
  Ecuador:        "🇪🇨",
  Germany:        "🇩🇪",
  Ghana:          "🇬🇭",
  Iran:           "🇮🇷",
  "Ivory Coast":  "🇨🇮",
  Japan:          "🇯🇵",
  Netherlands:    "🇳🇱",
  Paraguay:       "🇵🇾",
  Poland:         "🇵🇱",
  Qatar:          "🇶🇦",
  "Saudi Arabia": "🇸🇦",
  Senegal:        "🇸🇳",
  Serbia:         "🇷🇸",
  "South Korea":  "🇰🇷",
  Tunisia:        "🇹🇳",
  Uruguay:        "🇺🇾",
  Wales:          "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
};

/**
 * Returns the public path to the team's SVG flag, or null if not available.
 * @param {string} teamName
 * @returns {string | null}
 */
export function getFlagSrc(teamName) {
  return SVG_FLAGS[teamName] ?? null;
}

/**
 * Returns the emoji flag for a team, or a neutral flag if unknown.
 * @param {string} teamName
 * @returns {string}
 */
export function getFlagEmoji(teamName) {
  return EMOJI_FLAGS[teamName] ?? "🏳️";
}

/**
 * Legacy helper — still used in admin table for plain text contexts.
 * Returns SVG path if available, otherwise emoji.
 * @param {string} teamName
 * @returns {string}
 */
export function getFlag(teamName) {
  return SVG_FLAGS[teamName] ?? EMOJI_FLAGS[teamName] ?? "🏳️";
}
