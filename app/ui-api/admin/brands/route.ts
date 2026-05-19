import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
const ADMIN_KEY = process.env.ADMIN_KEY || "";

export async function GET() {
  const res = await fetch(`${API_BASE}/api/admin/brands`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "X-Admin-Key": ADMIN_KEY,
    },
  });

  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const res = await fetch(`${API_BASE}/api/admin/brands`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Admin-Key": ADMIN_KEY,
    },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}
