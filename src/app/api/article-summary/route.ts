import { NextResponse } from "next/server";
import { parseBriefingResponse } from "@/lib/briefing";

const MODEL = "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT = `You are a senior financial news editor at Pocket Finance. Write a detailed Pocket Briefing — an in-depth investor news report, not a short summary.

Return ONLY valid JSON in this exact shape:
{
  "lede": "2-3 sentence opening paragraph",
  "sections": [
    { "title": "What happened", "paragraphs": ["...", "..."] },
    { "title": "Why it matters", "paragraphs": ["...", "..."] },
    { "title": "Market impact", "paragraphs": ["...", "..."] },
    { "title": "What to watch", "paragraphs": ["..."] }
  ],
  "takeaway": "One crisp investor takeaway sentence"
}

Rules:
- Write 400-600 words total across lede, sections, and takeaway
- Each paragraph must be 2-4 full sentences of professional financial journalism
- Be specific about the company, ticker, sector, and market when relevant
- Explain context, implications, and investor relevance like Reuters or Bloomberg desk copy
- No emojis, no bullet points, no markdown, no preamble outside the JSON
- Do not invent direct quotes, precise statistics, or named sources not implied by the input
- If source material is thin, expand with careful market context without fabricating facts`;

interface SummaryRequest {
  headline?: string;
  sourceText?: string;
  ticker?: string;
  companyName?: string;
  market?: string;
  sector?: string;
  tags?: string[];
  sourceName?: string;
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
  const sourceText = body.sourceText?.trim() ?? "";
  if (!headline) {
    return NextResponse.json({ error: "Headline required" }, { status: 400 });
  }

  const contextLines = [
    `Headline: ${headline}`,
    body.ticker ? `Ticker: ${body.ticker}` : null,
    body.companyName ? `Company: ${body.companyName}` : null,
    body.market ? `Market: ${body.market}` : null,
    body.sector ? `Sector: ${body.sector}` : null,
    body.tags?.length ? `Tags: ${body.tags.join(", ")}` : null,
    body.sourceName ? `Publisher: ${body.sourceName}` : null,
    sourceText ? `Source material:\n${sourceText}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const userPrompt = `Write a detailed Pocket Briefing report for this story:\n\n${contextLines}`;

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
        max_tokens: 1400,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Summary failed" }, { status: 502 });
    }

    const data = (await res.json()) as {
      content?: { type: string; text?: string }[];
    };

    const text =
      data.content?.find((block) => block.type === "text")?.text?.trim() ?? "";
    const briefing = parseBriefingResponse(text);

    if (!briefing) {
      return NextResponse.json({ error: "Empty summary" }, { status: 502 });
    }

    return NextResponse.json({ briefing });
  } catch {
    return NextResponse.json({ error: "Summary failed" }, { status: 502 });
  }
}
