import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
    const qs = req.nextUrl.searchParams.toString();
    const auth = req.headers.get("authorization") || "";

    const res = await fetch(`${base}/transactions/me${qs ? `?${qs}` : ""}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(auth ? { Authorization: auth } : {}),
      },
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: "Transactions proxy error" }, { status: 500 });
  }
}
