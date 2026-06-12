import { NextResponse } from "next/server";
import {
  BRIEFING_SYSTEM_PROMPT,
  ensureFourBriefingBullets,
} from "@/lib/dailyBriefing";

const MODEL = "claude-haiku-4-5-20251001";
const SYSTEM_PROMPT = BRIEFING_SYSTEM_PROMPT;

function formatBriefingDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function parseBullets(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, 4);
}

export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Briefing unavailable" }, { status: 503 });
  }

  const today = formatBriefingDate(new Date());
  const userPrompt = `Write a daily market briefing for today ${today}. Cover: overall market direction, biggest market story, key economic event today if any, one thing to watch.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Briefing failed" }, { status: 502 });
    }

    const data = (await res.json()) as {
      content?: { type: string; text?: string }[];
    };

    const text =
      data.content?.find((block) => block.type === "text")?.text?.trim() ?? "";
    const bullets = ensureFourBriefingBullets(parseBullets(text));

    if (bullets.length === 0) {
      return NextResponse.json({ error: "Empty briefing" }, { status: 502 });
    }

    return NextResponse.json({ bullets });
  } catch {
    return NextResponse.json({ error: "Briefing failed" }, { status: 502 });
  }
}
