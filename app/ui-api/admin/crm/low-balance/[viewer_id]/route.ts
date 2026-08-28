import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ viewer_id: string }> }
) {
  const { viewer_id } = await params;

  const base =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://127.0.0.1:8000";

  const adminKey = process.env.ADMIN_KEY || "";
  const agentToken =
    req.cookies.get("agent_token")?.value || "";

  if (!agentToken) {
    return NextResponse.json(
      { detail: "Missing agent session" },
      { status: 401 }
    );
  }

  const qs = req.nextUrl.searchParams.toString();

  try {
    const res = await fetch(
      `${base}/admin/crm/low-balance/${encodeURIComponent(
        viewer_id
      )}${qs ? `?${qs}` : ""}`,
      {
        method: "GET",
        cache: "no-store",
        headers: {
          "X-Admin-Key": adminKey,
          Authorization: `Bearer ${agentToken}`,
          Accept: "application/json",
        },
      }
    );

    const data = await res.json().catch(() => ({}));

    const out = NextResponse.json(data, {
      status: res.status,
    });

    if (res.status === 401) {
      out.cookies.delete("agent_token");
      out.cookies.delete("agent_session");
    }

    return out;
  } catch (error: any) {
    return NextResponse.json(
      {
        detail:
          error?.message ||
          "CRM proxy error",
      },
      { status: 500 }
    );
  }
}
