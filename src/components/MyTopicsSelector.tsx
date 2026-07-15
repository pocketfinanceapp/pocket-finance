"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Bot,
  Check,
  Coins,
  Cpu,
  Globe,
  Home,
  Landmark,
  Package,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  loadFavouriteTopics,
  PROFILE_TOPICS,
  type ProfileTopic,
  toggleFavouriteTopic,
} from "@/lib/profileStorage";

/* ── Topic → icon mapping ──────────────────────────────────────────────── */

const TOPIC_ICON: Record<ProfileTopic, React.ReactNode> = {
  Tech: <Cpu size={12} />,
  Energy: <Zap size={12} />,
  Crypto: <Coins size={12} />,
  Markets: <TrendingUp size={12} />,
  Economy: <Globe size={12} />,
  AI: <Bot size={12} />,
  Healthcare: <Activity size={12} />,
  "Real Estate": <Home size={12} />,
  Commodities: <Package size={12} />,
  Banking: <Landmark size={12} />,
};

/* ─────────────────────────────────────────────────────────────────────────── */

interface MyTopicsSelectorProps {
  /** Show "X selected" count below the selector */
  showCount?: boolean;
  /** Called with the updated topic list after each toggle */
  onTopicsChange?: (topics: ProfileTopic[]) => void;
  /** Force a re-read from localStorage (increment to reset after external toggle) */
  reloadKey?: number;
}

export function MyTopicsSelector({ showCount, onTopicsChange, reloadKey }: MyTopicsSelectorProps) {
  const [topics, setTopics] = useState<ProfileTopic[]>([]);
  const [pulseTopic, setPulseTopic] = useState<ProfileTopic | null>(null);

  useEffect(() => {
    setTopics(loadFavouriteTopics());
  }, [reloadKey]);

  const handleToggle = (topic: ProfileTopic) => {
    const next = toggleFavouriteTopic(topic);
    setTopics(next);
    onTopicsChange?.(next);
    setPulseTopic(topic);
    window.setTimeout(() => setPulseTopic(null), 220);
  };

  return (
    <div>
      {showCount && (
        <p className="mb-4 mt-1 text-[12px] font-semibold text-pocket-muted">
          {topics.length} selected
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {PROFILE_TOPICS.map((topic) => {
          const selected = topics.includes(topic);
          const pulsing = pulseTopic === topic;

          return (
            <button
              key={topic}
              type="button"
              data-no-drag
              onClick={() => handleToggle(topic)}
              className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] transition-colors duration-150 active:scale-[0.98] ${
                pulsing ? "scale-[0.97]" : ""
              } ${
                selected
                  ? "border-[#00C6C6]/70 bg-[#00C6C6]/15 font-semibold text-pocket-text shadow-[0_0_10px_rgba(0,198,198,0.12)]"
                  : "border-[var(--pocket-border)] bg-[var(--pocket-surface-hover)] font-medium text-pocket-muted"
              }`}
            >
              <span className={selected ? "opacity-90" : "opacity-60"}>
                {TOPIC_ICON[topic]}
              </span>
              {topic}
              {selected && (
                <Check
                  size={10}
                  strokeWidth={3}
                  className="ml-0.5 shrink-0 text-[#00C6C6]"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
