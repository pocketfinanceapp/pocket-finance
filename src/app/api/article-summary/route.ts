import { NextResponse } from "next/server";
import { parseBriefingResponse } from "@/lib/briefing";

const MODEL = "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT = `You are a senior financial news editor at Pocket Finance. Write a concise Pocket Briefing — short, scannable, and informative for busy investors.

You will usually be given the primary article plus short excerpts from other outlets covering the same story. Synthesize across all of them into one coherent briefing — don't just paraphrase the primary source. Pull in a detail from a related source when it adds something the primary article didn't cover, and note it plainly if outlets disagree or emphasize different angles. If only the primary article is provided, summarize it alone.

Return ONLY valid JSON in this exact shape:
{
  "lede": "1-2 sentence summary of the core story",
  "sections": [
    { "title": "What happened", "paragraphs": ["One tight paragraph, 1-2 sentences max"] },
    { "title": "Why it matters", "paragraphs": ["One tight paragraph, 1-2 sentences max"] }
  ],
  "takeaway": "One crisp investor takeaway sentence"
}

Rules:
- Write 80-130 words total across lede, sections, and takeaway
- Each section has exactly one paragraph of 1-2 sentences
- Be specific about the company, ticker, sector, and market when relevant
- Prioritize clarity and signal over length — every word should earn its place
- No emojis, no bullet points, no markdown, no preamble outside the JSON
- Do not invent direct quotes, precise statistics, or named sources not implied by the input
- Do not attribute a claim to a specific outlet by name in the output — synthesize into one voice
- If source material is thin, add only careful, brief market context without fabricating facts`;

interface RelatedSource {
  headline?: string;
  sourceName?: string;
  excerpt?: string;
}

interface SummaryRequest {
  headline?: string;
  sourceText?: string;
  ticker?: string;
  companyName?: string;
  market?: string;
  sector?: string;
  tags?: string[];
  sourceName?: string;
  relatedSources?: RelatedSource[];
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
    sourceText ? `Primary source material:\n${sourceText}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const relatedSources = (body.relatedSources ?? []).filter(
    (s): s is Required<RelatedSource> =>
      Boolean(s.headline?.trim() && s.excerpt?.trim())
  );

  const relatedBlock = relatedSources.length
    ? `\n\nOther coverage of the same story:\n${relatedSources
        .map(
          (s, i) =>
            `[${i + 1}] "${s.headline.trim()}"${
              s.sourceName ? ` — ${s.sourceName.trim()}` : ""
            }\n${s.excerpt.trim()}`
        )
        .join("\n\n")}`
    : "";

  const userPrompt = `Write a concise Pocket Briefing for this story:\n\n${contextLines}${relatedBlock}`;

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
        max_tokens: 500,
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
