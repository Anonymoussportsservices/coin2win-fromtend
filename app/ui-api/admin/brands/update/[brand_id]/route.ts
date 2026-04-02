import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
const ADMIN_KEY = process.env.ADMIN_KEY || "";

export async function POST(req: NextRequest, ctx: { params: Promise<{ brand_id: string }> }) {
  const { brand_id } = await ctx.params;
  const body = await req.text();
  const res = await fetch(`${API_BASE}/admin/brands/update/${encodeURIComponent(brand_id)}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Admin-Key": ADMIN_KEY,
    },
    body,
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
