import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";
const ADMIN_KEY = process.env.ADMIN_KEY || "";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ user_id: string }> }
) {
  const { user_id } = await ctx.params;
  const url = new URL(req.url);
  const limit = url.searchParams.get("limit") || "100";
  const currentOnly = url.searchParams.get("current_only") || "false";

  const res = await fetch(
    `${BACKEND_URL}/admin/billing/history/${encodeURIComponent(user_id)}?limit=${encodeURIComponent(limit)}&current_only=${encodeURIComponent(currentOnly)}`,
    {
      headers: { "X-Admin-Key": ADMIN_KEY },
      cache: "no-store",
    }
  );

  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}
