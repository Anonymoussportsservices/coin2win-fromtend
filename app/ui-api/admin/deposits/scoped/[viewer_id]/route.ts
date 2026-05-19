import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, ctx: { params: Promise<{ viewer_id: string }> }) {
  try {
    const { viewer_id } = await ctx.params;
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
    const adminKey = process.env.ADMIN_KEY || process.env.NEXT_PUBLIC_ADMIN_KEY || "";
    const qs = req.nextUrl.searchParams.toString();
    const join = qs ? `&${qs}` : "";

    const res = await fetch(
      `${base}/admin/deposits?viewer_id=${encodeURIComponent(viewer_id)}${join}`,
      {
        cache: "no-store",
        headers: {
          "X-Admin-Key": adminKey,
          Accept: "application/json",
        },
      }
    );

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: "Deposits scoped proxy error" }, { status: 500 });
  }
}
