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
  const [pulseTopic, setPulseTopic] = useState<ProfileTopic | null>(null);

  useEffect(() => {
    setTopics(loadFavouriteTopics());
  }, []);

  const handleToggle = (topic: ProfileTopic) => {
    setTopics(toggleFavouriteTopic(topic));
    setPulseTopic(topic);
    window.setTimeout(() => setPulseTopic(null), 220);
  };

  return (
    <div>
      <p className="mb-3 text-xs text-zinc-500">
        Tap to personalise your Following feed
      </p>
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
              className={`rounded-full px-4 py-2 text-sm transition-transform duration-150 active:scale-95 ${
                selected
                  ? "bg-[#00C6C6] font-bold text-white shadow-[0_0_14px_rgba(0,198,198,0.35)]"
                  : "bg-zinc-800 text-zinc-500"
              } ${pulsing ? "scale-110" : "scale-100"}`}
            >
              {topic}
            </button>
          );
        })}
      </div>
    </div>
  );
}
