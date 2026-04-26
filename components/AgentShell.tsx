"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const baseNavItems = [
  { label: "Dashboard", href: "/agent/dashboard", icon: "📊" },
  { label: "Billing", href: "/agent/billing", icon: "💼" },
  { label: "Users", href: "/agent/users", icon: "👥" },
  { label: "Deposits", href: "/agent/deposits", icon: "💳" },
  { label: "CRM", href: "/agent/crm", icon: "🎯" },
  { label: "KYC", href: "/agent/kyc", icon: "🪪" },
  { label: "Withdrawals", href: "/agent/withdrawals", icon: "💸" },
  { label: "Brand CMS", href: "/admin/brands", icon: "🎨" },
  { label: "Casino Games", href: "/agent/casino/games", icon: "🎰" },
];

type BrandData = {
  owner_user_id?: string;
  brand_name?: string;
  domain?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  support_email?: string;
  support_telegram?: string;
  is_active?: boolean;
};

export default function AgentShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  const pathname = usePathname();
  const [viewerId, setViewerId] = useState("");
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState("");
  useEffect(() => {
    try {
      const session = JSON.parse(localStorage.getItem("agent_session_data") || "{}");
      if (session?.id) {
        setSessionId(session.id);
      } else if (pathname !== "/agent/login") {
        window.location.href = "/agent/login";
        return;
      }
    } catch {
      if (pathname !== "/agent/login") {
        window.location.href = "/agent/login";
        return;
      }
    }
  }, [pathname]);

  const [brand, setBrand] = useState<BrandData | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("viewer_id") || "";
    const sessionId = JSON.parse(localStorage.getItem("agent_session_data")||"{}").id || "";
    const fromStorage = localStorage.getItem("agent_viewer_id") || "";
    const resolved = fromUrl || fromStorage || sessionId || "";
    if (resolved) localStorage.setItem("agent_viewer_id", resolved);
    setViewerId(resolved);

    const host = window.location.hostname;

    fetch(`/api/public/brand-by-host?host=${encodeURIComponent(host)}`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.ok && data?.brand) {
          setBrand(data.brand);
        }
      })
      .catch(() => {});
  }, [pathname]);

  const viewerQs = useMemo(() => {
    return viewerId ? `?viewer_id=${encodeURIComponent(viewerId)}` : "";
  }, [viewerId]);

  const brandName = brand?.brand_name || "Coin2Win";

  const session = typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("agent_session_data") || "{}")
    : {};

  const isSuperAdmin =
    String(session?.id || "").toLowerCase() === "supercoin" ||
    String(session?.role || "").toLowerCase() === "superadmin";

  const navItems = baseNavItems.filter((item) => {
    if (item.href === "/admin/brands" || item.href === "/agent/casino/games") {
      return isSuperAdmin;
    }
    return true;
  });
  if (pathname === "/agent/login") {
    return <>{children}</>;
  }
  const primaryColor = brand?.primary_color || "#10b981";
  const supportEmail = brand?.support_email || "";
  const supportTelegram = brand?.support_telegram || "";

  return (
    <div className="min-h-screen bg-[#0f212e] text-white">
      <div className="flex min-h-screen">
        {open ? (
          <button
            aria-label="Close menu overlay"
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setOpen(false)}
          />
        ) : null}

        <aside
          className={[
            "fixed left-0 top-0 z-40 h-screen w-[280px] border-r border-white/5 bg-[#13202a] p-4 transition-transform duration-200 lg:static lg:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl text-xl"
              style={{ background: `${primaryColor}22`, color: primaryColor }}
            >
              🎯
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-black uppercase tracking-[0.18em] text-slate-400">
                {brandName}
              </div>
              <div className="truncate text-lg font-black">Agent Portal</div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/5 bg-[#0f172a] px-3 py-3">
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
              Viewer
            </div>
            <div className="mt-1 break-all text-sm font-bold text-slate-200">
              {viewerId || ""}
            </div>
          </div>

          <nav className="mt-4 grid gap-2">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={`${item.href}${viewerQs}`}
                  onClick={() => setOpen(false)}
                  className={[
                    "flex items-center gap-3 rounded-2xl px-4 py-3 font-bold transition",
                    active
                      ? "border text-white"
                      : "bg-white/5 text-slate-200 hover:bg-white/10",
                  ].join(" ")}
                  style={
                    active
                      ? {
                          borderColor: `${primaryColor}55`,
                          background: `${primaryColor}22`,
                        }
                      : undefined
                  }
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 rounded-2xl border border-white/5 bg-[#0f172a] p-3 text-xs text-slate-400">
            <div className="font-black text-slate-300">{brandName}</div>
            {supportEmail ? <div className="mt-1">Email: {supportEmail}</div> : null}
            {supportTelegram ? <div className="mt-1">Telegram: {supportTelegram}</div> : null}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-white/5 bg-[#0f212e]/95 backdrop-blur">
            <div className="flex items-center justify-between gap-3 px-4 py-4 md:px-6">
              <div className="min-w-0">
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                  {brandName}
                </div>
                <div className="truncate text-base font-black text-white md:text-lg">
                  Unified Control Panel
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">

                <span
                  className="hidden md:inline-flex rounded-full border px-3 py-1 text-xs font-black text-slate-200"
                  style={{ borderColor: `${primaryColor}55`, background: `${primaryColor}22` }}
                >
                  {viewerId || ""}
                </span>

                {(() => {
                  try {
                    const session = JSON.parse(localStorage.getItem("agent_session_data") || "{}");
                    return viewerId && session?.id && viewerId !== session.id;
                  } catch {
                    return false;
                  }
                })() && (
                  <button
                    type="button"
                    className="flex-1 md:flex-none rounded-xl border border-yellow-400/30 bg-yellow-500/20 px-3 py-2 text-sm font-black text-yellow-300"
                    onClick={() => {
                      const session = JSON.parse(localStorage.getItem("agent_session_data") || "{}");
                      localStorage.setItem("agent_viewer_id", session.id);
                      window.location.href = "/agent/dashboard?viewer_id=" + encodeURIComponent(session.id || "");
                    }}
                  >
                    Exit Agent
                  </button>
                )}

                <button
                  type="button"
                  className="flex-1 md:flex-none rounded-xl border border-red-500/30 bg-red-600 px-3 py-2 text-sm font-black text-white"
                  onClick={() => {
                    try {
                      localStorage.removeItem("agent_session_data");
                      localStorage.removeItem("agent_viewer_id");
                      localStorage.removeItem("admin_key");
                      localStorage.removeItem("coin2win_admin_key");
                    } catch {}
                    window.location.href = "/agent/login";
                  }}
                >
                  Logout
                </button>

                <button
                  type="button"
                  className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 font-black text-slate-200 lg:hidden"
                  onClick={() => setOpen(true)}
                >


                  ☰
                </button>

              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 py-4 md:px-6 md:py-6">
            
            {title ? (
              <div className="mb-6">
                <h1 className="text-2xl font-black md:text-3xl">{title}</h1>
                {subtitle ? (
                  <p className="mt-1 text-sm text-slate-400 md:text-base">{subtitle}</p>
                ) : null}
              </div>
            ) : null}
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
