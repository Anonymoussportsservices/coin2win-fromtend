import { NextRequest, NextResponse } from "next/server";

function decodeJwtPayload(token: string) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(normalized, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const auth = req.headers.get("authorization") || "";
    const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
    const payload = token ? decodeJwtPayload(token) : null;

    const userId =
      payload?.sub ||
      payload?.user_id ||
      payload?.username ||
      "";

    if (!userId) {
      return NextResponse.json(
        { ok: false, detail: "Login required" },
        { status: 401 }
      );
    }

    const res = await fetch("http://127.0.0.1:8000/casino/softswiss/launch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Internal-Launch-Key": process.env.SOFTSWISS_LAUNCH_INTERNAL_KEY || process.env.ADMIN_KEY || "",
      },
      body: JSON.stringify({
        game_id: body?.game_id,
        mode: body?.mode || "real",
        user_id: userId,
      }),
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { ok: false, detail: "SoftSwiss launch proxy error" },
      { status: 500 }
    );
  }
}
