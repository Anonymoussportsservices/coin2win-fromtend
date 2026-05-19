import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ viewer_id: string }> }
) {
  const { viewer_id } = await params;
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
  const adminKey = process.env.ADMIN_KEY || process.env.NEXT_PUBLIC_ADMIN_KEY || "";

  const qs = req.nextUrl.searchParams.toString();

  try {
    const res = await fetch(
      `${base}/admin/crm/bonus-protection/${encodeURIComponent(viewer_id)}${qs ? `?${qs}` : ""}`,
      {
        headers: { "X-Admin-Key": adminKey, Accept: "application/json" },
        cache: "no-store",
      }
    );

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || "Bonus protection proxy error" }, { status: 500 });
  }
}
