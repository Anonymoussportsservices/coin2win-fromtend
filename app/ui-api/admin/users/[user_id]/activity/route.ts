import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
const ADMIN_KEY = process.env.ADMIN_KEY || "";

async function getJson(url: string, withAdminKey: boolean = false) {
  const headers: Record<string, string> = {};
  if (withAdminKey && ADMIN_KEY) headers["X-Admin-Key"] = ADMIN_KEY;

  const res = await fetch(url, {
    cache: "no-store",
    headers,
  });

  const raw = await res.text();
  let data: any = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = { raw };
  }
  return { ok: res.ok, status: res.status, data };
}

function pickArray(obj: any, keys: string[]) {
  for (const k of keys) {
    if (Array.isArray(obj?.[k])) return obj[k];
  }
  return [];
}

function ts(x: any) {
  return (
    x?.created_at ||
    x?.updated_at ||
    x?.placed_at ||
    x?.settled_at ||
    x?.timestamp ||
    x?.time ||
    null
  );
}

function decorateTransaction(x: any) {
  const type = String(x?.type || "").toLowerCase();
  const ref = String(x?.reference || "");

  let __kind = "transaction";
  if (type.includes("manual_")) __kind = "adjustment";
  else if (type.includes("deposit")) __kind = "transaction_deposit";
  else if (type.includes("withdrawal")) __kind = "transaction_withdrawal";

  return {
    ...x,
    __kind,
    status: type || "transaction",
    note: ref,
  };
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ user_id: string }> }) {
  try {
    const { user_id } = await ctx.params;
    const id = encodeURIComponent(user_id);

    const [depositsRes, withdrawalsRes, diceRes, crashRes, txRes] = await Promise.allSettled([
      getJson(`${API_BASE}/deposit/${id}?limit=100`),
      getJson(`${API_BASE}/withdraw/${id}?limit=100`),
      getJson(`${API_BASE}/studio/dice/bets/${id}?limit=100`),
      getJson(`${API_BASE}/studio/crash-global/my-bets/${id}?limit=100`),
      getJson(`${API_BASE}/admin/transactions/user/${id}?limit=100`, true),
    ]);

    const depositsData = depositsRes.status === "fulfilled" ? depositsRes.value.data : {};
    const withdrawalsData = withdrawalsRes.status === "fulfilled" ? withdrawalsRes.value.data : {};
    const diceData = diceRes.status === "fulfilled" ? diceRes.value.data : {};
    const crashData = crashRes.status === "fulfilled" ? crashRes.value.data : {};
    const txData = txRes.status === "fulfilled" ? txRes.value.data : {};

    const deposits = pickArray(depositsData, ["deposits", "rows", "items"]).map((x: any) => ({ ...x, __kind: "deposit" }));
    const withdrawals = pickArray(withdrawalsData, ["withdrawals", "rows", "items"]).map((x: any) => ({ ...x, __kind: "withdrawal" }));
    const dice_bets = pickArray(diceData, ["bets", "dice_bets", "rows", "items"]).map((x: any) => ({ ...x, __kind: "dice" }));
    const crash_bets = pickArray(crashData, ["bets", "crash_bets", "my_bets", "rows", "items"]).map((x: any) => ({ ...x, __kind: "crash" }));
    const transactions = pickArray(txData, ["transactions", "rows", "items"]).map((x: any) => decorateTransaction(x));

    const all_activity = [...deposits, ...withdrawals, ...dice_bets, ...crash_bets, ...transactions].sort((a: any, b: any) => {
      const aa = ts(a) ? new Date(ts(a)).getTime() : 0;
      const bb = ts(b) ? new Date(ts(b)).getTime() : 0;
      return bb - aa;
    });

    return NextResponse.json({
      ok: true,
      user_id,
      stats: {
        deposits: deposits.length,
        withdrawals: withdrawals.length,
        dice_bets: dice_bets.length,
        crash_bets: crash_bets.length,
        transactions: transactions.length,
        adjustments: transactions.filter((x: any) => x.__kind === "adjustment").length,
        total_items: all_activity.length,
      },
      deposits,
      withdrawals,
      dice_bets,
      crash_bets,
      transactions,
      adjustments: transactions.filter((x: any) => x.__kind === "adjustment"),
      all_activity,
      errors: {
        deposits: depositsRes.status === "rejected" ? "failed" : null,
        withdrawals: withdrawalsRes.status === "rejected" ? "failed" : null,
        dice: diceRes.status === "rejected" ? "failed" : null,
        crash: crashRes.status === "rejected" ? "failed" : null,
        transactions: txRes.status === "rejected" ? "failed" : null,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, detail: err?.message || "Failed to load activity" },
      { status: 500 }
    );
  }
}
