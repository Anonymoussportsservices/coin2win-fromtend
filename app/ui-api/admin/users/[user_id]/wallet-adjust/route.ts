import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  const { user_id } = await params;
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
  const adminKey = process.env.ADMIN_KEY || process.env.NEXT_PUBLIC_ADMIN_KEY || "";

  try {
    const body = await req.json();

    const viewerId = req.nextUrl.searchParams.get("viewer_id") || "";

    const targetUrl = new URL(
      `${base}/admin/users/${encodeURIComponent(user_id)}/wallet-adjust`
    );

    if (viewerId) {
      targetUrl.searchParams.set("viewer_id", viewerId);
    }

    const res = await fetch(targetUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Key": adminKey,
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || "Wallet adjust proxy error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({});
}
