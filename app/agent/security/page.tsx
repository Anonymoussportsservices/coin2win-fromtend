"use client";

import { useEffect, useMemo, useState } from "react";

type AnyRow = Record<string, any>;

function getSession() {
  try {
    return JSON.parse(localStorage.getItem("agent_session_data") || "{}");
  } catch {
    return {};
  }
}

function canView() {
  const s = getSession();
  const role = String(s?.role || "").toLowerCase();
  const id = String(s?.id || "").toLowerCase();
  return id === "supercoin" ||
    role === "superadmin" ||
    role === "master_agent" ||
    role === "agent" ||
    role === "sub_agent";
}

async function getJson(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.detail || "Request failed");
  return data;
}

function shortHash(v?: string) {
  return v ? `${String(v).slice(0, 16)}…` : "-";
}

function fmtDate(v?: string) {
  if (!v) return "-";
  try {
    return new Date(v).toLocaleString();
  } catch {
    return v;
  }
}

function deviceLabel(ua?: string) {
  const v = String(ua || "").toLowerCase();
  if (v.includes("iphone") || v.includes("ipad")) return "iOS";
  if (v.includes("android")) return "Android";
  if (v.includes("windows")) return "Windows";
  if (v.includes("mac os") || v.includes("macintosh")) return "Mac";
  if (v.includes("linux")) return "Linux";
  return "Unknown";
}

function browserLabel(ua?: string) {
  const v = String(ua || "").toLowerCase();
  if (v.includes("edg/")) return "Edge";
  if (v.includes("chrome/")) return "Chrome";
  if (v.includes("safari/") && !v.includes("chrome/")) return "Safari";
  if (v.includes("firefox/")) return "Firefox";
  return "Browser";
}

function accountLabel(r: AnyRow) {
  const type = String(r.account_type || "-");
  const id = r.user_id || r.agent_id || "-";
  return `${type}: ${id}`;
}

function badge(text: string, tone: "green" | "red" | "yellow" | "blue" | "slate" = "slate") {
  const map: Record<string, string> = {
    green: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
    red: "bg-red-500/15 text-red-300 border-red-500/25",
    yellow: "bg-yellow-500/15 text-yellow-300 border-yellow-500/25",
    blue: "bg-sky-500/15 text-sky-300 border-sky-500/25",
    slate: "bg-slate-500/15 text-slate-300 border-slate-500/25",
  };
  return <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-black ${map[tone]}`}>{text}</span>;
}

export default function SecurityCenterPage() {
  const [allowed, setAllowed] = useState(false);
  const [tab, setTab] = useState<"ip" | "device" | "logins" | "actions">("logins");
  const [ip, setIp] = useState("");
  const [device, setDevice] = useState("");
  const [queryUser, setQueryUser] = useState("");
  const [actionUser, setActionUser] = useState("");
  const [loginData, setLoginData] = useState<any>(null);
  const [ipData, setIpData] = useState<any>(null);
  const [deviceData, setDeviceData] = useState<any>(null);
  const [actionData, setActionData] = useState<any>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [viewerId, setViewerId] = useState("");

  useEffect(() => {
    const session = getSession();
    const params = new URLSearchParams(window.location.search);
    const resolvedViewer =
      params.get("viewer_id") ||
      localStorage.getItem("agent_viewer_id") ||
      session?.id ||
      "";
    setViewerId(resolvedViewer);
    setAllowed(canView());
  }, []);

  useEffect(() => {
    if (!viewerId) return;
    loadLogins();
    loadActions();
  }, [viewerId]);

  async function run(fn: () => Promise<void>) {
    setErr("");
    setBusy(true);
    try {
      await fn();
    } catch (e: any) {
      setErr(e?.message || "Request failed");
    } finally {
      setBusy(false);
    }
  }

  async function loadLogins() {
    await run(async () => {
      const qs = new URLSearchParams({ limit: "100", viewer_id: viewerId });
      if (queryUser.trim()) qs.set("user_id", queryUser.trim());
      const data = await getJson(`/ui-api/admin/security/login-logs?${qs.toString()}`);
      setLoginData(data);
    });
  }

  async function lookupIp(v = ip) {
    await run(async () => {
      const target = v.trim();
      if (!target) throw new Error("Enter an IP address");
      const data = await getJson(`/ui-api/admin/security/ip-lookup?viewer_id=${encodeURIComponent(viewerId)}&ip_address=${encodeURIComponent(target)}`);
      setIpData(data);
      setIp(target);
      setTab("ip");
    });
  }

  async function lookupDevice(v = device) {
    await run(async () => {
      const target = v.trim();
      if (!target) throw new Error("Enter a device hash");
      const data = await getJson(`/ui-api/admin/security/device-lookup?viewer_id=${encodeURIComponent(viewerId)}&device_hash=${encodeURIComponent(target)}`);
      setDeviceData(data);
      setDevice(target);
      setTab("device");
    });
  }

  async function loadActions() {
    await run(async () => {
      const qs = new URLSearchParams({ limit: "100", viewer_id: viewerId });
      if (actionUser.trim()) qs.set("target_user_id", actionUser.trim());
      const data = await getJson(`/ui-api/admin/security/action-logs?${qs.toString()}`);
      setActionData(data);
    });
  }

  const loginRows = loginData?.logs || [];
  const actionRows = actionData?.logs || [];

  const sharedIpRows = useMemo(() => {
    const counts = new Map<string, Set<string>>();
    for (const r of loginRows) {
      if (!r.ip_address) continue;
      const key = r.user_id || r.agent_id || r.login_identifier || "";
      if (!counts.has(r.ip_address)) counts.set(r.ip_address, new Set());
      if (key) counts.get(r.ip_address)!.add(key);
    }
    return Array.from(counts.entries()).filter(([, set]) => set.size > 1);
  }, [loginRows]);

  if (!allowed) {
    return (
      <div className="p-6">
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">
          <div className="text-xl font-black">Security Center restricted</div>
          <p className="mt-2 text-sm">Only master agents and superadmins can view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="grid max-w-full gap-4 overflow-x-hidden p-3 md:gap-5 md:p-6">
      <section className="max-w-full overflow-hidden rounded-3xl border border-white/5 bg-[#13202a] p-3 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">Security Center</div>
            <h1 className="mt-1 text-2xl font-black text-white">IP / Device / Audit Lookup</h1>
            <p className="mt-1 text-sm text-slate-400">Compare player, agent, and admin activity from the security logs.</p>
          </div>
          <div className="flex max-w-full gap-2 overflow-x-auto pb-1 md:flex-wrap">
            {["ip", "device", "logins", "actions"].map((x) => (
              <button
                key={x}
                onClick={() => setTab(x as any)}
                className={`shrink-0 rounded-2xl px-4 py-2 text-sm font-black ${tab === x ? "bg-emerald-500 text-[#071824]" : "bg-white/5 text-slate-200"}`}
              >
                {x === "ip" ? "IP" : x === "device" ? "Device" : x === "logins" ? "Logins" : "Actions"}
              </button>
            ))}
          </div>
        </div>
      </section>

      {err ? <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 font-bold text-red-200">{err}</div> : null}

      <section className="grid max-w-full gap-3 rounded-3xl border border-white/5 bg-[#13202a] p-3 md:grid-cols-2 md:p-5">
        <div>
          <label className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Search IP</label>
          <div className="mt-2 grid gap-2 sm:flex">
            <input value={ip} onChange={(e) => setIp(e.target.value)} placeholder="186.151.100.237" className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#0f212e] px-4 py-3 text-white outline-none" />
            <button disabled={busy} onClick={() => lookupIp()} className="rounded-2xl bg-emerald-500 px-4 py-3 font-black text-[#071824]">Lookup</button>
          </div>
        </div>
        <div>
          <label className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Search Device Hash</label>
          <div className="mt-2 grid gap-2 sm:flex">
            <input value={device} onChange={(e) => setDevice(e.target.value)} placeholder="device_hash..." className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#0f212e] px-4 py-3 text-white outline-none" />
            <button disabled={busy} onClick={() => lookupDevice()} className="rounded-2xl bg-emerald-500 px-4 py-3 font-black text-[#071824]">Lookup</button>
          </div>
        </div>
      </section>

      {sharedIpRows.length ? (
        <section className="rounded-3xl border border-yellow-500/20 bg-yellow-500/10 p-5">
          <div className="text-sm font-black text-yellow-300">Shared IPs detected in recent login sample</div>
          <div className="mt-3 grid gap-2">
            {sharedIpRows.map(([addr, set]) => (
              <button key={addr} onClick={() => lookupIp(addr)} className="rounded-2xl bg-black/20 p-3 text-left text-sm text-yellow-100">
                <b>{addr}</b> · {set.size} accounts
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {tab === "ip" && (
        <section className="grid gap-4">
          <Card title={`IP Results ${ipData?.ip_address ? `· ${ipData.ip_address}` : ""}`}>
            {ipData?.geoip ? (
              <div className="mb-5 overflow-hidden rounded-3xl border border-emerald-500/15 bg-gradient-to-br from-[#10242f] via-[#0f212e] to-[#0b1620] shadow-2xl shadow-black/20">
                <div className="border-b border-white/5 p-4 md:p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">IP Location</div>
                      <div className="mt-2 text-2xl font-black text-white">
                        {ipData.geoip.city || "-"}, {ipData.geoip.country || "-"}
                      </div>
                      <div className="mt-1 text-sm text-slate-400">{ipData.geoip.region || "-"} · {ipData.geoip.timezone || "-"}</div>
                    </div>
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm">
                      <div className="text-xs font-black uppercase tracking-[0.14em] text-emerald-300">Coordinates</div>
                      <div className="mt-1 font-black text-white">{ipData.geoip.lat || "-"}, {ipData.geoip.lon || "-"}</div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 p-4 text-sm md:grid-cols-3 md:p-5">
                  <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
                    <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Country</div>
                    <div className="mt-2 text-lg font-black text-white">{ipData.geoip.country || "-"}</div>
                    <div className="text-xs text-slate-400">{ipData.geoip.country_code || "-"}</div>
                  </div>

                  <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
                    <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">ISP</div>
                    <div className="mt-2 font-black text-white">{ipData.geoip.isp || "-"}</div>
                    <div className="mt-1 text-xs text-slate-400">{ipData.geoip.org || "-"}</div>
                  </div>

                  <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
                    <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Network</div>
                    <div className="mt-2 font-black text-white">{ipData.geoip.asn || "-"}</div>
                    <div className="mt-1 text-xs text-slate-400">{ipData.geoip.ip || ipData.ip_address || "-"}</div>
                  </div>
                </div>
              </div>
            ) : null}
            <MiniTable
              rows={ipData?.users || []}
              columns={["account_type", "user_id", "agent_id", "login_identifier", "login_count", "has_success", "last_seen_at"]}
              render={(r, c) => c === "has_success" ? badge(String(Boolean(r[c])), r[c] ? "green" : "red") : c === "last_seen_at" ? fmtDate(r[c]) : String(r[c] ?? "-")}
            />
          </Card>
          <Card title="Devices on this IP">
            <MiniTable
              rows={ipData?.devices || []}
              columns={["device_hash", "login_count", "last_seen_at"]}
              render={(r, c) => c === "device_hash" ? <button className="text-emerald-300 underline" onClick={() => lookupDevice(r[c])}>{shortHash(r[c])}</button> : c === "last_seen_at" ? fmtDate(r[c]) : String(r[c] ?? "-")}
            />
          </Card>
        </section>
      )}

      {tab === "device" && (
        <section className="grid gap-4">
          <Card title={`Device Results ${deviceData?.device_hash ? `· ${shortHash(deviceData.device_hash)}` : ""}`}>
            <MiniTable
              rows={deviceData?.accounts || []}
              columns={["account_type", "user_id", "agent_id", "login_identifier", "login_count", "has_success", "last_seen_at"]}
              render={(r, c) => c === "has_success" ? badge(String(Boolean(r[c])), r[c] ? "green" : "red") : c === "last_seen_at" ? fmtDate(r[c]) : String(r[c] ?? "-")}
            />
          </Card>
          <Card title="IPs used by this device">
            <MiniTable
              rows={deviceData?.ips || []}
              columns={["ip_address", "login_count", "last_seen_at"]}
              render={(r, c) => c === "ip_address" ? <button className="text-emerald-300 underline" onClick={() => lookupIp(r[c])}>{r[c]}</button> : c === "last_seen_at" ? fmtDate(r[c]) : String(r[c] ?? "-")}
            />
          </Card>
        </section>
      )}

      {tab === "logins" && (
        <Card title="Logins">
          <div className="mb-3 grid gap-2 sm:flex">
            <input value={queryUser} onChange={(e) => setQueryUser(e.target.value)} placeholder="Filter user_id" className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#0f212e] px-4 py-3 text-white outline-none" />
            <button onClick={loadLogins} className="rounded-2xl bg-emerald-500 px-4 py-3 font-black text-[#071824]">Refresh</button>
          </div>
          <MiniTable
            rows={loginRows}
            columns={["created_at", "account", "login_identifier", "success", "ip_address", "device", "browser", "failure_reason"]}
            render={(r, c) => {
              if (c === "created_at") return fmtDate(r[c]);
              if (c === "account") return accountLabel(r);
              if (c === "success") return badge(r[c] ? "Success" : "Failed", r[c] ? "green" : "red");
              if (c === "ip_address") return <button className="text-emerald-300 underline" onClick={() => lookupIp(r[c])}>{r[c] || "-"}</button>;
              if (c === "device") return <button className="text-emerald-300 underline" onClick={() => lookupDevice(r.device_hash)}>{deviceLabel(r.user_agent)} · {shortHash(r.device_hash)}</button>;
              if (c === "browser") return browserLabel(r.user_agent);
              if (c === "failure_reason") return r[c] ? String(r[c]) : "-";
              return String(r[c] ?? "-");
            }}
          />
        </Card>
      )}

      {tab === "actions" && (
        <Card title="Admin Action Logs">
          <div className="mb-3 grid gap-2 sm:flex">
            <input value={actionUser} onChange={(e) => setActionUser(e.target.value)} placeholder="Filter target_user_id" className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#0f212e] px-4 py-3 text-white outline-none" />
            <button onClick={loadActions} className="rounded-2xl bg-emerald-500 px-4 py-3 font-black text-[#071824]">Refresh</button>
          </div>
          <MiniTable
            rows={actionRows}
            columns={["actor_id", "action", "target_user_id", "target_agent_id", "target_type", "target_id", "ip_address", "note", "created_at"]}
            render={(r, c) => c === "created_at" ? fmtDate(r[c]) : String(r[c] ?? "-")}
          />
        </Card>
      )}
    </main>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="max-w-full overflow-hidden rounded-3xl border border-white/5 bg-[#13202a] p-3 md:p-5">
      <h2 className="mb-3 text-lg font-black text-white">{title}</h2>
      {children}
    </section>
  );
}

function MiniTable({ rows, columns, render }: { rows: AnyRow[]; columns: string[]; render?: (r: AnyRow, c: string) => React.ReactNode }) {
  if (!rows?.length) return <div className="rounded-2xl bg-white/5 p-4 text-sm text-slate-400">No records found.</div>;
  return (
    <div className="-mx-3 overflow-x-auto px-3 md:mx-0 md:px-0">
      <table className="w-full min-w-[760px] text-left text-xs md:min-w-[900px] md:text-sm">
        <thead>
          <tr className="border-b border-white/10 text-xs uppercase tracking-[0.12em] text-slate-400">
            {columns.map((c) => <th key={c} className="px-3 py-3">{c.replaceAll("_", " ")}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id || i} className="border-b border-white/5 text-slate-200">
              {columns.map((c) => <td key={c} className="max-w-[180px] truncate px-2 py-3 md:max-w-[240px] md:px-3">{render ? render(r, c) : String(r[c] ?? "-")}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
