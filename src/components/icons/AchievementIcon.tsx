/** Custom vector icons for progression achievements — replaces emoji tiles. */

interface AchievementIconProps {
  id: string;
  className?: string;
  size?: number;
  unlocked?: boolean;
}

export function AchievementIcon({
  id,
  className = "",
  size = 18,
  unlocked = true,
}: AchievementIconProps) {
  const stroke = unlocked ? "currentColor" : "currentColor";
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    className,
    "aria-hidden": true as const,
  };

  switch (id) {
    case "first_briefing":
      return (
        <svg {...common}>
          <path
            d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"
            stroke={stroke}
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "news_regular":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" stroke={stroke} strokeWidth="1.75" />
          <path d="M7 8h10M7 12h10M7 16h6" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case "deep_reader":
      return (
        <svg {...common}>
          <path d="M4 19V5a2 2 0 012-2h12a2 2 0 012 2v14" stroke={stroke} strokeWidth="1.75" />
          <path d="M4 19c2-1 4-1 6 0s4 1 6 0" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" />
          <path d="M12 5v14" stroke={stroke} strokeWidth="1.75" />
        </svg>
      );
    case "century_club":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth="1.75" />
          <path
            d="M8 12h1.5v4H8M14.5 12H16v4h-1.5M10 9.5V8h4v1.5"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "news_obsessed":
      return (
        <svg {...common}>
          <path d="M5 6h14v12H5z" stroke={stroke} strokeWidth="1.75" />
          <path d="M8 10h8M8 14h5" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" />
          <path d="M9 3h6" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case "market_watcher":
      return (
        <svg {...common}>
          <path d="M4 18l4-6 4 3 5-8 3 5" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 20h16" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case "stock_follower":
      return (
        <svg {...common}>
          <path
            d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.3L12 15.8 7.2 17.8l.9-5.3L4.2 8.7l5.4-.8L12 3z"
            stroke={stroke}
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "market_explorer":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" stroke={stroke} strokeWidth="1.75" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case "first_steps":
      return (
        <svg {...common}>
          <path d="M12 20V10" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" />
          <path d="M8 14c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" />
          <path d="M9 6c.5-1.5 1.5-2 3-2s2.5.5 3 2" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case "rising_star":
      return (
        <svg {...common}>
          <path
            d="M12 2l1.8 5.5H19l-4.5 3.3 1.7 5.2L12 14.8 7.8 16l1.7-5.2L5 7.5h5.2L12 2z"
            stroke={stroke}
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "diamond_hands":
      return (
        <svg {...common}>
          <path d="M12 3l7 7-7 11L5 10l7-7z" stroke={stroke} strokeWidth="1.75" strokeLinejoin="round" />
          <path d="M5 10h14" stroke={stroke} strokeWidth="1.75" />
        </svg>
      );
    case "two_weeks_strong":
      return (
        <svg {...common}>
          <circle cx="12" cy="13" r="7" stroke={stroke} strokeWidth="1.75" />
          <path d="M12 10v4l2.5 1.5" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" />
          <path d="M9 3h6" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case "monthly_investor":
      return (
        <svg {...common}>
          <path d="M8 18h8M9 18V9l3-4 3 4v9" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 6h10" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case "curator":
      return (
        <svg {...common}>
          <path
            d="M12 20s-7-4.4-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.6-7 10-7 10z"
            stroke={stroke}
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "topic_explorer":
      return (
        <svg {...common}>
          <circle cx="12" cy="11" r="8" stroke={stroke} strokeWidth="1.75" />
          <path d="M12 7v4l2.5 2.5" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" />
          <path d="M9 19l3 3 3-3" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "saver":
      return (
        <svg {...common}>
          <path d="M6 4h12v16H6z" stroke={stroke} strokeWidth="1.75" />
          <path d="M10 4v16" stroke={stroke} strokeWidth="1.75" />
        </svg>
      );
    case "market_analyst":
      return (
        <svg {...common}>
          <path d="M5 18V8M10 18V5M15 18v-7M20 18V11" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
          <path d="M4 18h16" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case "on_fire":
      return (
        <svg {...common}>
          <path
            d="M12 21c4-2.5 6-6 6-10a6 6 0 00-10-4c-1 2-3 3-4 5-1.5 2.5-1 5.5 1 7.5 1.2 1.2 3.5 2.5 7 1.5z"
            stroke={stroke}
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "loyal_reader":
      return (
        <svg {...common}>
          <path d="M5 4h14v16H5z" stroke={stroke} strokeWidth="1.75" />
          <path d="M9 4v16M5 8h4" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case "market_veteran":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" stroke={stroke} strokeWidth="1.75" />
          <path d="M12 8v4l3 2" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case "watchlist_builder":
      return (
        <svg {...common}>
          <path d="M8 6h11v14H8z" stroke={stroke} strokeWidth="1.75" />
          <path d="M5 10h3M5 14h3M5 18h3" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case "streak_starter":
      return (
        <svg {...common}>
          <path d="M12 3v4M8.5 5.5l2.5 2.5M15.5 5.5L13 8" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" />
          <circle cx="12" cy="14" r="5" stroke={stroke} strokeWidth="1.75" />
        </svg>
      );
    case "daily_champion":
      return (
        <svg {...common}>
          <path d="M8 18h8l-1-6H9l-1 6zM10 6h4l1 3H9l1-3z" stroke={stroke} strokeWidth="1.75" strokeLinejoin="round" />
          <path d="M12 3v2" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case "heart_collector":
      return (
        <svg {...common}>
          <path d="M12 20l-1.2-1.1C7.5 15.8 5 13.5 5 10.5a3.5 3.5 0 016-2 3.5 3.5 0 016 2c0 3-2.5 5.3-5.8 8.4L12 20z" stroke={stroke} strokeWidth="1.75" strokeLinejoin="round" />
        </svg>
      );
    case "topic_master":
      return (
        <svg {...common}>
          <path d="M4 7h16M4 12h10M4 17h14" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" />
          <circle cx="19" cy="12" r="2" stroke={stroke} strokeWidth="1.75" />
        </svg>
      );
    case "super_saver":
      return (
        <svg {...common}>
          <path d="M6 4h9l3 3v13H6z" stroke={stroke} strokeWidth="1.75" strokeLinejoin="round" />
          <path d="M15 4v3h3" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case "briefing_master":
      return (
        <svg {...common}>
          <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" stroke={stroke} strokeWidth="1.75" strokeLinejoin="round" />
          <path d="M17 17l2 2 4-4" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "xp_hunter":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" stroke={stroke} strokeWidth="1.75" />
          <path d="M12 8v8M8 12h8" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case "portfolio_scholar":
      return (
        <svg {...common}>
          <path d="M4 19V5l8-2 8 2v14l-8 2-8-2z" stroke={stroke} strokeWidth="1.75" strokeLinejoin="round" />
          <path d="M12 3v16" stroke={stroke} strokeWidth="1.75" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" stroke={stroke} strokeWidth="1.75" />
          <path d="M12 8v4l2 2" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
  }
}
