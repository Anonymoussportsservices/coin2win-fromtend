import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export async function GET(req: NextRequest, ctx: { params: Promise<{ owner_id: string }> }) {
  const { owner_id } = await ctx.params;
  const adminKey = process.env.ADMIN_KEY || "";
  const qs = req.nextUrl.searchParams.toString();

  const res = await fetch(`${API_BASE}/admin/kyc/rules/effective/${encodeURIComponent(owner_id)}${qs ? `?${qs}` : ""}`, {
    headers: { "X-Admin-Key": adminKey },
    cache: "no-store",
  });

  const raw = await res.text();
  let data: any = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch { data = { detail: raw }; }

  return NextResponse.json(data, { status: res.status });
}
