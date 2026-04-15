import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ withdrawal_id: string }> }) {
  const { withdrawal_id } = await params;
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
  const adminKey = process.env.ADMIN_KEY || "";
  const qs = req.nextUrl.searchParams.toString();

  try {
    const res = await fetch(`${base}/admin/withdrawals/${withdrawal_id}${qs ? `?${qs}` : ""}`, {
      cache: "no-store",
      headers: { "X-Admin-Key": adminKey },
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: "Proxy error" }, { status: 500 });
  }
}
