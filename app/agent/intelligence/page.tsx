"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Filters = {
  search: string;
  player_id: string;
  vertical: string;
  provider: string;
  game: string;
  status: string;
  min_bet: string;
  max_bet: string;
  min_payout: string;
  max_payout: string;
  min_house_net: string;
  max_house_net: string;
};

const EMPTY_FILTERS: Filters = {
  search: "",
  player_id: "",
  vertical: "",
  provider: "",
  game: "",
  status: "",
  min_bet: "",
  max_bet: "",
  min_payout: "",
  max_payout: "",
  min_house_net: "",
  max_house_net: "",
};

const RAW_SORTS = [
  ["timestamp", "Time"],
  ["player_id", "Player"],
  ["provider", "Provider"],
  ["game", "Game"],
  ["bet_amount", "Bet"],
  ["payout_amount", "Payout"],
  ["player_net", "Player Net"],
  ["house_net", "House Net"],
  ["balance_after", "Balance"],
] as const;

const GROUP_SORTS = [
  ["players", "Players"],
  ["bet_count", "Bets"],
  ["total_bet", "Total Bet"],
  ["total_payout", "Total Payout"],
  ["player_net", "Player Net"],
  ["house_net", "House Net"],
] as const;

function money(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const n = Number(value);

  if (!Number.isFinite(n)) {
    return "-";
  }

  return `$${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function numberValue(value: unknown) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n.toLocaleString() : "0";
}

function fmtDate(value: unknown) {
  if (!value) return "-";

  const d = new Date(String(value));

  if (Number.isNaN(d.getTime())) {
    return "-";
  }

  return d.toLocaleString();
}

function netClass(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "text-[var(--oxs-text-muted)]";
  }

  const n = Number(value);

  if (!Number.isFinite(n) || n === 0) {
    return "text-[var(--oxs-text-primary)]";
  }

  return n > 0
    ? "text-[var(--oxs-success)]"
    : "text-[var(--oxs-danger)]";
}

function csvCell(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);

  if (
    text.includes(",") ||
    text.includes('"') ||
    text.includes("\n") ||
    text.includes("\r")
  ) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function buildCsv(
  headers: string[],
  rows: unknown[][]
) {
  return [
    headers.map(csvCell).join(","),
    ...rows.map((row) =>
      row.map(csvCell).join(",")
    ),
  ].join("\r\n");
}

function statusClass(status: unknown) {
  const value = String(status || "").toLowerCase();

  if (value === "won" || value === "cashed_out" || value === "settled") {
    return "border-[var(--oxs-success-border)] bg-[var(--oxs-success-surface)] text-[var(--oxs-success)]";
  }

  if (value === "lost") {
    return "border-[var(--oxs-danger-border)] bg-[var(--oxs-danger-surface)] text-[var(--oxs-danger)]";
  }

  if (value === "active") {
    return "border-[var(--oxs-info-border)] bg-[var(--oxs-info-surface)] text-[var(--oxs-info)]";
  }

  return "border-[var(--oxs-border-default)] bg-[var(--oxs-surface-utility)] text-[var(--oxs-text-secondary)]";
}

export default function AgentIntelligencePage() {
  const [viewerId, setViewerId] = useState("");

  const [period, setPeriod] = useState("7d");

  const [draftStartDate, setDraftStartDate] = useState("");
  const [draftEndDate, setDraftEndDate] = useState("");
  const [appliedStartDate, setAppliedStartDate] = useState("");
  const [appliedEndDate, setAppliedEndDate] = useState("");
  const [dateMessage, setDateMessage] = useState("");

  const [groupBy, setGroupBy] = useState("none");

  const [draftFilters, setDraftFilters] =
    useState<Filters>(EMPTY_FILTERS);

  const [filters, setFilters] =
    useState<Filters>(EMPTY_FILTERS);

  const [sortBy, setSortBy] = useState("timestamp");
  const [sortDir, setSortDir] = useState("desc");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState("");

  useEffect(() => {
    try {
      const params =
        new URLSearchParams(window.location.search);

      const session = JSON.parse(
        localStorage.getItem("agent_session_data") || "{}"
      );

      const vid =
        params.get("viewer_id") ||
        localStorage.getItem("agent_viewer_id") ||
        session?.id ||
        "supercoin";

      setViewerId(vid);
      localStorage.setItem("agent_viewer_id", vid);
    } catch {
      setViewerId("supercoin");
      localStorage.setItem(
        "agent_viewer_id",
        "supercoin"
      );
    }
  }, []);

  const sortOptions = useMemo(
    () =>
      groupBy === "none"
        ? RAW_SORTS
        : GROUP_SORTS,
    [groupBy]
  );

  useEffect(() => {
    if (!viewerId) return;

    if (
      period === "custom" &&
      (!appliedStartDate || !appliedEndDate)
    ) {
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setMessage("");

        const query = new URLSearchParams();

        query.set("period", period);

        if (
          period === "custom" &&
          appliedStartDate &&
          appliedEndDate
        ) {
          query.set("start_date", appliedStartDate);
          query.set("end_date", appliedEndDate);
        }

        query.set("group_by", groupBy);
        query.set("sort_by", sortBy);
        query.set("sort_dir", sortDir);
        query.set("page", String(page));
        query.set("limit", String(limit));

        Object.entries(filters).forEach(
          ([key, value]) => {
            const clean = String(value || "").trim();

            if (clean) {
              query.set(key, clean);
            }
          }
        );

        const res = await fetch(
          `/ui-api/admin/intelligence/ledger/${encodeURIComponent(
            viewerId
          )}?${query.toString()}`,
          {
            cache: "no-store",
          }
        );

        const json = await res
          .json()
          .catch(() => ({}));

        if (!res.ok || !json?.ok) {
          throw new Error(
            json?.detail ||
              "Failed to load intelligence"
          );
        }

        if (!cancelled) {
          setData(json);
        }
      } catch (error: any) {
        if (!cancelled) {
          setMessage(
            error?.message ||
              "Failed to load intelligence"
          );
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [
    viewerId,
    period,
    appliedStartDate,
    appliedEndDate,
    groupBy,
    sortBy,
    sortDir,
    page,
    limit,
    filters,
  ]);

  const rows =
    Array.isArray(data?.items)
      ? data.items
      : [];

  const summary =
    data?.summary || {};

  const pagination =
    data?.pagination || {};

  const totalPages =
    Math.max(
      1,
      Number(pagination?.pages || 1)
    );

  const totalResults =
    Number(pagination?.total || 0);

  function updateDraft(
    key: keyof Filters,
    value: string
  ) {
    setDraftFilters((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function applyFilters() {
    setPage(1);
    setFilters({
      ...draftFilters,
    });
  }

  function clearFilters() {
    setDraftFilters(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setPage(1);
  }

  function changePeriod(value: string) {
    setDateMessage("");

    if (value === "custom") {
      setAppliedStartDate("");
      setAppliedEndDate("");
      setPeriod("custom");
      setPage(1);
      return;
    }

    setPeriod(value);
    setPage(1);
  }

  function applyCustomDate() {
    setDateMessage("");

    if (!draftStartDate || !draftEndDate) {
      setDateMessage("From and To dates are required.");
      return;
    }

    if (draftStartDate > draftEndDate) {
      setDateMessage("From date cannot be after To date.");
      return;
    }

    setAppliedStartDate(draftStartDate);
    setAppliedEndDate(draftEndDate);
    setPeriod("custom");
    setPage(1);
  }

  function changeGroup(value: string) {
    setGroupBy(value);
    setPage(1);

    if (value === "none") {
      setSortBy("timestamp");
    } else {
      setSortBy("house_net");
    }

    setSortDir("desc");
  }

  async function exportCsv() {
    if (exporting || !viewerId) {
      return;
    }

    if (
      period === "custom" &&
      (!appliedStartDate || !appliedEndDate)
    ) {
      setExportMessage(
        "Apply a valid custom date range first."
      );
      return;
    }

    try {
      setExporting(true);
      setExportMessage("");

      const buildExportQuery = (exportPage: number) => {
        const query = new URLSearchParams();

        query.set("period", period);

        if (
          period === "custom" &&
          appliedStartDate &&
          appliedEndDate
        ) {
          query.set(
            "start_date",
            appliedStartDate
          );
          query.set(
            "end_date",
            appliedEndDate
          );
        }

        query.set("group_by", groupBy);
        query.set("sort_by", sortBy);
        query.set("sort_dir", sortDir);
        query.set("page", String(exportPage));
        query.set("limit", "200");

        Object.entries(filters).forEach(
          ([key, value]) => {
            const clean = String(
              value || ""
            ).trim();

            if (clean) {
              query.set(key, clean);
            }
          }
        );

        return query;
      };

      const fetchExportPage = async (
        exportPage: number
      ) => {
        const query =
          buildExportQuery(exportPage);

        const res = await fetch(
          `/ui-api/admin/intelligence/ledger/${encodeURIComponent(
            viewerId
          )}?${query.toString()}`,
          {
            cache: "no-store",
          }
        );

        const json = await res
          .json()
          .catch(() => ({}));

        if (!res.ok || !json?.ok) {
          throw new Error(
            json?.detail ||
              "Failed to export intelligence"
          );
        }

        return json;
      };

      const first = await fetchExportPage(1);

      const allRows = Array.isArray(
        first?.items
      )
        ? [...first.items]
        : [];

      const exportPages = Math.max(
        1,
        Number(first?.pagination?.pages || 1)
      );

      for (
        let exportPage = 2;
        exportPage <= exportPages;
        exportPage += 1
      ) {
        const next =
          await fetchExportPage(exportPage);

        if (Array.isArray(next?.items)) {
          allRows.push(...next.items);
        }
      }

      let headers: string[] = [];
      let csvRows: unknown[][] = [];

      if (groupBy === "none") {
        headers = [
          "Timestamp",
          "Placed At",
          "Settled At",
          "Player",
          "Vertical",
          "Provider",
          "Game",
          "Round ID",
          "Activity Type",
          "Bet Amount",
          "Payout Amount",
          "Player Net",
          "House Net",
          "Balance After",
          "Reference",
          "Status",
          "Result",
          "Currency",
          "Provider Transaction ID",
          "Source Table",
          "Source ID",
          "Settled",
        ];

        csvRows = allRows.map((row: any) => [
          row.timestamp,
          row.placed_at,
          row.settled_at,
          row.player_id,
          row.vertical,
          row.provider,
          row.game,
          row.round_id,
          row.activity_type,
          row.bet_amount,
          row.payout_amount,
          row.player_net,
          row.house_net,
          row.balance_after,
          row.reference,
          row.status,
          row.result,
          row.currency,
          row.provider_transaction_id,
          row.source_table,
          row.source_id,
          row.is_settled,
        ]);
      } else {
        headers = [
          "Group",
          "Players",
          "Bets",
          "Total Bet",
          "Total Payout",
          "Player Net",
          "House Net",
        ];

        csvRows = allRows.map((row: any) => [
          row.group_key,
          row.players,
          row.bet_count,
          row.total_bet,
          row.total_payout,
          row.player_net,
          row.house_net,
        ]);
      }

      const csv = buildCsv(headers, csvRows);

      const now = new Date();
      const localDate = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(
          2,
          "0"
        ),
        String(now.getDate()).padStart(2, "0"),
      ].join("-");

      const filename =
        period === "custom" &&
        appliedStartDate &&
        appliedEndDate
          ? `coin2win-intelligence-${appliedStartDate}-to-${appliedEndDate}.csv`
          : `coin2win-intelligence-${localDate}.csv`;

      const blob = new Blob(
        ["\uFEFF", csv],
        {
          type: "text/csv;charset=utf-8",
        }
      );

      const url =
        URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch (error: any) {
      setExportMessage(
        error?.message ||
          "Failed to export intelligence"
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1600px]">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--oxs-text-primary)] md:text-3xl">
            Intelligence
          </h1>

          <div className="mt-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--oxs-text-muted)]">
            Viewing: {viewerId || "-"}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            ["today", "Today"],
            ["7d", "7D"],
            ["30d", "30D"],
            ["all", "All"],
            ["custom", "Custom"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() =>
                changePeriod(value)
              }
              className={[
                "rounded-xl border px-3 py-2 text-xs font-black uppercase transition",
                period === value
                  ? "border-emerald-400/30 bg-emerald-400 text-[#071824]"
                  : "border-[var(--oxs-border-default)] bg-[var(--oxs-surface-utility)] text-[var(--oxs-text-strong)] hover:bg-[var(--oxs-surface-utility-hover)]",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {period === "custom" ? (
        <div className="mb-4 flex flex-wrap items-end gap-2 rounded-2xl border border-[var(--oxs-border-panel)] bg-[var(--oxs-surface-panel)] p-3">
          <label className="flex min-w-[150px] flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--oxs-text-muted)]">
              From
            </span>
            <input
              type="date"
              value={draftStartDate}
              onChange={(e) => {
                setDraftStartDate(e.target.value);
                setDateMessage("");
              }}
              className="rounded-xl border border-[var(--oxs-border-default)] bg-[var(--oxs-surface-utility)] px-3 py-2 text-sm text-[var(--oxs-text-primary)] outline-none"
            />
          </label>

          <label className="flex min-w-[150px] flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--oxs-text-muted)]">
              To
            </span>
            <input
              type="date"
              value={draftEndDate}
              onChange={(e) => {
                setDraftEndDate(e.target.value);
                setDateMessage("");
              }}
              className="rounded-xl border border-[var(--oxs-border-default)] bg-[var(--oxs-surface-utility)] px-3 py-2 text-sm text-[var(--oxs-text-primary)] outline-none"
            />
          </label>

          <button
            type="button"
            onClick={applyCustomDate}
            className="rounded-xl bg-emerald-400 px-4 py-2 text-xs font-black uppercase text-[#071824]"
          >
            Apply
          </button>

          {dateMessage ? (
            <div className="w-full text-xs font-bold text-[var(--oxs-danger)]">
              {dateMessage}
            </div>
          ) : null}
        </div>
      ) : null}

      <section className="mb-4 overflow-hidden rounded-2xl border border-[var(--oxs-border-panel)] bg-[var(--oxs-surface-panel)]">
        <div className="grid grid-cols-2 divide-x divide-y divide-[var(--oxs-border-subtle)] md:grid-cols-5 md:divide-y-0">
          <div className="px-4 py-3">
            <div className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--oxs-text-muted)]">
              Total Bet
            </div>

            <div className="mt-1 text-lg font-black text-[var(--oxs-text-primary)]">
              {money(summary.total_bet)}
            </div>
          </div>

          <div className="px-4 py-3">
            <div className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--oxs-text-muted)]">
              Total Payout
            </div>

            <div className="mt-1 text-lg font-black text-[var(--oxs-text-primary)]">
              {money(summary.total_payout)}
            </div>
          </div>

          <div className="px-4 py-3">
            <div className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--oxs-text-muted)]">
              House Net
            </div>

            <div
              className={[
                "mt-1 text-lg font-black",
                netClass(summary.house_net),
              ].join(" ")}
            >
              {money(summary.house_net)}
            </div>
          </div>

          <div className="px-4 py-3">
            <div className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--oxs-text-muted)]">
              Players
            </div>

            <div className="mt-1 text-lg font-black text-[var(--oxs-text-primary)]">
              {numberValue(summary.players)}
            </div>
          </div>

          <div className="px-4 py-3">
            <div className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--oxs-text-muted)]">
              Open Bets
            </div>

            <div className="mt-1 text-lg font-black text-[var(--oxs-text-primary)]">
              {numberValue(
                summary.open_bet_count
              )}
            </div>
          </div>
        </div>

        {exportMessage ? (
          <div className="mt-3 text-xs font-bold text-[var(--oxs-danger)]">
            {exportMessage}
          </div>
        ) : null}
      </section>

      <section className="mb-4 rounded-2xl border border-[var(--oxs-border-panel)] bg-[var(--oxs-surface-panel)] p-3">
        <div className="flex flex-wrap items-end gap-2">
          <label className="min-w-[220px] flex-1">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.12em] text-[var(--oxs-text-muted)]">
              Search
            </span>

            <input
              value={draftFilters.search}
              onChange={(e) =>
                updateDraft(
                  "search",
                  e.target.value
                )
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  applyFilters();
                }
              }}
              placeholder="Player, reference, round, game"
              className="h-10 w-full rounded-xl border border-[var(--oxs-border-default)] bg-[var(--oxs-surface-secondary)] px-3 text-sm text-[var(--oxs-text-primary)] outline-none"
            />
          </label>

          <label className="min-w-[150px]">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.12em] text-[var(--oxs-text-muted)]">
              Player
            </span>

            <input
              value={
                draftFilters.player_id
              }
              onChange={(e) =>
                updateDraft(
                  "player_id",
                  e.target.value
                )
              }
              className="h-10 w-full rounded-xl border border-[var(--oxs-border-default)] bg-[var(--oxs-surface-secondary)] px-3 text-sm text-[var(--oxs-text-primary)] outline-none"
            />
          </label>

          <label className="min-w-[130px]">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.12em] text-[var(--oxs-text-muted)]">
              Vertical
            </span>

            <select
              value={draftFilters.vertical}
              onChange={(e) =>
                updateDraft(
                  "vertical",
                  e.target.value
                )
              }
              className="h-10 w-full rounded-xl border border-[var(--oxs-border-default)] bg-[var(--oxs-surface-secondary)] px-3 text-sm text-[var(--oxs-text-primary)]"
            >
              <option value="">All</option>
              <option value="Casino">
                Casino
              </option>
            </select>
          </label>

          <label className="min-w-[190px]">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.12em] text-[var(--oxs-text-muted)]">
              Provider
            </span>

            <select
              value={draftFilters.provider}
              onChange={(e) =>
                updateDraft(
                  "provider",
                  e.target.value
                )
              }
              className="h-10 w-full rounded-xl border border-[var(--oxs-border-default)] bg-[var(--oxs-surface-secondary)] px-3 text-sm text-[var(--oxs-text-primary)]"
            >
              <option value="">All</option>
              <option value="Coin2Win Originals">
                Coin2Win Originals
              </option>
            </select>
          </label>

          <label className="min-w-[135px]">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.12em] text-[var(--oxs-text-muted)]">
              Game
            </span>

            <select
              value={draftFilters.game}
              onChange={(e) =>
                updateDraft(
                  "game",
                  e.target.value
                )
              }
              className="h-10 w-full rounded-xl border border-[var(--oxs-border-default)] bg-[var(--oxs-surface-secondary)] px-3 text-sm text-[var(--oxs-text-primary)]"
            >
              <option value="">All</option>
              <option value="Coinflip">
                Coinflip
              </option>
              <option value="Dice">
                Dice
              </option>
              <option value="Mines">
                Mines
              </option>
              <option value="Hi-Lo">
                Hi-Lo
              </option>
              <option value="Crash">
                Crash
              </option>
            </select>
          </label>

          <label className="min-w-[135px]">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.12em] text-[var(--oxs-text-muted)]">
              Status
            </span>

            <select
              value={draftFilters.status}
              onChange={(e) =>
                updateDraft(
                  "status",
                  e.target.value
                )
              }
              className="h-10 w-full rounded-xl border border-[var(--oxs-border-default)] bg-[var(--oxs-surface-secondary)] px-3 text-sm text-[var(--oxs-text-primary)]"
            >
              <option value="">All</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
              <option value="active">
                Active
              </option>
              <option value="cashed_out">
                Cashed Out
              </option>
            </select>
          </label>

          {[
            ["min_bet", "Min Bet"],
            ["max_bet", "Max Bet"],
            ["min_payout", "Min Payout"],
            ["max_payout", "Max Payout"],
            [
              "min_house_net",
              "Min House Net",
            ],
            [
              "max_house_net",
              "Max House Net",
            ],
          ].map(([key, label]) => (
            <label
              key={key}
              className="w-[125px]"
            >
              <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.12em] text-[var(--oxs-text-muted)]">
                {label}
              </span>

              <input
                type="number"
                step="0.01"
                value={
                  draftFilters[
                    key as keyof Filters
                  ]
                }
                onChange={(e) =>
                  updateDraft(
                    key as keyof Filters,
                    e.target.value
                  )
                }
                className="h-10 w-full rounded-xl border border-[var(--oxs-border-default)] bg-[var(--oxs-surface-secondary)] px-3 text-sm text-[var(--oxs-text-primary)] outline-none"
              />
            </label>
          ))}

          <button
            type="button"
            onClick={applyFilters}
            className="h-10 rounded-xl bg-emerald-400 px-4 text-xs font-black uppercase text-[#071824]"
          >
            Apply
          </button>

          <button
            type="button"
            onClick={clearFilters}
            className="h-10 rounded-xl border border-[var(--oxs-border-default)] bg-[var(--oxs-surface-utility)] px-4 text-xs font-black uppercase text-[var(--oxs-text-strong)]"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={exportCsv}
            disabled={exporting || loading}
            className="h-10 rounded-xl border border-sky-400/30 bg-sky-400/10 px-4 text-xs font-black uppercase text-sky-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-[var(--oxs-border-subtle)] pt-3">
          <label className="min-w-[150px]">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.12em] text-[var(--oxs-text-muted)]">
              Group By
            </span>

            <select
              value={groupBy}
              onChange={(e) =>
                changeGroup(e.target.value)
              }
              className="h-10 w-full rounded-xl border border-[var(--oxs-border-default)] bg-[var(--oxs-surface-secondary)] px-3 text-sm text-[var(--oxs-text-primary)]"
            >
              <option value="none">None</option>
              <option value="player">
                Player
              </option>
              <option value="vertical">
                Vertical
              </option>
              <option value="provider">
                Provider
              </option>
              <option value="game">Game</option>
            </select>
          </label>

          <label className="min-w-[150px]">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.12em] text-[var(--oxs-text-muted)]">
              Sort
            </span>

            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-xl border border-[var(--oxs-border-default)] bg-[var(--oxs-surface-secondary)] px-3 text-sm text-[var(--oxs-text-primary)]"
            >
              {sortOptions.map(
                ([value, label]) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {label}
                  </option>
                )
              )}
            </select>
          </label>

          <label className="min-w-[120px]">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.12em] text-[var(--oxs-text-muted)]">
              Direction
            </span>

            <select
              value={sortDir}
              onChange={(e) => {
                setSortDir(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-xl border border-[var(--oxs-border-default)] bg-[var(--oxs-surface-secondary)] px-3 text-sm text-[var(--oxs-text-primary)]"
            >
              <option value="desc">
                Desc
              </option>
              <option value="asc">
                Asc
              </option>
            </select>
          </label>

          <label className="min-w-[105px]">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.12em] text-[var(--oxs-text-muted)]">
              Rows
            </span>

            <select
              value={limit}
              onChange={(e) => {
                setLimit(
                  Number(e.target.value)
                );
                setPage(1);
              }}
              className="h-10 w-full rounded-xl border border-[var(--oxs-border-default)] bg-[var(--oxs-surface-secondary)] px-3 text-sm text-[var(--oxs-text-primary)]"
            >
              {[25, 50, 100, 200].map(
                (value) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {value}
                  </option>
                )
              )}
            </select>
          </label>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[var(--oxs-border-panel)] bg-[var(--oxs-surface-panel)]">
        {message ? (
          <div className="border-b border-[var(--oxs-danger-border-soft)] bg-[var(--oxs-danger-surface)] px-4 py-3 text-sm font-bold text-[var(--oxs-danger-soft)]">
            {message}
          </div>
        ) : null}

        {loading ? (
          <div className="px-4 py-8 text-sm font-bold text-[var(--oxs-text-muted)]">
            Loading...
          </div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-8 text-sm font-bold text-[var(--oxs-text-muted)]">
            No activity found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            {groupBy === "none" ? (
              <table className="w-full min-w-[1500px] border-collapse text-left text-xs">
                <thead className="bg-[var(--oxs-surface-secondary)] text-[10px] font-black uppercase tracking-[0.12em] text-[var(--oxs-text-muted)]">
                  <tr>
                    {[
                      "Time",
                      "Player",
                      "Vertical",
                      "Provider",
                      "Game",
                      "Round",
                      "Bet",
                      "Payout",
                      "Player Net",
                      "House Net",
                      "Balance",
                      "Status",
                      "Reference",
                    ].map((label) => (
                      <th
                        key={label}
                        className="whitespace-nowrap border-b border-[var(--oxs-border-subtle)] px-3 py-2.5"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {rows.map(
                    (row: any) => (
                      <tr
                        key={`${row.source_table}:${row.source_id}`}
                        className="border-b border-[var(--oxs-border-subtle)] last:border-b-0 hover:bg-[var(--oxs-surface-utility)]"
                      >
                        <td className="whitespace-nowrap px-3 py-2.5 text-[var(--oxs-text-secondary)]">
                          {fmtDate(
                            row.timestamp ||
                              row.placed_at
                          )}
                        </td>

                        <td className="whitespace-nowrap px-3 py-2.5">
                          <Link
                            href={`/agent/users/${encodeURIComponent(
                              row.player_id
                            )}?viewer_id=${encodeURIComponent(
                              viewerId
                            )}`}
                            className="font-black text-[var(--oxs-text-primary)] hover:text-sky-300"
                          >
                            {row.player_id ||
                              "-"}
                          </Link>
                        </td>

                        <td className="whitespace-nowrap px-3 py-2.5 text-[var(--oxs-text-secondary)]">
                          {row.vertical || "-"}
                        </td>

                        <td className="whitespace-nowrap px-3 py-2.5 text-[var(--oxs-text-secondary)]">
                          {row.provider || "-"}
                        </td>

                        <td className="whitespace-nowrap px-3 py-2.5 font-bold text-[var(--oxs-text-primary)]">
                          {row.game || "-"}
                        </td>

                        <td className="whitespace-nowrap px-3 py-2.5 text-[var(--oxs-text-secondary)]">
                          {row.round_id ?? "-"}
                        </td>

                        <td className="whitespace-nowrap px-3 py-2.5 font-black text-[var(--oxs-text-primary)]">
                          {money(
                            row.bet_amount
                          )}
                        </td>

                        <td className="whitespace-nowrap px-3 py-2.5 font-black text-[var(--oxs-text-primary)]">
                          {money(
                            row.payout_amount
                          )}
                        </td>

                        <td
                          className={[
                            "whitespace-nowrap px-3 py-2.5 font-black",
                            netClass(
                              row.player_net
                            ),
                          ].join(" ")}
                        >
                          {money(
                            row.player_net
                          )}
                        </td>

                        <td
                          className={[
                            "whitespace-nowrap px-3 py-2.5 font-black",
                            netClass(
                              row.house_net
                            ),
                          ].join(" ")}
                        >
                          {money(
                            row.house_net
                          )}
                        </td>

                        <td className="whitespace-nowrap px-3 py-2.5 font-bold text-[var(--oxs-text-secondary)]">
                          {money(
                            row.balance_after
                          )}
                        </td>

                        <td className="whitespace-nowrap px-3 py-2.5">
                          <span
                            className={[
                              "inline-flex rounded-full border px-2 py-1 text-[10px] font-black uppercase",
                              statusClass(
                                row.status
                              ),
                            ].join(" ")}
                          >
                            {row.status || "-"}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[11px] text-[var(--oxs-text-secondary)]">
                          {row.reference || "-"}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full min-w-[850px] border-collapse text-left text-xs">
                <thead className="bg-[var(--oxs-surface-secondary)] text-[10px] font-black uppercase tracking-[0.12em] text-[var(--oxs-text-muted)]">
                  <tr>
                    {[
                      "Group",
                      "Players",
                      "Bets",
                      "Total Bet",
                      "Total Payout",
                      "Player Net",
                      "House Net",
                    ].map((label) => (
                      <th
                        key={label}
                        className="whitespace-nowrap border-b border-[var(--oxs-border-subtle)] px-3 py-2.5"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {rows.map(
                    (row: any) => (
                      <tr
                        key={String(
                          row.group_key
                        )}
                        className="border-b border-[var(--oxs-border-subtle)] last:border-b-0 hover:bg-[var(--oxs-surface-utility)]"
                      >
                        <td className="whitespace-nowrap px-3 py-2.5 font-black text-[var(--oxs-text-primary)]">
                          {row.group_key ||
                            "-"}
                        </td>

                        <td className="whitespace-nowrap px-3 py-2.5 text-[var(--oxs-text-secondary)]">
                          {numberValue(
                            row.players
                          )}
                        </td>

                        <td className="whitespace-nowrap px-3 py-2.5 text-[var(--oxs-text-secondary)]">
                          {numberValue(
                            row.bet_count
                          )}
                        </td>

                        <td className="whitespace-nowrap px-3 py-2.5 font-black text-[var(--oxs-text-primary)]">
                          {money(
                            row.total_bet
                          )}
                        </td>

                        <td className="whitespace-nowrap px-3 py-2.5 font-black text-[var(--oxs-text-primary)]">
                          {money(
                            row.total_payout
                          )}
                        </td>

                        <td
                          className={[
                            "whitespace-nowrap px-3 py-2.5 font-black",
                            netClass(
                              row.player_net
                            ),
                          ].join(" ")}
                        >
                          {money(
                            row.player_net
                          )}
                        </td>

                        <td
                          className={[
                            "whitespace-nowrap px-3 py-2.5 font-black",
                            netClass(
                              row.house_net
                            ),
                          ].join(" ")}
                        >
                          {money(
                            row.house_net
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-[var(--oxs-border-subtle)] px-4 py-3 text-xs md:flex-row md:items-center md:justify-between">
          <div className="font-bold text-[var(--oxs-text-muted)]">
            {numberValue(totalResults)} results
            {" · "}
            Page {page} of {totalPages}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={
                loading || page <= 1
              }
              onClick={() =>
                setPage((current) =>
                  Math.max(
                    1,
                    current - 1
                  )
                )
              }
              className="rounded-xl border border-[var(--oxs-border-default)] bg-[var(--oxs-surface-utility)] px-4 py-2 font-black text-[var(--oxs-text-strong)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <span className="min-w-[90px] text-center font-black text-[var(--oxs-text-primary)]">
              {page} / {totalPages}
            </span>

            <button
              type="button"
              disabled={
                loading ||
                page >= totalPages
              }
              onClick={() =>
                setPage((current) =>
                  Math.min(
                    totalPages,
                    current + 1
                  )
                )
              }
              className="rounded-xl border border-[var(--oxs-border-default)] bg-[var(--oxs-surface-utility)] px-4 py-2 font-black text-[var(--oxs-text-strong)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
