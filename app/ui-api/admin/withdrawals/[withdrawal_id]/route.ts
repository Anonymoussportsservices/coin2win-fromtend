import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ withdrawal_id: string }> }) {
  try {
    const { withdrawal_id } = await ctx.params;
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
    const adminKey = process.env.ADMIN_KEY || process.env.NEXT_PUBLIC_ADMIN_KEY || "";
    const res = await fetch(`${base}/admin/withdrawals/${encodeURIComponent(withdrawal_id)}`, {
      cache: "no-store",
      headers: { "X-Admin-Key": adminKey, Accept: "application/json" },
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: "Withdrawal detail proxy error" }, { status: 500 });
  }
}
