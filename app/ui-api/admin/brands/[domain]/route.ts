import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
const ADMIN_KEY = process.env.ADMIN_KEY || "";

export async function GET(_: NextRequest, ctx: { params: Promise<{ domain: string }> }) {
  const { domain } = await ctx.params;
  const res = await fetch(`${API_BASE}/admin/brands/${encodeURIComponent(domain)}`, {
    headers: {
      Accept: "application/json",
      "X-Admin-Key": ADMIN_KEY,
    },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
