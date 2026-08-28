import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ viewer_id: string }> }) {
  const { viewer_id } = await ctx.params;
  const adminKey = process.env.ADMIN_KEY || "";

  const res = await fetch(`${API_BASE}/admin/hierarchy/my-tree/${encodeURIComponent(viewer_id)}`, {
    headers: { "X-Admin-Key": adminKey },
    cache: "no-store",
  });

  const raw = await res.text();
  let data: any = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch { data = { detail: raw }; }

  return NextResponse.json(data, { status: res.status });
}
