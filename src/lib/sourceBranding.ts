export interface SourceBrand {
  name: string;
  abbr: string;
  color: string;
  textColor?: string;
  logoUrl?: string;
}

const KNOWN_SOURCES: Record<string, Omit<SourceBrand, "name">> = {
  cnbc: { abbr: "CN", color: "#005594" },
  reuters: { abbr: "R", color: "#ff8000" },
  bloomberg: { abbr: "BB", color: "#2800d7" },
  "the-wall-street-journal": { abbr: "WSJ", color: "#0274b6" },
  "wall-street-journal": { abbr: "WSJ", color: "#0274b6" },
  "business-insider": { abbr: "BI", color: "#002aff" },
  "financial-times": { abbr: "FT", color: "#fcd0b5", logoUrl: undefined },
  "the-verge": { abbr: "V", color: "#520420" },
  "associated-press": { abbr: "AP", color: "#ff322e" },
  "abc-news": { abbr: "ABC", color: "#ffcc00" },
  "cnn": { abbr: "CNN", color: "#cc0000" },
  "bbc-news": { abbr: "BBC", color: "#bb1919" },
  "fortune": { abbr: "F", color: "#1a1a2e", textColor: "#c9a84c" },
  "forbes": { abbr: "F", color: "#2d2d2d", textColor: "#c9a84c" },
  "axios": { abbr: "AX", color: "#ff4136", textColor: "#ffffff" },
  "thestreet": { abbr: "TS", color: "#003087", textColor: "#ffffff" },
  "the-street": { abbr: "TS", color: "#003087", textColor: "#ffffff" },
  "techcrunch": { abbr: "TC", color: "#0a8935" },
  "the-washington-post": { abbr: "WP", color: "#231f20" },
  "ars-technica": { abbr: "AT", color: "#ff4500" },
  "engadget": { abbr: "E", color: "#000000" },
  "marketwatch": { abbr: "MW", color: "#00ac4e" },
  "yahoo-finance": { abbr: "YF", color: "#6001d2" },
  "investing-com": { abbr: "INV", color: "#0d926e" },
};

const NAME_ALIASES: Record<string, string> = {
  "the wall street journal": "wall-street-journal",
  "wall street journal": "wall-street-journal",
  "business insider": "business-insider",
  "financial times": "financial-times",
  "associated press": "associated-press",
  "abc news": "abc-news",
  "bbc news": "bbc-news",
  "yahoo finance": "yahoo-finance",
  "the street": "thestreet",
};

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function domainFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function resolveSourceBrand(
  sourceName: string,
  sourceId?: string | null,
  sourceUrl?: string
): SourceBrand {
  const name = sourceName.trim() || "News";
  const slug =
    sourceId?.toLowerCase() ||
    NAME_ALIASES[name.toLowerCase()] ||
    slugify(name);

  const known = KNOWN_SOURCES[slug];
  if (known) {
    return { name, ...known };
  }

  const domain = sourceUrl ? domainFromUrl(sourceUrl) : null;
  const logoUrl = domain
    ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
    : undefined;

  const words = name.split(/\s+/).filter(Boolean);
  const abbr =
    words.length >= 2
      ? (words[0][0] + words[1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();

  const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const hues = ["#1e3a5f", "#5c4033", "#2d5016", "#4a1942", "#8b4513"];
  const color = hues[hash % hues.length];

  return { name, abbr, color, logoUrl };
}

export function extractSourceFromTitle(title: string): string | null {
  const match = title.match(/\s[-–—]\s([^-–—]+)$/);
  return match?.[1]?.trim() ?? null;
}

/** Remove trailing " - Publication Name" suffixes from news headlines */
export function cleanArticleTitle(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) return title;

  let cleaned = trimmed;
  const suffixPattern = /\s[-–—]\s+.+$/;

  while (suffixPattern.test(cleaned)) {
    const next = cleaned.replace(suffixPattern, "").trim();
    if (!next || next === cleaned) break;
    cleaned = next;
  }

  return cleaned || trimmed;
}
