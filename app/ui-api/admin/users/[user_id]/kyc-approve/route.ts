import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest, { params }: { params: Promise<{ user_id: string }> }) {
  const { user_id } = await params;
  const backend = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
  const adminKey = process.env.ADMIN_KEY || "";
  if (!adminKey) return NextResponse.json({ detail: "ADMIN_KEY missing on UI server" }, { status: 500 });
  try {
    const body = await req.text();
    const res = await fetch(`${backend}/admin/users/${encodeURIComponent(user_id)}/kyc-approve`, {
      method: "POST",
      headers: { "X-Admin-Key": adminKey, "Content-Type": "application/json" },
      body,
      cache: "no-store",
    });
    const text = await res.text();
    let data: any = {};
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    return NextResponse.json(data, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ detail: `Proxy error: ${e?.message || "unknown"}` }, { status: 500 });
  }
}
