import { NextResponse } from "next/server";

export async function GET() {
  const base =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://127.0.0.1:8000";

  try {
    const res = await fetch(`${base}/health`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    const data = await res.json().catch(() => ({}));

    return NextResponse.json(data, {
      status: res.status,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "error",
        detail: err?.message || "Platform health check failed",
      },
      { status: 503 }
    );
  }
}
