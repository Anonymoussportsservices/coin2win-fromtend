import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ viewer_id: string }> }
) {
  try {
    const { viewer_id } = await ctx.params;

    const search = req.nextUrl.searchParams.toString();

    const base =
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "http://127.0.0.1:8000";

    const res = await fetch(
      `${base}/admin/intelligence/player-pnl/${viewer_id}?${search}`,
      {
        headers: {
          "X-Admin-Key": process.env.ADMIN_KEY || "",
        },
        cache: "no-store",
      }
    );

    const text = await res.text();

    return new NextResponse(text, {
      status: res.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (e:any) {
    return NextResponse.json(
      {
        ok: false,
        detail: e?.message || "Proxy failed",
      },
      { status: 500 }
    );
  }
}
