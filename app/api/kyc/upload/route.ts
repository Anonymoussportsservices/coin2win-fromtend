import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();

    const res = await fetch(`${API_BASE}/kyc/upload`, {
      method: "POST",
      body: form,
      cache: "no-store",
    });

    const raw = await res.text();
    let data: any = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch { data = { detail: raw || `Request failed (${res.status})` }; }

    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ detail: err?.message || "KYC upload proxy failed" }, { status: 500 });
  }
}
