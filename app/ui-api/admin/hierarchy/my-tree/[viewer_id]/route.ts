import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ viewer_id: string }> }
) {
  try {
    const { viewer_id } = await params;

    const backendBase =
      process.env.API_BASE ||
      process.env.NEXT_PUBLIC_API_BASE ||
      "http://127.0.0.1:8000";

    const adminKey = process.env.ADMIN_KEY || "";

    if (!adminKey) {
      return NextResponse.json(
        { detail: "ADMIN_KEY is not configured on the UI server" },
        { status: 500 }
      );
    }

    const res = await fetch(
      `${backendBase}/admin/hierarchy/my-tree/${encodeURIComponent(viewer_id)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-Admin-Key": adminKey,
        },
        cache: "no-store",
      }
    );

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { detail: error?.message || "Proxy request failed" },
      { status: 500 }
    );
  }
}
