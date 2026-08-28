import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export async function POST(req: NextRequest, ctx: { params: Promise<{ user_id: string }> }) {
  try {
    const { user_id } = await ctx.params;
    const body = await req.text();
    const adminKey = process.env.ADMIN_KEY || "";
    const viewerId = req.nextUrl.searchParams.get("viewer_id") || "";
    const qs = viewerId ? `?viewer_id=${encodeURIComponent(viewerId)}` : "";

    const res = await fetch(`${API_BASE}/admin/kyc/users/${encodeURIComponent(user_id)}/approve${qs}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Key": adminKey },
      body,
      cache: "no-store",
    });

    const raw = await res.text();
    let data: any = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch { data = { detail: raw || `Request failed (${res.status})` }; }
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ detail: err?.message || "KYC approve proxy failed" }, { status: 500 });
  }
}
