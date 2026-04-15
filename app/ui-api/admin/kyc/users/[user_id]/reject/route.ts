import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ user_id: string }> }) {
  const { user_id } = await params;
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
  const adminKey = process.env.ADMIN_KEY || "";

  try {
    const body = await req.text();
    const qs = req.nextUrl.searchParams.toString();
    const res = await fetch(`${base}/admin/kyc/users/${user_id}/reject${qs ? `?${qs}` : ""}`, {
      method: "POST",
      headers: { "X-Admin-Key": adminKey, "Content-Type": "application/json" },
      body: body || "{}",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: "Proxy error" }, { status: 500 });
  }
}
