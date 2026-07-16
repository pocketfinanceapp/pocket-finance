import { NextResponse } from "next/server";
import { fetchCompanyFundamentals } from "@/lib/twelveDataFundamentals";

export async function GET(request: Request) {
  const ticker = new URL(request.url).searchParams.get("ticker")?.trim();

  if (!ticker) {
    return NextResponse.json({ error: "ticker is required" }, { status: 400 });
  }

  const fundamentals = await fetchCompanyFundamentals(ticker);

  if (!fundamentals) {
    return NextResponse.json(null, { status: 404 });
  }

  return NextResponse.json(fundamentals);
}
