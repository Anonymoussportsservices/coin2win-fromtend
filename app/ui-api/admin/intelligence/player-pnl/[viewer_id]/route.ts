import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  ctx: {
    params: Promise<{
      viewer_id: string;
    }>;
  }
) {
  try {
    const { viewer_id } = await ctx.params;

    const base =
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "http://127.0.0.1:8000";

    const adminKey =
      process.env.ADMIN_KEY || "";

    const agentToken =
      req.cookies.get("agent_token")?.value || "";

    if (!agentToken) {
      return NextResponse.json(
        {
          detail: "Missing agent session",
        },
        {
          status: 401,
        }
      );
    }

    const search =
      req.nextUrl.searchParams.toString();

    const res = await fetch(
      `${base}/admin/intelligence/player-pnl/${encodeURIComponent(
        viewer_id
      )}${search ? `?${search}` : ""}`,
      {
        cache: "no-store",
        headers: {
          "X-Admin-Key": adminKey,
          Authorization: `Bearer ${agentToken}`,
          Accept: "application/json",
        },
      }
    );

    const raw = await res.text();

    let data: any = {};

    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = {
        detail:
          raw ||
          `Intelligence request failed (${res.status})`,
      };
    }

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
        ok: false,
        detail:
          error?.message ||
          "Intelligence proxy failed",
      },
      {
        status: 500,
      }
    );
  }
}
