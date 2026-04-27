import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const adminKey = process.env.ADMIN_KEY || process.env.NEXT_PUBLIC_ADMIN_KEY || "";
  const body = await req.json();

  const res = await fetch("http://127.0.0.1:8000/admin/softswiss/games/bulk-update", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Admin-Key": adminKey },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
