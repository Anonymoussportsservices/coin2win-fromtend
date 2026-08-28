import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export async function GET(req: NextRequest, ctx: { params: Promise<{ user_id: string; filename: string }> }) {
  const { user_id, filename } = await ctx.params;
  const adminKey = process.env.ADMIN_KEY || "";
  const viewerId = req.nextUrl.searchParams.get("viewer_id") || "";
  const qs = viewerId ? `?viewer_id=${encodeURIComponent(viewerId)}` : "";

  const res = await fetch(
    `${API_BASE}/admin/kyc/file/${encodeURIComponent(user_id)}/${encodeURIComponent(filename)}${qs}`,
    { headers: { "X-Admin-Key": adminKey }, cache: "no-store" }
  );

  const body = await res.arrayBuffer();
  return new NextResponse(body, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "application/octet-stream",
      "Content-Disposition": "inline",
    },
  });
}
