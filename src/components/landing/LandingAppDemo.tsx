"use client";

import { useEffect, useState } from "react";
import {
  LANDING_BRIEFING,
  LANDING_FEED_ARTICLES,
} from "@/lib/landingDemoData";
import { LandingPhoneFrame } from "./LandingPhoneFrame";
import {
  LandingDemoArticlePanel,
  LandingDemoBottomNav,
  LandingDemoFeedCard,
  LandingDemoFeedHeader,
  LandingDemoStockPanel,
  LandingGestureFinger,
  useLandingMotion,
} from "./LandingDemoUI";

type Scene =
  | "feed-0"
  | "swipe-up"
  | "feed-1"
  | "swipe-left"
  | "article"
  | "article-scroll"
  | "article-briefing"
  | "back-feed"
  | "swipe-right"
  | "stock"
  | "stock-chart"
  | "stock-info"
  | "back-feed-2";

const SCENE_ORDER: Scene[] = [
  "feed-0",
  "swipe-up",
  "feed-1",
  "swipe-left",
  "article",
  "article-scroll",
  "article-briefing",
  "back-feed",
  "swipe-right",
  "stock",
  "stock-chart",
  "stock-info",
  "back-feed-2",
];

const SCENE_MS: Record<Scene, number> = {
  "feed-0": 2400,
  "swipe-up": 900,
  "feed-1": 2000,
  "swipe-left": 750,
  article: 1400,
  "article-scroll": 1200,
  "article-briefing": 2600,
  "back-feed": 650,
  "swipe-right": 750,
  stock: 1400,
  "stock-chart": 1100,
  "stock-info": 2200,
  "back-feed-2": 700,
};

function sceneFinger(scene: Scene): "up" | "left" | "right" | "tap" | "scroll" | null {
  switch (scene) {
    case "swipe-up":
      return "up";
    case "swipe-left":
      return "left";
    case "swipe-right":
      return "right";
    case "article-scroll":
      return "scroll";
    case "stock-chart":
    case "stock-info":
      return "tap";
    default:
      return null;
  }
}

export function LandingAppDemo() {
  const reduced = useLandingMotion();
  const [scene, setScene] = useState<Scene>("feed-0");
  const [sceneIndex, setSceneIndex] = useState(0);

  useEffect(() => {
    const current = SCENE_ORDER[sceneIndex];
    const ms = reduced ? SCENE_MS[current] * 0.35 : SCENE_MS[current];
    const t = window.setTimeout(() => {
      const next = (sceneIndex + 1) % SCENE_ORDER.length;
      setSceneIndex(next);
      setScene(SCENE_ORDER[next]);
    }, ms);
    return () => window.clearTimeout(t);
  }, [sceneIndex, reduced]);

  const onArticle =
    scene === "swipe-left" ||
    scene === "article" ||
    scene === "article-scroll" ||
    scene === "article-briefing";
  const onStock =
    scene === "swipe-right" ||
    scene === "stock" ||
    scene === "stock-chart" ||
    scene === "stock-info";

  const feedY =
    scene === "feed-1" || scene === "swipe-up" ? "-50%" : "0%";
  const articleX = onArticle ? "0%" : "-100%";
  const stockX = onStock ? "0%" : "100%";

  const scrollOffset =
    scene === "article-scroll" || scene === "article-briefing" ? 36 : 0;
  const briefingVisible = scene === "article-briefing";
  const chartRange =
    scene === "stock-chart" || scene === "stock-info" ? "1W" : "1M";
  const infoOpen = scene === "stock-info";
  const finger = sceneFinger(scene);
  const showFinger = !reduced && finger !== null;

  const article = LANDING_FEED_ARTICLES[0];
  const feedArticles = LANDING_FEED_ARTICLES.slice(0, 2);

  return (
    <LandingPhoneFrame>
      <LandingDemoFeedHeader activeTab="forYou" />
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {/* Feed stack */}
        <div
          className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            height: "200%",
            transform: `translateY(${feedY})`,
            transitionDuration: reduced ? "0ms" : undefined,
          }}
        >
          {feedArticles.map((a) => (
            <div key={a.id} className="h-1/2 w-full">
              <LandingDemoFeedCard article={a} showRailPulse={scene === "feed-0"} />
            </div>
          ))}
        </div>

        {/* Article panel */}
        <div
          className="absolute inset-0 bg-pocket-bg transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            transform: `translateX(${articleX})`,
            transitionDuration: reduced ? "0ms" : undefined,
          }}
        >
          <LandingDemoArticlePanel
            article={article}
            briefing={LANDING_BRIEFING}
            briefingVisible={briefingVisible}
            scrollOffset={scrollOffset}
          />
        </div>

        {/* Stock panel */}
        <div
          className="absolute inset-0 bg-pocket-bg transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            transform: `translateX(${stockX})`,
            transitionDuration: reduced ? "0ms" : undefined,
          }}
        >
          <LandingDemoStockPanel
            chartRange={chartRange}
            infoOpen={infoOpen}
          />
        </div>

        <LandingGestureFinger gesture={finger} visible={showFinger} />
      </div>
      <LandingDemoBottomNav active="home" />
    </LandingPhoneFrame>
  );
}
