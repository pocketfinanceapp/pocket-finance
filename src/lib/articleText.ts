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

const BLOCKED_DOMAINS = [
  "gov.uk",
  "researchbuzz.me",
  "buzzfeed.com",
  "gizmodo.com",
  "mashable.com",
  "mlive.com",
  "huffpost.com",
  "dailymail.co.uk",
  "tmz.com",
  "people.com",
  "eonline.com",
  "usmagazine.com",
  "entertainment.yahoo.com",
] as const;

const BLOCKED_URL_PATTERNS = ["yahoo.com/entertainment"] as const;

const BLOCKED_SOURCE_NAMES = ["yahoo entertainment"] as const;

const BLOCKED_SOURCE_SLUGS = [
  "researchbuzz",
  "buzzfeed",
  "gizmodo",
  "mashable",
  "mlive",
  "huffpost",
  "dailymail",
  "tmz",
  "people",
  "eonline",
  "usmagazine",
  "yahoo-entertainment",
] as const;

const TITLE_EXCLUDED_PHRASES = [
  "pm remarks",
  "prime minister remarks",
  "government statement",
  "plane crash",
  "flight accident",
  "jet crash",
] as const;

const AVIATION_INCIDENT_WORDS = [
  "aircraft",
  "copilot",
  "runway",
  "landing gear",
] as const;

const AVIATION_FINANCE_ALLOW_RE =
  /\b(airline|aviation)\s+(stocks?|earnings|shares|revenue|profits?|quarter|results|invest(ing|ment|or)?|outlook|forecast)\b/i;

const TITLE_EXCLUDED_WORDS = [
  "troops",
  "military",
  "war",
  "attack",
  "missile",
  "killed",
  "death",
  "hospital",
  "earthquake",
  "hurricane",
  "shooting",
] as const;

/** Political / legal title signals — excluded only when no finance keyword is present */
const TITLE_POLITICAL_LEGAL_PHRASES = [
  "supreme court",
  "scotus",
  "federal court",
  "appeals court",
  "district court",
  "lawsuit filed",
  "congress passed",
  "senate voted",
  "house voted",
  "white house says",
] as const;

const TITLE_POLITICAL_LEGAL_WORDS = [
  "ruling",
  "indicted",
  "convicted",
  "sentenced",
  "impeach",
] as const;

/** Finance keywords that keep political/legal titles when present in the headline */
const TITLE_FINANCE_ALLOW_RE =
  /\b(stocks?|shares|earnings|revenue|market|investors?|trading|ipo|sec\b|fed\b|rates?|inflation)\b/i;

/** Consumer / product safety title signals — excluded only when no finance keyword is present */
const TITLE_CONSUMER_RECALL_PHRASES = [
  "recalled for",
  "contamination",
  "baby wipes",
  "food recall",
  "health warning",
  "product recall",
] as const;

const OTHER_EXCLUDED_WORDS = [
  "accident",
  "accidents",
  "murder",
  "celebrity",
  "concert",
  "tornado",
] as const;

const LIFESTYLE_TOPIC_WORDS = [
  "gift guide",
  "life hack",
  "best deals",
  "how to",
  "gadget",
  "smartphone",
  "iphone",
  "android phone",
  "wearable",
  "streaming show",
  "tv show",
  "movie review",
  "recipe",
  "fitness tracker",
] as const;

const FINANCE_SIGNAL_RE =
  /\b(stock|stocks|market|markets|earnings|revenue|invest|investor|investing|finance|financial|nasdaq|nyse|asx|tsx|dividend|ipo|quarter|fiscal|shares|shareholder|trading|trader|crypto|bitcoin|ethereum|etf|mutual fund|hedge fund|bank|banking|fed\b|federal reserve|sec\b|s&p|portfolio|analyst|wall street|commodity|commodities|bond|yield|inflation|gdp|merger|acquisition|takeover)\b/i;

export interface ArticleFilterInput {
  title: string;
  description?: string;
  url?: string;
  sourceName?: string;
  sourceId?: string | null;
  content?: string | null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function isBlockedDomain(url: string, sourceName = "", sourceId?: string | null): boolean {
  const domain = domainFromUrl(url);
  const urlLower = url.toLowerCase();
  const sourceBlob = `${sourceName} ${sourceId ?? ""} ${url}`.toLowerCase();

  for (const pattern of BLOCKED_URL_PATTERNS) {
    if (urlLower.includes(pattern)) return true;
  }

  for (const blocked of BLOCKED_DOMAINS) {
    if (domain === blocked || domain.endsWith(`.${blocked}`) || domain.includes(blocked)) {
      return true;
    }
    if (sourceBlob.includes(blocked)) return true;
  }

  for (const name of BLOCKED_SOURCE_NAMES) {
    if (sourceName.toLowerCase().includes(name)) return true;
  }

  for (const slug of BLOCKED_SOURCE_SLUGS) {
    if (sourceId?.toLowerCase().includes(slug)) return true;
    if (sourceName.toLowerCase().includes(slug)) return true;
  }

  return false;
}

function hasFinanceSignals(text: string): boolean {
  return FINANCE_SIGNAL_RE.test(text);
}

function hasTitleFinanceAllowKeywords(title: string): boolean {
  return TITLE_FINANCE_ALLOW_RE.test(title);
}

function isPoliticalLegalNonFinanceTitle(title: string): boolean {
  if (hasTitleFinanceAllowKeywords(title)) return false;

  const lower = title.toLowerCase();

  for (const phrase of TITLE_POLITICAL_LEGAL_PHRASES) {
    if (lower.includes(phrase)) return true;
  }

  for (const word of TITLE_POLITICAL_LEGAL_WORDS) {
    const re = new RegExp(`\\b${escapeRegExp(word)}(?:ment)?\\b`, "i");
    if (re.test(title)) return true;
  }

  return false;
}

function isConsumerRecallNonFinanceTitle(title: string): boolean {
  if (hasTitleFinanceAllowKeywords(title)) return false;

  const lower = title.toLowerCase();
  return TITLE_CONSUMER_RECALL_PHRASES.some((phrase) => lower.includes(phrase));
}

function isNonFinancialPrRelease(input: ArticleFilterInput): boolean {
  const blob = [
    input.title,
    input.description ?? "",
    input.content ?? "",
    input.sourceName ?? "",
    input.url ?? "",
  ]
    .join(" ")
    .toLowerCase();

  const isPrWire =
    blob.includes("prnewswire") ||
    blob.includes("pr newswire") ||
    blob.includes("/prnewswire/");

  if (!isPrWire) return false;
  return !hasFinanceSignals(blob);
}

function isTechcrunchLifestyle(input: ArticleFilterInput): boolean {
  const source = `${input.sourceName ?? ""} ${input.sourceId ?? ""}`.toLowerCase();
  if (!source.includes("techcrunch")) return false;

  const title = input.title.toLowerCase();
  const hasLifestyleTopic = LIFESTYLE_TOPIC_WORDS.some((topic) =>
    title.includes(topic)
  );

  return hasLifestyleTopic && !hasFinanceSignals(title);
}

function isAviationFinanceTitle(title: string): boolean {
  if (AVIATION_FINANCE_ALLOW_RE.test(title)) return true;
  return (
    hasFinanceSignals(title) &&
    /\b(airline|aviation)\b/i.test(title) &&
    !/\b(crash|accident|incident|emergency|wreckage|victim|killed|death)\b/i.test(
      title
    )
  );
}

function titleContainsExcludedTopic(title: string): boolean {
  const lower = title.toLowerCase();

  if (isPoliticalLegalNonFinanceTitle(title)) return true;

  if (isConsumerRecallNonFinanceTitle(title)) return true;

  if (!isAviationFinanceTitle(title)) {
    for (const word of AVIATION_INCIDENT_WORDS) {
      const re = new RegExp(`\\b${escapeRegExp(word)}\\b`, "i");
      if (re.test(title)) return true;
    }
  }

  for (const phrase of TITLE_EXCLUDED_PHRASES) {
    if (lower.includes(phrase)) return true;
  }

  for (const word of TITLE_EXCLUDED_WORDS) {
    const re = new RegExp(`\\b${escapeRegExp(word)}\\b`, "i");
    if (re.test(title)) return true;
  }

  return false;
}

/** Client-side filter — drop off-topic, blocked-source, and non-finance articles */
export function isExcludedArticle(input: ArticleFilterInput): boolean {
  const title = input.title ?? "";
  const description = input.description ?? "";
  const text = `${title} ${description}`.toLowerCase();

  if (isBlockedDomain(input.url ?? "", input.sourceName ?? "", input.sourceId)) {
    return true;
  }

  if (titleContainsExcludedTopic(title)) return true;

  if (isNonFinancialPrRelease(input)) return true;

  if (isTechcrunchLifestyle(input)) return true;

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
