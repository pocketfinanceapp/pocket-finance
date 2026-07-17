let regionNames: Intl.DisplayNames | null = null;

/**
 * ISO 3166-1 alpha-2 code -> English display name, using the browser/Node's
 * built-in locale data (no hardcoded country list to maintain — works for
 * any of the 80+ markets Marketaux might return).
 */
export function countryName(code: string): string {
  const upper = code.trim().toUpperCase();
  if (!upper) return code;
  if (upper === "EU") return "European Union";

  try {
    regionNames ??= new Intl.DisplayNames(["en"], { type: "region" });
    return regionNames.of(upper) ?? upper;
  } catch {
    return upper;
  }
}
