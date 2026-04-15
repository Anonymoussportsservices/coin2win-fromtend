import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

  const res = await fetch(`${base}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
