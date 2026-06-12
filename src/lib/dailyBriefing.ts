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
      return sanitizeBriefingBullets(parsed.bullets);
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
      bullets: sanitizeBriefingBullets(bullets),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* storage blocked */
  }
}

export function stripBriefingMarkdown(text: string): string {
  let result = text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .trim();

  result = result.replace(/^[^:]+:\s*/, "");
  result = result.replace(/^:\s*/, "").replace(/\s*:$/, "").trim();

  return result;
}

export function sanitizeBriefingBullet(line: string): string {
  const trimmed = line.trim();
  const match = trimmed.match(
    /^([\s\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]+)\s*(.+)/u
  );
  if (match) {
    const emoji = match[1].trim();
    const text = stripBriefingMarkdown(match[2]);
    return text ? `${emoji} ${text}` : emoji;
  }
  return stripBriefingMarkdown(trimmed);
}

export function sanitizeBriefingBullets(bullets: string[]): string[] {
  return bullets.map(sanitizeBriefingBullet).filter(Boolean).slice(0, 4);
}

export function parseBriefingBullet(line: string): { emoji: string; text: string } {
  const sanitized = sanitizeBriefingBullet(line);
  const match = sanitized.match(
    /^([\s\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]+)\s*(.+)/u
  );
  if (match) {
    return { emoji: match[1].trim(), text: match[2].trim() };
  }
  return { emoji: "•", text: sanitized };
}
