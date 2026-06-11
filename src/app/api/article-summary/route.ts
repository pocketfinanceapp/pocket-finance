import { NextResponse } from "next/server";

const MODEL = "claude-haiku-4-5-20251001";
const SYSTEM_PROMPT =
  "You are a financial news summariser. Return exactly 3 bullet points, no preamble, no extra text. Format: bullet 1 starting with 🔴, bullet 2 starting with 📈, bullet 3 starting with 👀. Each bullet is one concise sentence.";

interface SummaryRequest {
  headline?: string;
  snippet?: string;
}

function parseBullets(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, 3);
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Summary unavailable" }, { status: 503 });
  }

  let body: SummaryRequest;
  try {
    body = (await request.json()) as SummaryRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const headline = body.headline?.trim();
  const snippet = body.snippet?.trim() ?? "";
  if (!headline) {
    return NextResponse.json({ error: "Headline required" }, { status: 400 });
  }

  const userPrompt = `Summarise this article in 3 bullets: ${headline} - ${snippet}`;

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
      return NextResponse.json({ error: "Summary failed" }, { status: 502 });
    }

    const data = (await res.json()) as {
      content?: { type: string; text?: string }[];
    };

    const text =
      data.content?.find((block) => block.type === "text")?.text?.trim() ?? "";
    const bullets = parseBullets(text);

    if (bullets.length === 0) {
      return NextResponse.json({ error: "Empty summary" }, { status: 502 });
    }

    return NextResponse.json({ bullets });
  } catch {
    return NextResponse.json({ error: "Summary failed" }, { status: 502 });
  }
}
