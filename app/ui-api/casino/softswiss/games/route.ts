import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("http://127.0.0.1:8000/casino/softswiss/games", {
      cache: "no-store",
    });

    const data = await res.json();

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ ok: false, error: "proxy_error" });
  }
}
