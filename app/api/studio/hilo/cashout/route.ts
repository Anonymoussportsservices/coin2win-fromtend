import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest) {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
  try {
    const body = await req.text();
    const res = await fetch(`${base}/studio/hilo/cashout`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: "Proxy error" }, { status: 500 });
  }
}
