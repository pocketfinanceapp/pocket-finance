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

/** Fuzzy match with substring, subsequence, and light typo tolerance. */
export function fuzzyMatchesQuery(query: string, fields: string[]): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;

  for (const field of fields) {
    const f = field.toLowerCase();
    if (!f) continue;
    if (f.includes(q)) return true;
    if (subsequenceMatch(q, f)) return true;

    if (q.length >= 2 && levenshtein(q, f) <= Math.max(1, Math.floor(q.length / 3))) {
      return true;
    }

    for (const word of f.split(/\s+/)) {
      if (word.length < 2) continue;
      if (word.startsWith(q) || q.startsWith(word)) return true;
      if (q.length >= 3 && levenshtein(q, word) <= 2) return true;
    }
  }

  return false;
}
