import type { Comment } from "./types";

const SAMPLE_USERS = [
  { username: "alpha_trader", avatar: "AT", color: "#3b82f6" },
  { username: "bullrun_22", avatar: "BR", color: "#22c55e" },
  { username: "chart_wizard", avatar: "CW", color: "#a855f7" },
  { username: "dividend_queen", avatar: "DQ", color: "#ec4899" },
  { username: "macro_mike", avatar: "MM", color: "#f59e0b" },
  { username: "value_hunter", avatar: "VH", color: "#06b6d4" },
];

const TEMPLATES: Record<string, string[]> = {
  NVDA: [
    "Blackwell demand is insane. This run has legs.",
    "P/E is stretched but AI capex cycle supports it imo.",
    "Added on the dip last week. Not selling.",
    "Semis leadership intact — NVDA still the bellwether.",
  ],
  default: [
    "Solid read. Watching price action at open.",
    "Earnings season could be the real catalyst here.",
    "Macro still noisy but this name looks strong.",
    "Anyone else adding to their position?",
    "Volume picking up — something might be brewing.",
  ],
};

export function getCommentsForArticle(
  articleId: string,
  ticker: string
): Comment[] {
  const pool = TEMPLATES[ticker] ?? TEMPLATES.default;
  const times = ["2m ago", "8m ago", "24m ago", "1h ago", "3h ago", "5h ago"];

  return pool.slice(0, 5).map((text, i) => {
    const user = SAMPLE_USERS[i % SAMPLE_USERS.length];
    return {
      id: `${articleId}-c${i}`,
      username: user.username,
      avatar: user.avatar,
      avatarColor: user.color,
      text,
      timeAgo: times[i],
    };
  });
}

export function createComment(
  username: string,
  text: string
): Comment {
  return {
    id: `new-${Date.now()}`,
    username,
    avatar: username.slice(0, 2).toUpperCase(),
    avatarColor: "#00c9b7",
    text,
    timeAgo: "Just now",
  };
}
