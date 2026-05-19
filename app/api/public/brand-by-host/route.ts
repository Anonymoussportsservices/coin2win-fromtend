import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const host = url.searchParams.get("host") || "";

  const res = await fetch(`${API_BASE}/api/public/brand-by-host?host=${encodeURIComponent(host)}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}
