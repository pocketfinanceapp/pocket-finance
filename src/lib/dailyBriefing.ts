const STORAGE_KEY = "pf-daily-briefing";

export interface CachedDailyBriefing {
  date: string;
  bullets: string[];
}

export function getDailyBriefingDateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function formatDailyBriefingDate(date = new Date()): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function loadCachedDailyBriefing(): string[] | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CachedDailyBriefing;
    if (
      parsed.date === getDailyBriefingDateKey() &&
      Array.isArray(parsed.bullets) &&
      parsed.bullets.length >= 4
    ) {
      return parsed.bullets.slice(0, 4);
    }
  } catch {
    /* ignore corrupt cache */
  }

  return null;
}

export function saveCachedDailyBriefing(bullets: string[]): void {
  if (typeof window === "undefined") return;

  try {
    const payload: CachedDailyBriefing = {
      date: getDailyBriefingDateKey(),
      bullets: bullets.slice(0, 4),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* storage blocked */
  }
}

export function parseBriefingBullet(line: string): { emoji: string; text: string } {
  const trimmed = line.trim();
  const match = trimmed.match(
    /^([\s\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]+)\s*(.+)/u
  );
  if (match) {
    return { emoji: match[1].trim(), text: match[2].trim() };
  }
  return { emoji: "•", text: trimmed };
}
