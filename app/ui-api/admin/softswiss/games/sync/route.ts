import { NextResponse } from "next/server";

export async function POST() {
  const adminKey = process.env.ADMIN_KEY || process.env.NEXT_PUBLIC_ADMIN_KEY || "";

  const res = await fetch("http://127.0.0.1:8000/admin/softswiss/games/sync", {
    method: "POST",
    headers: { "X-Admin-Key": adminKey },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
