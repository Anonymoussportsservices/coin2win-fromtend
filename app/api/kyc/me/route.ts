import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("user_id") || "";

  if (!userId) {
    return NextResponse.json({ detail: "user_id required" }, { status: 400 });
  }

  try {
    const res = await fetch(`${API_BASE}/kyc/me/${encodeURIComponent(userId)}`, {
      cache: "no-store",
    });

    const raw = await res.text();
    let data: any = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = { detail: raw || `Request failed (${res.status})` };
    }

    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { detail: err?.message || "KYC proxy failed" },
      { status: 500 }
    );
  }
}
