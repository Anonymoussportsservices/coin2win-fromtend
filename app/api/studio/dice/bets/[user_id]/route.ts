import { NextRequest, NextResponse } from "next/server";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ user_id: string }> }
) {
  const { user_id } = await ctx.params;
  const auth = req.headers.get("authorization") || "";
  const qs = req.nextUrl.searchParams.toString();

  const res = await fetch(
    `${API_BASE}/studio/dice/bets/${encodeURIComponent(user_id)}${qs ? `?${qs}` : ""}`,
    {
      headers: {
        Accept: "application/json",
        ...(auth ? { Authorization: auth } : {}),
      },
      cache: "no-store",
    }
  );

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
