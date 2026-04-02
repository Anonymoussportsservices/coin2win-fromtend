import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const qs = req.nextUrl.searchParams.toString();

  const res = await fetch(`${API_BASE}/kyc/me${qs ? `?${qs}` : ""}`, {
    headers: {
      Accept: "application/json",
      ...(auth ? { Authorization: auth } : {}),
    },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
