const SPORTS_PHRASES = [
  "travis kelce",
  "premier league",
  "super bowl",
  "world cup",
] as const;

const SPORTS_WORDS = [
  "nfl",
  "nba",
  "mlb",
  "nhl",
  "fifa",
  "soccer",
  "football",
  "basketball",
  "baseball",
  "hockey",
  "tennis",
  "golf",
  "olympics",
  "quarterback",
  "touchdown",
  "mvp",
  "playoff",
  "playoffs",
  "championship",
  "chiefs",
  "lakers",
  "yankees",
  "kelce",
] as const;

const OTHER_EXCLUDED_WORDS = [
  "accident",
  "accidents",
  "murder",
  "shooting",
  "celebrity",
  "concert",
  "hurricane",
  "tornado",
] as const;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Client-side filter — drop sports and other off-topic articles */
export function isExcludedArticle(title: string, description = ""): boolean {
  const text = `${title} ${description}`.toLowerCase();

  for (const phrase of SPORTS_PHRASES) {
    if (text.includes(phrase)) return true;
  }

  for (const word of SPORTS_WORDS) {
    const re = new RegExp(`\\b${escapeRegExp(word)}\\b`, "i");
    if (re.test(text)) return true;
  }

  for (const word of OTHER_EXCLUDED_WORDS) {
    const re = new RegExp(`\\b${escapeRegExp(word)}\\b`, "i");
    if (re.test(text)) return true;
  }

  return false;
}

const MONTH =
  "(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)";

/** "TOKYO and SANTA CLARA, Calif., June 5, 2026 /PRNewswire/ --" */
const PR_WIRE_DATELINE = new RegExp(
  `^[A-Z0-9][\\w\\s,&.'()/~-]+(?:\\s+and\\s+[\\w\\s,&.'()/~-]+)?,\\s*(?:[A-Za-z.\\s]+,\\s+)?${MONTH}\\s+\\d{1,2},\\s+\\d{4}\\s*\\/[A-Za-z]+\\/\\s*--+?\\s*`,
  "i"
);

/** "NEW YORK, June 5, 2026 --" */
const CITY_DATELINE = new RegExp(
  `^[A-Z][A-Za-z\\s,&.'()-]+,\\s*${MONTH}\\s+\\d{1,2},\\s+\\d{4}\\s*--+?\\s*`,
  "i"
);

const MIN_DESCRIPTION_LENGTH = 20;

/** Strip press-release datelines and wire boilerplate from descriptions */
export function cleanArticleDescription(description: string): string {
  let text = description.trim();
  if (!text) return "";

  for (let i = 0; i < 3; i++) {
    const next = text
      .replace(PR_WIRE_DATELINE, "")
      .replace(CITY_DATELINE, "")
      .trim();
    if (next === text) break;
    text = next;
  }

  return text.length < MIN_DESCRIPTION_LENGTH ? "" : text;
}
