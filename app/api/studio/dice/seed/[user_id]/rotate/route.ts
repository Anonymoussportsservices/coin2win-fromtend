import { NextRequest, NextResponse } from "next/server";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ user_id: string }> }
) {
  const { user_id } = await ctx.params;
  const auth = req.headers.get("authorization") || "";

  const res = await fetch(`${API_BASE}/studio/dice/seed/${encodeURIComponent(user_id)}/rotate`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...(auth ? { Authorization: auth } : {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
