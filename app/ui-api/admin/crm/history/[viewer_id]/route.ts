import { NextRequest, NextResponse } from "next/server";

const base = process.env.BACKEND_URL || "http://127.0.0.1:8000";
const adminKey = process.env.ADMIN_KEY || "";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ viewer_id: string }> }
) {
  try {
    const { viewer_id } = await ctx.params;
    const url = new URL(req.url);
    const qs = url.searchParams.toString();

    const res = await fetch(
      `${base}/admin/crm/history/${encodeURIComponent(viewer_id)}${qs ? `?${qs}` : ""}`,
      {
        headers: { "X-Admin-Key": adminKey },
        cache: "no-store",
      }
    );

    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || "CRM history proxy error" }, { status: 500 });
  }
}
