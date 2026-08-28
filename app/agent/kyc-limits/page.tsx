"use client";

import { useEffect, useMemo, useState } from "react";

type AgentRow = {
  id: string;
  role?: string;
  parent_id?: string | null;
  depth?: number;
};

type Rule = {
  min_withdrawal: string;
  per_withdrawal_limit: string;
  daily_limit: string;
  weekly_limit: string;
  monthly_limit: string;
  requires_manual_review_over: string;
  auto_withdraw_enabled: boolean;
  cooldown_minutes: string;
};

const blankRule: Rule = {
  min_withdrawal: "20",
  per_withdrawal_limit: "0",
  daily_limit: "0",
  weekly_limit: "0",
  monthly_limit: "0",
  requires_manual_review_over: "0",
  auto_withdraw_enabled: true,
  cooldown_minutes: "0",
};

function toRule(r: any): Rule {
  return {
    min_withdrawal: String(r?.min_withdrawal ?? 20),
    per_withdrawal_limit: String(r?.per_withdrawal_limit ?? 0),
    daily_limit: String(r?.daily_limit ?? 0),
    weekly_limit: String(r?.weekly_limit ?? 0),
    monthly_limit: String(r?.monthly_limit ?? 0),
    requires_manual_review_over: String(r?.requires_manual_review_over ?? 0),
    auto_withdraw_enabled: Boolean(r?.auto_withdraw_enabled ?? true),
    cooldown_minutes: String(r?.cooldown_minutes ?? 0),
  };
}

function validate(rule: Rule) {
  const min = Number(rule.min_withdrawal || 0);
  const per = Number(rule.per_withdrawal_limit || 0);
  const day = Number(rule.daily_limit || 0);
  const week = Number(rule.weekly_limit || 0);
  const month = Number(rule.monthly_limit || 0);
  const review = Number(rule.requires_manual_review_over || 0);

  if (per <= 0 || day <= 0 || week <= 0 || month <= 0) throw new Error("Per WD, Daily, Weekly and Monthly must be greater than 0.");
  if (min > per) throw new Error("Minimum WD cannot be greater than Per WD.");
  if (per > day) throw new Error("Daily cannot be lower than Per WD.");
  if (day > week) throw new Error("Weekly cannot be lower than Daily.");
  if (week > month) throw new Error("Monthly cannot be lower than Weekly.");
  if (review > 0 && review > per) throw new Error("Manual Review Over cannot be greater than Per WD.");
}

export default function Page() {
  const viewerId =
    typeof window !== "undefined"
      ? localStorage.getItem("agent_viewer_id") ||
        JSON.parse(localStorage.getItem("agent_session_data") || "{}").id ||
        "supercoin"
      : "supercoin";

  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [selected, setSelected] = useState("");
  const [l1, setL1] = useState<Rule>(blankRule);
  const [l2, setL2] = useState<Rule>(blankRule);
  const [meta, setMeta] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [agentSearch, setAgentSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  async function loadAgents() {
    const res = await fetch(`/ui-api/admin/hierarchy/my-tree/${encodeURIComponent(viewerId)}`, { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    const tree = Array.isArray(json?.tree) ? json.tree : [];
    const list = tree.filter((x: AgentRow) =>
      ["superadmin", "super_admin", "master_agent", "agent", "sub_agent"].includes(String(x.role || "").toLowerCase())
    );
    setAgents(list);
    if (!selected && list[0]?.id) setSelected(list[0].id);
  }

  async function loadRules(ownerId: string) {
    if (!ownerId) return;
    setBusy(true);
    setMessage("");

    try {
      const res = await fetch(
        `/ui-api/admin/kyc/rules/effective/${encodeURIComponent(ownerId)}?viewer_id=${encodeURIComponent(viewerId)}`,
        { cache: "no-store" }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.detail || "Failed to load rules");

      setMeta(json);
      setL1(toRule(json?.rules?.["1"]));
      setL2(toRule(json?.rules?.["2"]));
    } catch (e: any) {
      setMessage(e?.message || "Failed to load rules");
    } finally {
      setBusy(false);
    }
  }

  async function save(level: 1 | 2) {
    const rule = level === 1 ? l1 : l2;
    try {
      validate(rule);
      setBusy(true);
      setMessage("");

      const res = await fetch("/ui-api/admin/kyc/rules/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          viewer_id: viewerId,
          owner_id: selected,
          level,
          min_withdrawal: Number(rule.min_withdrawal || 20),
          per_withdrawal_limit: Number(rule.per_withdrawal_limit || 0),
          daily_limit: Number(rule.daily_limit || 0),
          weekly_limit: Number(rule.weekly_limit || 0),
          monthly_limit: Number(rule.monthly_limit || 0),
          requires_manual_review_over: Number(rule.requires_manual_review_over || 0),
          auto_withdraw_enabled: rule.auto_withdraw_enabled,
          cooldown_minutes: Number(rule.cooldown_minutes || 0),
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof json?.detail === "string" ? json.detail : "Failed to save");

      setMessage(`Saved ${selected} Level ${level} ✅`);
      await loadRules(selected);
    } catch (e: any) {
      setMessage(e?.message || "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  function setRule(level: 1 | 2, key: keyof Rule, value: any) {
    const setter = level === 1 ? setL1 : setL2;
    setter((prev) => ({ ...prev, [key]: value }));
  }

  useEffect(() => {
    loadAgents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selected) loadRules(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const filteredAgents = useMemo(() => {
    const q = agentSearch.trim().toLowerCase();
    return agents.filter((a) => {
      const role = String(a.role || "").toLowerCase();
      const haystack = `${a.id || ""} ${a.parent_id || ""} ${a.role || ""}`.toLowerCase();

      if (roleFilter !== "all" && role !== roleFilter) return false;
      if (q && !haystack.includes(q)) return false;
      return true;
    });
  }, [agents, agentSearch, roleFilter]);

  const selectedAgent = agents.find((a) => a.id === selected);


  function RuleCard({ level, rule }: { level: 1 | 2; rule: Rule }) {
    const source = meta?.rules?.[String(level)]?.owner_id || "-";

    return (
      <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-white">Level {level}</h2>
            <div className="mt-1 text-xs text-slate-400">Effective source: <span className="font-black text-sky-300">{source}</span></div>
          </div>
          <div className="rounded-full border border-white/10 bg-[#13232d] px-3 py-1 text-xs font-black text-slate-300">
            {meta?.rules?.[String(level)]?.source || "rule"}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
          {[
            ["min_withdrawal", "Minimum WD"],
            ["per_withdrawal_limit", "Per WD"],
            ["daily_limit", "Daily"],
            ["weekly_limit", "Weekly"],
            ["monthly_limit", "Monthly"],
            ["requires_manual_review_over", "Manual Review Over"],
            ["cooldown_minutes", "Cooldown Minutes"],
          ].map(([key, label]) => (
            <label key={key}>
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</div>
              <input
                type="number"
                min="0"
                value={(rule as any)[key]}
                onChange={(e) => setRule(level, key as keyof Rule, e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2 font-black text-white outline-none"
              />
            </label>
          ))}

          <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2">
            <span>
              <span className="block text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Auto WD</span>
              <span className="block text-xs text-slate-500">Allow withdrawal requests</span>
            </span>
            <input
              type="checkbox"
              checked={rule.auto_withdraw_enabled}
              onChange={(e) => setRule(level, "auto_withdraw_enabled", e.target.checked)}
              className="h-5 w-5"
            />
          </label>
        </div>

        <button
          disabled={busy || String(viewerId).toLowerCase() !== "supercoin"}
          onClick={() => save(level)}
          className="mt-4 w-full rounded-2xl bg-sky-500 px-4 py-3 text-sm font-black text-white disabled:opacity-50"
        >
          {busy ? "Saving..." : `Save Level ${level}`}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6 text-white">
      <div className="rounded-[28px] border border-white/5 bg-[linear-gradient(135deg,#1a2c38_0%,#13232d_100%)] p-7">
        <h1 className="text-3xl font-black">KYC Limits Management</h1>
        <p className="mt-2 text-sm text-slate-300">Configure inherited L1/L2 withdrawal rules per agent. Agents can only be equal to or stricter than their parent.</p>
      </div>

      {message ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-[#1a2c38] px-4 py-3 text-sm text-slate-100">{message}</div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">Agent Selector</h2>
              <div className="mt-1 text-xs text-slate-400">
                {filteredAgents.length} shown / {agents.length} total
              </div>
            </div>
            <button
              type="button"
              onClick={loadAgents}
              className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black text-white"
            >
              Refresh
            </button>
          </div>

          <div className="mt-4 grid gap-3">
            <input
              value={agentSearch}
              onChange={(e) => setAgentSearch(e.target.value)}
              placeholder="Search agent, master, parent..."
              className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-sm font-bold text-white outline-none"
            />

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-sm font-bold text-white outline-none"
            >
              <option value="all">All roles</option>
              <option value="superadmin">Supercoin</option>
              <option value="super_admin">Super Admin</option>
              <option value="master_agent">Master Agents</option>
              <option value="agent">Agents</option>
              <option value="sub_agent">Sub Agents</option>
            </select>
          </div>

          <div className="mt-4 max-h-[620px] overflow-y-auto pr-1">
            <div className="grid gap-3">
              {filteredAgents.length ? (
                filteredAgents.map((a) => {
                  const depth = Math.max(0, Number(a.depth || 0));
                  const isActive = selected === a.id;

                  return (
                    <button
                      key={a.id}
                      onClick={() => setSelected(a.id)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        isActive ? "border-sky-500/30 bg-sky-500/10" : "border-white/5 bg-[#13232d] hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="mt-1 h-8 shrink-0 border-l border-dashed border-slate-600"
                          style={{ marginLeft: depth * 12 }}
                        />
                        <div className="min-w-0">
                          <div className="break-all font-black text-white">{a.id}</div>
                          <div className="mt-1 text-xs text-slate-400">
                            {a.role || "-"} · parent {a.parent_id || "-"} · depth {depth}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-white/5 bg-[#13232d] p-4 text-sm text-slate-400">
                  No agents match your search.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Selected</div>
            <h2 className="mt-2 text-2xl font-black">{selected || "-"}</h2>
            <div className="mt-2 text-sm text-slate-400">
              {selectedAgent?.role || "-"} · parent {selectedAgent?.parent_id || "-"}
            </div>
          </div>

          <RuleCard level={1} rule={l1} />
          <RuleCard level={2} rule={l2} />
        </div>
      </div>
    </div>
  );
}
