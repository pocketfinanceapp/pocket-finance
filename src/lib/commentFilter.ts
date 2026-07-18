/**
 * Basic pre-post filter for comments — deliberately lightweight ("basic
 * moderation" scope, not a full trust-and-safety pipeline). Catches the
 * obvious, common cases before they ever hit the database:
 *   - a short list of severe profanity/slurs
 *   - spam patterns (links, phone/messaging handles, "guaranteed returns"
 *     hype typical of pump-and-dump comment spam)
 *   - shouty low-effort flooding (all-caps, repeated-character spam)
 *
 * This is a client-side check, not a security boundary — a determined bad
 * actor could bypass it by calling Supabase directly. Paired with the
 * report-based auto-hide in userInteractions.ts, which is the actual
 * backstop once content is live.
 */

// Kept short and deliberately blunt — this is meant to catch clearly
// disallowed language, not police borderline word choices.
const BLOCKED_WORDS = [
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "cunt",
  "faggot",
  "nigger",
  "nigga",
  "retard",
  "whore",
  "slut",
  "kys",
];

const SPAM_PATTERNS: RegExp[] = [
  /https?:\/\/\S+/i,
  /\bwww\.\S+\.\S+/i,
  /\bt\.me\/\S+/i,
  /\bwa\.me\/\S+/i,
  /\bdiscord\.gg\/\S+/i,
  /\bguaranteed\s+returns?\b/i,
  /\b(100|1000)%\s*(profit|returns?|gains?)\b/i,
  /\bdm\s+me\s+(now|to)\b/i,
  /\btelegram\b.*\bsignal/i,
  /\bfree\s+crypto\b/i,
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    // collapse simple leetspeak substitutions so "fuuu*ck" / "f*ck" style
    // dodges still get caught without over-matching real words.
    .replace(/[^a-z0-9\s]/g, "");
}

function containsBlockedWord(normalized: string): boolean {
  return BLOCKED_WORDS.some((word) => {
    const re = new RegExp(`\\b${word}\\b`, "i");
    return re.test(normalized);
  });
}

function isShoutyFlood(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 12) return false;

  const letters = trimmed.replace(/[^a-zA-Z]/g, "");
  const upperRatio =
    letters.length > 0
      ? letters.replace(/[^A-Z]/g, "").length / letters.length
      : 0;
  if (letters.length >= 12 && upperRatio > 0.85) return true;

  // Same character repeated 6+ times in a row ("aaaaaaaa", "!!!!!!!!").
  if (/(.)\1{5,}/.test(trimmed)) return true;

  return false;
}

export interface CommentFilterResult {
  blocked: boolean;
  reason?: string;
}

export function isDisallowedComment(text: string): CommentFilterResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { blocked: true, reason: "Comment can't be empty." };
  }

  const normalized = normalize(trimmed);

  if (containsBlockedWord(normalized)) {
    return {
      blocked: true,
      reason: "That comment isn't allowed here — please keep it respectful.",
    };
  }

  if (SPAM_PATTERNS.some((re) => re.test(trimmed))) {
    return {
      blocked: true,
      reason: "Links and promotional content aren't allowed in comments.",
    };
  }

  if (isShoutyFlood(trimmed)) {
    return {
      blocked: true,
      reason: "Please avoid all-caps or repeated-character spam.",
    };
  }

  return { blocked: false };
}
