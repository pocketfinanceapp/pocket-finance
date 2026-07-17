import { NextResponse } from "next/server";
import { fetchCompanyInfo } from "@/lib/companyInfo";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyName = searchParams.get("company");
  if (!companyName) {
    return NextResponse.json({ info: null }, { status: 400 });
  }

  const info = await fetchCompanyInfo(companyName);
  return NextResponse.json({ info });
}
