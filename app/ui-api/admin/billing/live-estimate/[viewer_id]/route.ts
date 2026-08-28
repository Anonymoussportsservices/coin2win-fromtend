import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";
const ADMIN_KEY = process.env.ADMIN_KEY || "";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ viewer_id: string }> }
) {
  const { viewer_id } = await ctx.params;
  const url = new URL(req.url);
  const periodKey = url.searchParams.get("period_key") || "";

  const res = await fetch(
    `${BACKEND_URL}/admin/billing/live-estimate/${encodeURIComponent(viewer_id)}?period_key=${encodeURIComponent(periodKey)}`,
    {
      headers: { "X-Admin-Key": ADMIN_KEY },
      cache: "no-store",
    }
  );

  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}
