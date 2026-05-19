import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, ctx: { params: Promise<{ withdrawal_id: string }> }) {
  try {
    const { withdrawal_id } = await ctx.params;
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
    const adminKey = process.env.ADMIN_KEY || process.env.NEXT_PUBLIC_ADMIN_KEY || "";
    const body = await req.json().catch(() => ({}));

    const res = await fetch(`${base}/admin/withdrawals/${encodeURIComponent(withdrawal_id)}/fail`, {
      method: "POST",
      headers: {
        "X-Admin-Key": adminKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: "Withdrawal action proxy error" }, { status: 500 });
  }
}
