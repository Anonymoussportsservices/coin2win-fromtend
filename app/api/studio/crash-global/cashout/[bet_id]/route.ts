import { NextRequest, NextResponse } from "next/server";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
export async function POST(req: NextRequest, ctx: { params: Promise<{ bet_id: string }> }) {
  const { bet_id } = await ctx.params;
  const auth = req.headers.get("authorization") || "";
  const body = await req.text();
  const res = await fetch(`${API_BASE}/studio/crash-global/cashout/${encodeURIComponent(bet_id)}`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json", ...(auth ? { Authorization: auth } : {}) },
    body,
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
