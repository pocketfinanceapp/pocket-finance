/** Shared article source blocklists for client filter + NewsAPI query */

export const BLOCKED_DOMAINS = [
  "gov.uk",
  "researchbuzz.me",
  "upworthy.com",
  "buzzfeed.com",
  "buzzfeednews.com",
  "boredpanda.com",
  "ladbible.com",
  "unilad.com",
  "gizmodo.com",
  "mashable.com",
  "mlive.com",
  "huffpost.com",
  "dailymail.co.uk",
  "tmz.com",
  "people.com",
  "peoplemag.com",
  "eonline.com",
  "usmagazine.com",
  "entertainment.yahoo.com",
  "kabc.com",
  "abc7.com",
  "abc13.com",
  "abc11.com",
  "localtvwxyz.com",
  "liveandletsfly.com",
  "theurbanist.org",
  "urbanist.org",
  "merck.com",
  "nhtsa.gov",
  "hollywoodreporter.com",
  "motortrend.com",
  "motor1.com",
  "eater.com",
  "theverge.com",
  "npr.org",
  "ew.com",
  "healthline.com",
  "webmd.com",
] as const;

export const BLOCKED_URL_PATTERNS = [
  "yahoo.com/entertainment",
  "nbcnews.com/news/us-news",
  "theguardian.com/lifeandstyle",
] as const;

export const BLOCKED_SOURCE_NAMES = [
  "yahoo entertainment",
  "entertainment weekly",
] as const;

export const BLOCKED_SOURCE_SLUGS = [
  "researchbuzz",
  "upworthy",
  "buzzfeed",
  "buzzfeednews",
  "boredpanda",
  "ladbible",
  "unilad",
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
  "kabc",
  "abc7",
  "abc13",
  "abc11",
  "localtvwxyz",
  "liveandletsfly",
  "merck",
  "nhtsa",
  "hollywoodreporter",
  "motortrend",
  "motor1",
  "eater",
  "theverge",
  "npr",
  "peoplemag",
  "healthline",
  "webmd",
  "ew",
] as const;

/** Crime / viral news title signals — excluded only when no finance keyword is present */
export const TITLE_CRIME_NON_FINANCE_PHRASES = [
  "arrested",
  "thrown food",
  "viral video",
  "police arrest",
  "charged with",
  "sentenced to",
] as const;

/** Travel scam / stowaway title signals — excluded only when no finance keyword is present */
export const TITLE_TRAVEL_NON_FINANCE_PHRASES = [
  "sneaks onto",
  "fake boarding pass",
  "flight with fake",
] as const;

/** Transit / urban planning title signals — excluded only when no finance keyword is present */
export const TITLE_TRANSIT_NON_FINANCE_PHRASES = [
  "light rail",
  "sound transit",
  "crosslake",
  "bus route",
  "transit system",
  "subway",
  "commuter rail",
] as const;

/** Title keywords that indicate non-finance stories */
export const TITLE_NON_FINANCE_KEYWORDS = [
  "recipe",
  "fashion",
  "celebrity",
  "movie review",
  "tv show",
  "sunscreen",
  "diet",
  "workout",
] as const;

/** Extra terms appended to NewsAPI NOT query */
export const NEWS_API_BLOCKED_TERMS =
  "kabc OR abc7 OR abc13 OR abc11 OR localtvwxyz OR nbcnews OR liveandletsfly OR merck.com OR nhtsa.gov OR hollywoodreporter.com OR motortrend.com OR motor1.com OR eater.com OR theverge.com OR npr.org OR peoplemag.com OR healthline.com OR webmd.com OR ew.com OR recipe OR fashion OR celebrity OR \"movie review\" OR \"tv show\" OR sunscreen OR diet OR workout";
