import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
  const adminKey = process.env.ADMIN_KEY || "";

  try {
    const qs = req.nextUrl.searchParams.toString();
    const res = await fetch(`${base}/admin/billing/summary${qs ? `?${qs}` : ""}`, {
      method: "GET",
      headers: {
        "X-Admin-Key": adminKey,
        "Accept": "application/json",
      },
      cache: "no-store",
    });

    const text = await res.text();
    try {
      return NextResponse.json(JSON.parse(text), { status: res.status });
    } catch {
      return NextResponse.json(
        { detail: "Proxy upstream returned non-JSON", status: res.status, body: text.slice(0, 500) },
        { status: 500 }
      );
    }
  } catch (e: any) {
    return NextResponse.json({ detail: `Proxy error: ${e?.message || "unknown"}` }, { status: 500 });
  }
}
