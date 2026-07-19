import { countryName } from "./countryNames";

export interface CoveredCountry {
  countryCode: string;
  regionLabel: string;
}

/**
 * Static "Browse by region" fallback shown only when the live
 * /api/marketaux/trending-countries endpoint is unavailable.
 *
 * Every code below is confirmed present in Marketaux's actual supported
 * `locale`/`countries` list (54 countries total) — unlike the old
 * exchange-based fallback, nothing here can lead to an empty feed.
 * Grouped and ordered by the regions Marketaux covers best.
 */
export const COVERED_COUNTRIES: CoveredCountry[] = [
  // North America
  { countryCode: "us", regionLabel: "North America" },
  { countryCode: "ca", regionLabel: "North America" },
  { countryCode: "mx", regionLabel: "North America" },

  // Europe
  { countryCode: "gb", regionLabel: "Europe" },
  { countryCode: "de", regionLabel: "Europe" },
  { countryCode: "fr", regionLabel: "Europe" },
  { countryCode: "it", regionLabel: "Europe" },
  { countryCode: "es", regionLabel: "Europe" },
  { countryCode: "nl", regionLabel: "Europe" },
  { countryCode: "ie", regionLabel: "Europe" },
  { countryCode: "at", regionLabel: "Europe" },
  { countryCode: "be", regionLabel: "Europe" },
  { countryCode: "ch", regionLabel: "Europe" },
  { countryCode: "pl", regionLabel: "Europe" },
  { countryCode: "pt", regionLabel: "Europe" },
  { countryCode: "gr", regionLabel: "Europe" },
  { countryCode: "cz", regionLabel: "Europe" },
  { countryCode: "bg", regionLabel: "Europe" },
  { countryCode: "hr", regionLabel: "Europe" },
  { countryCode: "ro", regionLabel: "Europe" },
  { countryCode: "ru", regionLabel: "Europe" },
  { countryCode: "ua", regionLabel: "Europe" },
  { countryCode: "tr", regionLabel: "Europe" },

  // South America
  { countryCode: "br", regionLabel: "South America" },
  { countryCode: "ar", regionLabel: "South America" },
  { countryCode: "cl", regionLabel: "South America" },
  { countryCode: "co", regionLabel: "South America" },
  { countryCode: "pe", regionLabel: "South America" },
  { countryCode: "ec", regionLabel: "South America" },
  { countryCode: "uy", regionLabel: "South America" },
  { countryCode: "ve", regionLabel: "South America" },
  { countryCode: "bo", regionLabel: "South America" },

  // East Asia
  { countryCode: "cn", regionLabel: "East Asia" },
  { countryCode: "jp", regionLabel: "East Asia" },
  { countryCode: "kr", regionLabel: "East Asia" },
  { countryCode: "hk", regionLabel: "East Asia" },
  { countryCode: "tw", regionLabel: "East Asia" },

  // Middle East
  { countryCode: "il", regionLabel: "Middle East" },
  { countryCode: "sa", regionLabel: "Middle East" },
  { countryCode: "qa", regionLabel: "Middle East" },
  { countryCode: "ir", regionLabel: "Middle East" },
  { countryCode: "sy", regionLabel: "Middle East" },
];

export function getCoveredCountryItems() {
  return COVERED_COUNTRIES.map((c) => ({
    countryCode: c.countryCode,
    title: countryName(c.countryCode),
    subtitle: c.regionLabel,
  }));
}
