import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ viewer_id: string }> }) {
  const { viewer_id } = await params;
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
  const adminKey = process.env.ADMIN_KEY || "";
  const days = req.nextUrl.searchParams.get("days") || "30";

  try {
    const res = await fetch(`${base}/admin/agent-dashboard/${encodeURIComponent(viewer_id)}?days=${encodeURIComponent(days)}`, {
      cache: "no-store",
      headers: { "X-Admin-Key": adminKey },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: "Proxy error" }, { status: 500 });
  }
}
