"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type ActivityResponse = {
  ok: boolean;
  user_id: string;
  stats?: {
    deposits: number;
    withdrawals: number;
    dice_bets: number;
    crash_bets: number;
    total_items: number;
  };
  deposits: any[];
  withdrawals: any[];
  dice_bets: any[];
  crash_bets: any[];
  all_activity: any[];
  detail?: string;
};

function money(v: any) {
  return `$${Number(v || 0).toFixed(2)}`;
}

function fmtDate(v?: string | null) {
  if (!v) return "-";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "-" : d.toLocaleString();
}

function shortText(v: any, n = 28) {
  const s = String(v || "");
  return s.length > n ? `${s.slice(0, n)}...` : s || "-";
}

function getTs(x: any) {
  return x?.created_at || x?.updated_at || x?.placed_at || x?.settled_at || x?.timestamp || x?.time || null;
}

function getAmount(x: any) {
  return x?.amount_usd ?? x?.amount ?? x?.stake ?? x?.bet_amount ?? x?.wager ?? 0;
}

function getPayout(x: any) {
  return x?.payout ?? x?.payout_usd ?? x?.win_amount ?? 0;
}

function getProfit(x: any) {
  const amount = Number(getAmount(x) || 0);
  const payout = Number(getPayout(x) || 0);
  return payout - amount;
}

function getStatus(x: any) {
  return x?.status ?? x?.result ?? (typeof x?.is_win === "boolean" ? (x.is_win ? "win" : "lose") : "-");
}

function getSearchBlob(x: any) {
  return [
    x?.id,
    x?.__kind,
    x?.status,
    x?.result,
    x?.payout_currency,
    x?.pay_currency,
    x?.payout_address,
    x?.pay_address,
    x?.note,
    x?.reference,
    x?.target,
    x?.roll,
    x?.multiplier,
    x?.crash_point,
  ]
    .map((v) => String(v ?? "").toLowerCase())
    .join(" ");
}

function tabBtn(active: boolean) {
  return `rounded-2xl px-4 py-2 text-sm font-black transition ${
    active ? "bg-sky-500 text-white" : "border border-white/10 bg-[#13232d] text-slate-300 hover:bg-[#17303c]"
  }`;
}

function inputCls() {
  return "rounded-2xl border border-white/10 bg-[#13232d] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500";
}

function cardCls(kind: string) {
  if (kind === "deposit") return "border-emerald-500/20";
  if (kind === "withdrawal") return "border-amber-500/20";
  if (kind === "dice") return "border-violet-500/20";
  if (kind === "crash") return "border-sky-500/20";
  return "border-white/10";
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#13232d] p-4">
      <div className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-black text-white">{value}</div>
    </div>
  );
}

function ActivityCard({ item }: { item: any }) {
  const kind = String(item?.__kind || "activity");
  const status = String(getStatus(item));

  return (
    <div className={`rounded-3xl border bg-[#0f1c24] p-5 ${cardCls(kind)}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{kind}</div>
          <div className="mt-2 text-xl font-black text-white">{money(getAmount(item))}</div>
          <div className="mt-1 text-xs text-slate-500">{fmtDate(getTs(item))}</div>
        </div>

        <div className="rounded-full border border-white/10 bg-[#13232d] px-3 py-1 text-xs font-black text-slate-200">
          {status}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {item?.id !== undefined ? (
          <div className="rounded-2xl bg-[#13232d] px-4 py-3 text-sm text-slate-300">
            ID
            <div className="mt-1 font-black text-white">#{String(item.id)}</div>
          </div>
        ) : null}

        {item?.payout_currency ? (
          <div className="rounded-2xl bg-[#13232d] px-4 py-3 text-sm text-slate-300">
            Currency
            <div className="mt-1 font-black text-white">{String(item.payout_currency).toUpperCase()}</div>
          </div>
        ) : null}

        {item?.pay_currency ? (
          <div className="rounded-2xl bg-[#13232d] px-4 py-3 text-sm text-slate-300">
            Currency
            <div className="mt-1 font-black text-white">{String(item.pay_currency).toUpperCase()}</div>
          </div>
        ) : null}

        {item?.multiplier !== undefined ? (
          <div className="rounded-2xl bg-[#13232d] px-4 py-3 text-sm text-slate-300">
            Multiplier
            <div className="mt-1 font-black text-white">{String(item.multiplier)}</div>
          </div>
        ) : null}

        {item?.crash_point !== undefined ? (
          <div className="rounded-2xl bg-[#13232d] px-4 py-3 text-sm text-slate-300">
            Crash Point
            <div className="mt-1 font-black text-white">{String(item.crash_point)}</div>
          </div>
        ) : null}

        {item?.target !== undefined ? (
          <div className="rounded-2xl bg-[#13232d] px-4 py-3 text-sm text-slate-300">
            Target
            <div className="mt-1 font-black text-white">{String(item.target)}</div>
          </div>
        ) : null}

        {item?.roll !== undefined ? (
          <div className="rounded-2xl bg-[#13232d] px-4 py-3 text-sm text-slate-300">
            Roll
            <div className="mt-1 font-black text-white">{String(item.roll)}</div>
          </div>
        ) : null}

        <div className="rounded-2xl bg-[#13232d] px-4 py-3 text-sm text-slate-300">
          Payout
          <div className="mt-1 font-black text-white">{money(getPayout(item))}</div>
        </div>

        <div className="rounded-2xl bg-[#13232d] px-4 py-3 text-sm text-slate-300">
          Profit
          <div className="mt-1 font-black text-white">{money(getProfit(item))}</div>
        </div>
      </div>

      {(item?.payout_address || item?.pay_address || item?.note) ? (
        <div className="mt-4 grid gap-3">
          {item?.payout_address ? (
            <div className="rounded-2xl bg-[#13232d] px-4 py-3 text-sm text-slate-300">
              Payout Address
              <div className="mt-1 font-black text-white">{shortText(item.payout_address, 42)}</div>
            </div>
          ) : null}

          {item?.pay_address ? (
            <div className="rounded-2xl bg-[#13232d] px-4 py-3 text-sm text-slate-300">
              Pay Address
              <div className="mt-1 font-black text-white">{shortText(item.pay_address, 42)}</div>
            </div>
          ) : null}

          {item?.note ? (
            <div className="rounded-2xl bg-[#13232d] px-4 py-3 text-sm text-slate-300">
              Note
              <div className="mt-1 font-black text-white">{String(item.note)}</div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function AgentUserActivityPage() {
  const params = useParams<{ user_id: string }>();
  const userId = decodeURIComponent(String(params?.user_id || ""));
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"all" | "deposits" | "withdrawals" | "dice" | "crash">("all");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  useEffect(() => {
    let dead = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`/ui-api/admin/users/${encodeURIComponent(userId)}/activity`, { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.detail || "Failed to load activity");
        if (!dead) setData(json);
      } catch (e: any) {
        if (!dead) setError(e?.message || "Failed to load activity");
      } finally {
        if (!dead) setLoading(false);
      }
    }

    if (userId) load();
    return () => {
      dead = true;
    };
  }, [userId]);

  const baseItems = useMemo(() => {
    if (!data) return [];
    if (tab === "deposits") return data.deposits || [];
    if (tab === "withdrawals") return data.withdrawals || [];
    if (tab === "dice") return data.dice_bets || [];
    if (tab === "crash") return data.crash_bets || [];
    return data.all_activity || [];
  }, [data, tab]);

  const items = useMemo(() => {
    const now = Date.now();

    return baseItems.filter((item: any) => {
      const q = query.trim().toLowerCase();
      if (q && !getSearchBlob(item).includes(q)) return false;

      const status = String(getStatus(item)).toLowerCase();
      if (statusFilter !== "all" && status !== statusFilter) return false;

      if (dateFilter !== "all") {
        const ts = getTs(item);
        if (!ts) return false;
        const diff = now - new Date(ts).getTime();
        const day = 86400000;
        if (dateFilter === "1d" && diff > day) return false;
        if (dateFilter === "7d" && diff > 7 * day) return false;
        if (dateFilter === "30d" && diff > 30 * day) return false;
      }

      return true;
    });
  }, [baseItems, query, statusFilter, dateFilter]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 text-white">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Agent</div>
          <h1 className="mt-2 text-3xl font-black">Player Activity Center</h1>
          <div className="mt-2 text-slate-400">User: {userId}</div>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/agent/users/${encodeURIComponent(userId)}`}
            className="rounded-2xl border border-white/10 bg-[#13232d] px-4 py-2 font-black text-slate-200"
          >
            Back to Profile
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="rounded-2xl bg-sky-500 px-4 py-2 font-black text-white"
          >
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 md:grid-cols-5">
        <StatCard label="Total" value={data?.stats?.total_items ?? 0} />
        <StatCard label="Deposits" value={data?.stats?.deposits ?? 0} />
        <StatCard label="Withdrawals" value={data?.stats?.withdrawals ?? 0} />
        <StatCard label="Dice Bets" value={data?.stats?.dice_bets ?? 0} />
        <StatCard label="Crash Bets" value={data?.stats?.crash_bets ?? 0} />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button className={tabBtn(tab === "all")} onClick={() => setTab("all")}>All</button>
        <button className={tabBtn(tab === "deposits")} onClick={() => setTab("deposits")}>Deposits</button>
        <button className={tabBtn(tab === "withdrawals")} onClick={() => setTab("withdrawals")}>Withdrawals</button>
        <button className={tabBtn(tab === "dice")} onClick={() => setTab("dice")}>Dice Bets</button>
        <button className={tabBtn(tab === "crash")} onClick={() => setTab("crash")}>Crash Bets</button>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={inputCls()}
          placeholder="Search id, address, status, note..."
        />

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputCls()}>
          <option value="all">All Statuses</option>
          <option value="requested">Requested</option>
          <option value="approved">Approved</option>
          <option value="sent">Sent</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
          <option value="pending">Pending</option>
          <option value="finished">Finished</option>
          <option value="win">Win</option>
          <option value="lose">Lose</option>
        </select>

        <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className={inputCls()}>
          <option value="all">All Dates</option>
          <option value="1d">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>

        <div className="rounded-2xl border border-white/10 bg-[#13232d] px-4 py-3 text-sm font-black text-slate-300">
          Results: <span className="text-white">{items.length}</span>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-[#13232d] p-8 text-center text-slate-400">
          Loading activity...
        </div>
      ) : items.length ? (
        <div className="grid gap-4">
          {items.map((item: any, idx: number) => (
            <ActivityCard key={`${item?.__kind || "item"}-${item?.id ?? idx}-${idx}`} item={item} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-white/10 bg-[#13232d] p-8 text-center text-slate-400">
          No activity found.
        </div>
      )}
    </div>
  );
}
