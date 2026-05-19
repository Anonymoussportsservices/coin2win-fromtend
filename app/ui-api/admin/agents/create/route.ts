import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const base =
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "http://127.0.0.1:8000";

    const adminKey =
      process.env.ADMIN_KEY ||
      process.env.NEXT_PUBLIC_ADMIN_KEY ||
      "";

    const res = await fetch(`${base}/admin/users/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Key": adminKey,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    return NextResponse.json(data, {
      status: res.status,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        detail: e?.message || "Proxy failed",
      },
      {
        status: 500,
      }
    );
  }
}
