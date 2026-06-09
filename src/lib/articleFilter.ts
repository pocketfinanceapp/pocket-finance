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
] as const;

export const BLOCKED_URL_PATTERNS = [
  "yahoo.com/entertainment",
  "nbcnews.com/news/us-news",
  "theguardian.com/lifeandstyle",
] as const;

export const BLOCKED_SOURCE_NAMES = ["yahoo entertainment"] as const;

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

/** Extra terms appended to NewsAPI NOT query */
export const NEWS_API_BLOCKED_TERMS =
  "kabc OR abc7 OR abc13 OR abc11 OR localtvwxyz OR nbcnews OR liveandletsfly";
