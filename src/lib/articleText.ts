// This module used to also carry a large client-side content-exclusion
// filter (sports/crime/political/lifestyle keyword matching, blocked-domain
// lists, etc.) built for NewsAPI's general "everything" endpoint, which
// isn't finance-specific and needed heavy filtering. Marketaux is
// finance-news-only by design and doesn't need any of that, so it was
// removed along with the rest of the NewsAPI integration — this file is now
// just the one description-cleaning helper both sources' mappers rely on.

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
