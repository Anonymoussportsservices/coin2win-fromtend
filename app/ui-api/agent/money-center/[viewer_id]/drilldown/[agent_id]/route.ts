import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ viewer_id: string; agent_id: string }> }
) {
  const { viewer_id, agent_id } = await params;
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
  const adminKey = process.env.ADMIN_KEY || "";

  const qs = req.nextUrl.searchParams.toString();

  const url =
    base +
    "/admin/agent-money-center/" +
    viewer_id +
    "/drilldown/" +
    agent_id +
    (qs ? "?" + qs : "");

  const res = await fetch(url, {
    headers: { "X-Admin-Key": adminKey },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
