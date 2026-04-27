import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const adminKey = process.env.ADMIN_KEY || process.env.NEXT_PUBLIC_ADMIN_KEY || "";
  const qs = req.nextUrl.searchParams.toString();

  const res = await fetch(`http://127.0.0.1:8000/admin/softswiss/games${qs ? `?${qs}` : ""}`, {
    cache: "no-store",
    headers: { "X-Admin-Key": adminKey },
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
