import { NextRequest, NextResponse } from "next/server";

function n(v: any) {
  return Number(v || 0);
}

export async function GET(req: NextRequest) {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
  const url = new URL(req.url);
  const limit = Math.max(1, Math.min(50, Number(url.searchParams.get("limit") || 24)));

  try {
    const res = await fetch(`${base}/activity/wins?limit=${limit}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    const data = await res.json().catch(() => ({}));

    const items = Array.isArray(data?.items)
      ? data.items.map((item: any) => ({
          id: `activity-${item.id}`,
          user: item.user || "p***",
          display_user: item.user || "p***",
          game: String(item.game || "Game").toLowerCase(),
          game_name: item.game || "Game",
          payout: n(item.amount),
          amount_usd: n(item.amount),
          multiplier: null,
          source: "real",
          created_at: item.created_at || null,
          occurred_at: item.created_at || null,
          message: `${item.user || "Player"} won $${n(item.amount).toFixed(2)} on ${item.game || "Game"}`,
        }))
      : [];

    return NextResponse.json({
      ok: true,
      count: items.length,
      items,
    });
  } catch {
    return NextResponse.json(
      { ok: false, detail: "Live wins feed error", items: [] },
      { status: 500 }
    );
  }
}
