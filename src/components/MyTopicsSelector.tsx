"use client";

import { useEffect, useState } from "react";
import {
  loadFavouriteTopics,
  PROFILE_TOPICS,
  type ProfileTopic,
  toggleFavouriteTopic,
} from "@/lib/profileStorage";

export function MyTopicsSelector() {
  const [topics, setTopics] = useState<ProfileTopic[]>([]);

  useEffect(() => {
    setTopics(loadFavouriteTopics());
  }, []);

  return (
    <div className="flex flex-wrap gap-2">
      {PROFILE_TOPICS.map((topic) => {
        const selected = topics.includes(topic);
        return (
          <button
            key={topic}
            type="button"
            data-no-drag
            onClick={() => setTopics(toggleFavouriteTopic(topic))}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-transform active:scale-95 ${
              selected
                ? "bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] text-white"
                : "border border-white/[0.08] bg-white/[0.06] text-white"
            }`}
          >
            {topic}
          </button>
        );
      })}
    </div>
  );
}
