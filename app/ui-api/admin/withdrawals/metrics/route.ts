import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
    const adminKey = process.env.ADMIN_KEY || process.env.NEXT_PUBLIC_ADMIN_KEY || "";
    const qs = new URL(req.url).searchParams.toString();
    const res = await fetch(`${base}/admin/withdrawals/metrics${qs ? `?${qs}` : ""}`, {
      cache: "no-store",
      headers: { "X-Admin-Key": adminKey, Accept: "application/json" },
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: "Withdrawals metrics proxy error" }, { status: 500 });
  }
}
