import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";
const ADMIN_KEY = process.env.ADMIN_KEY || "";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ user_id: string }> }
) {
  const { user_id } = await ctx.params;

  const res = await fetch(`${BACKEND_URL}/admin/users/${encodeURIComponent(user_id)}/enable`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Key": ADMIN_KEY,
    },
    body: JSON.stringify({}),
    cache: "no-store",
  });

  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}
