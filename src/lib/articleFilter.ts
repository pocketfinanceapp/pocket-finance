/** Shared article source blocklists for client filter + NewsAPI query */

export const BLOCKED_DOMAINS = [
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
  "kabc.com",
  "abc7.com",
  "abc13.com",
  "abc11.com",
  "localtvwxyz.com",
] as const;

export const BLOCKED_URL_PATTERNS = [
  "yahoo.com/entertainment",
  "nbcnews.com/news/us-news",
] as const;

export const BLOCKED_SOURCE_NAMES = ["yahoo entertainment"] as const;

export const BLOCKED_SOURCE_SLUGS = [
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
  "kabc",
  "abc7",
  "abc13",
  "abc11",
  "localtvwxyz",
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

/** Extra terms appended to NewsAPI NOT query */
export const NEWS_API_BLOCKED_TERMS =
  "kabc OR abc7 OR abc13 OR abc11 OR localtvwxyz OR nbcnews";
