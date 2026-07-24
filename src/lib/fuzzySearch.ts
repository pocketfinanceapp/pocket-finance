function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const row = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = row[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = temp;
    }
  }
  return row[n];
}

function subsequenceMatch(query: string, text: string): boolean {
  let qi = 0;
  for (let i = 0; i < text.length && qi < query.length; i++) {
    if (text[i] === query[qi]) qi++;
  }
  return qi === query.length;
}

/**
 * Fuzzy match with substring, subsequence, and light typo tolerance.
 *
 * Subsequence and whole-field typo tolerance are ONLY applied to genuine
 * ticker-style fields passed via `symbolFields` (short, single-token
 * symbols like "AAPL") — never to free text like company names, sectors,
 * or headlines. A 4-letter query is a subsequence of almost any
 *20-40-character company name (e.g. "aapl" is a subsequence of "Applied
 * Industrial Technologies" and of "Atlassian Corporation Plc"), which
 * previously surfaced completely unrelated companies as top results for an
 * exact, well-known ticker search. Free-text fields only get an exact
 * substring check plus per-word prefix/typo matching, which is what
 * actually reflects "this text mentions the word I typed."
 */
export function fuzzyMatchesQuery(
  query: string,
  fields: string[],
  symbolFields: string[] = []
): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;

  for (const field of symbolFields) {
    const f = field.toLowerCase();
    if (!f) continue;
    if (f.includes(q)) return true;
    if (subsequenceMatch(q, f)) return true;
    if (q.length >= 2 && levenshtein(q, f) <= Math.max(1, Math.floor(q.length / 3))) {
      return true;
    }
  }

  for (const field of fields) {
    const f = field.toLowerCase();
    if (!f) continue;
    if (f.includes(q)) return true;

    for (const word of f.split(/\s+/)) {
      if (word.length < 2) continue;
      if (word.startsWith(q) || q.startsWith(word)) return true;
      // Scale the allowed edit distance with query length — a flat "<= 2"
      // was loose enough that a 4-letter ticker like "AAPL" would
      // typo-match unrelated 4-letter words (e.g. "Call" in an unrelated
      // headline), surfacing wrong companies instead of "No matches."
      if (
        q.length >= 3 &&
        levenshtein(q, word) <= Math.max(1, Math.floor(q.length / 3))
      ) {
        return true;
      }
    }
  }

  return false;
}
