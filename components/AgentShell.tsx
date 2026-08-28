"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const baseNavItems = [
  { label: "Dashboard", href: "/agent/dashboard", icon: "📊" },
  { label: "Billing", href: "/agent/billing", icon: "💼" },
  { label: "Users", href: "/agent/users", icon: "👥" },
  { label: "Deposits", href: "/agent/deposits", icon: "💳" },
  { label: "Withdrawals", href: "/agent/withdrawals", icon: "💸" },
  { label: "KYC", href: "/agent/kyc", icon: "🪪" },
  { label: "KYC Limits", href: "/agent/kyc-limits", icon: "🧾" },
  { label: "CRM", href: "/agent/crm", icon: "🎯" },
  { label: "Analytics Center", href: "/agent/intelligence", icon: "📈" },
  { label: "Security Center", href: "/agent/security", icon: "🛡️" },
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
  const [pendingWithdrawals, setPendingWithdrawals] = useState(0);
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

    if (resolved) {
      fetch(`/ui-api/admin/withdrawals/metrics?viewer_id=${encodeURIComponent(resolved)}`, {
        cache: "no-store",
      })
        .then((r) => r.json())
        .then((data) => {
          setPendingWithdrawals(Number(data?.requested || data?.metrics?.requested || 0));
        })
        .catch(() => setPendingWithdrawals(0));
    }

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

  const sessionIdLower = String(session?.id || "").toLowerCase();
  const sessionRole = String(session?.role || "").toLowerCase();

  const isSuperAdmin =
    sessionIdLower === "supercoin" ||
    sessionRole === "superadmin";

  const canViewSecurity =
    isSuperAdmin ||
    sessionRole === "master_agent" ||
    sessionRole === "agent" ||
    sessionRole === "sub_agent";

  const navItems = baseNavItems.filter((item) => {
    if (
      item.href === "/admin/brands" ||
      item.href === "/agent/casino/games" ||
      item.href === "/agent/kyc-limits"
    ) {
      return isSuperAdmin;
    }
    if (item.href === "/agent/security") {
      return canViewSecurity;
    }
    return true;
  });

  const dashboardNavItem = navItems.find(
    (item) => item.href === "/agent/dashboard"
  );

  const navSections = [
    {
      label: "Financial",
      items: navItems.filter((item) =>
        [
          "/agent/billing",
          "/agent/deposits",
          "/agent/withdrawals",
        ].includes(item.href)
      ),
    },
    {
      label: "Operations",
      items: navItems.filter((item) =>
        [
          "/agent/users",
          "/agent/kyc",
          "/agent/kyc-limits",
          "/agent/crm",
        ].includes(item.href)
      ),
    },
    {
      label: "Intelligence",
      items: navItems.filter(
        (item) => item.href === "/agent/intelligence"
      ),
    },
    {
      label: "Security",
      items: navItems.filter(
        (item) => item.href === "/agent/security"
      ),
    },
    {
      label: "Gaming",
      items: navItems.filter(
        (item) => item.href === "/agent/casino/games"
      ),
    },
    {
      label: "Platform",
      items: navItems.filter(
        (item) => item.href === "/admin/brands"
      ),
    },
  ].filter((section) => section.items.length > 0);
  if (pathname === "/agent/login") {
    return <>{children}</>;
  }
  const primaryColor = brand?.primary_color || "#10b981";
  const supportEmail = brand?.support_email || "";
  const supportTelegram = brand?.support_telegram || "";

  return (
    <div className="min-h-screen bg-[var(--oxs-canvas)] text-[var(--oxs-text-primary)]">
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
            "fixed left-0 top-0 z-40 h-screen w-[280px] overflow-y-auto overscroll-contain border-r border-[var(--oxs-border-subtle)] bg-[var(--oxs-surface-sidebar)] p-4 pb-24 transition-transform duration-200 lg:static lg:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          <div className="flex items-center gap-3 rounded-2xl bg-[var(--oxs-surface-utility)] p-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl text-xl"
              style={{ background: `${primaryColor}22`, color: primaryColor }}
            >
              🎯
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-black uppercase tracking-[0.18em] text-[var(--oxs-text-muted)]">
                {brandName}
              </div>
              <div className="truncate text-lg font-black">Agent Portal</div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-[var(--oxs-border-subtle)] bg-[var(--oxs-surface-shell-secondary)] px-3 py-3">
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--oxs-text-muted)]">
              Viewer
            </div>
            <div className="mt-1 break-all text-sm font-bold text-[var(--oxs-text-strong)]">
              {viewerId || ""}
            </div>
          </div>

          <nav className="mt-4">
            {dashboardNavItem ? (() => {
              const item = dashboardNavItem;
              const active = pathname === item.href;

              return (
                <Link
                  href={`${item.href}${viewerQs}`}
                  onClick={() => setOpen(false)}
                  className={[
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition",
                    active
                      ? "border text-[var(--oxs-text-primary)]"
                      : "text-[var(--oxs-text-strong)] hover:bg-[var(--oxs-surface-utility)]",
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
            })() : null}

            <div className="mt-5 grid gap-5">
              {navSections.map((section) => (
                <div key={section.label}>
                  <div className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--oxs-text-muted)]">
                    {section.label}
                  </div>

                  <div className="grid gap-1">
                    {section.items.map((item) => {
                      const active = pathname === item.href;

                      return (
                        <Link
                          key={item.href}
                          href={`${item.href}${viewerQs}`}
                          onClick={() => setOpen(false)}
                          className={[
                            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition",
                            active
                              ? "border text-[var(--oxs-text-primary)]"
                              : "text-[var(--oxs-text-strong)] hover:bg-[var(--oxs-surface-utility)]",
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
                          <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                            <span>{item.label}</span>

                            {item.href === "/agent/withdrawals" &&
                            pendingWithdrawals > 0 ? (
                              <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-black text-[var(--oxs-text-primary)]">
                                {pendingWithdrawals}
                              </span>
                            ) : null}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </nav>

          <div className="mt-6 rounded-2xl border border-[var(--oxs-border-subtle)] bg-[var(--oxs-surface-shell-secondary)] p-3 text-xs text-[var(--oxs-text-muted)]">
            <div className="font-black text-[var(--oxs-text-secondary)]">{brandName}</div>
            {supportEmail ? <div className="mt-1">Email: {supportEmail}</div> : null}
            {supportTelegram ? <div className="mt-1">Telegram: {supportTelegram}</div> : null}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-[var(--oxs-border-subtle)] bg-[var(--oxs-canvas-95)] backdrop-blur">
            <div className="flex items-center justify-between gap-3 px-4 py-4 md:px-6">
              <div className="min-w-0">
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--oxs-text-muted)]">
                  {brandName}
                </div>
                <div className="truncate text-base font-black text-[var(--oxs-text-primary)] md:text-lg">
                  Unified Control Panel
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">

                <span
                  className="hidden md:inline-flex rounded-full border px-3 py-1 text-xs font-black text-[var(--oxs-text-strong)]"
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
                  className="flex-1 md:flex-none rounded-xl border border-red-500/30 bg-red-600 px-3 py-2 text-sm font-black text-[var(--oxs-text-primary)]"
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
                  className="inline-flex items-center rounded-xl border border-[var(--oxs-border-default)] bg-[var(--oxs-surface-utility)] px-3 py-2 font-black text-[var(--oxs-text-strong)] lg:hidden"
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
                  <p className="mt-1 text-sm text-[var(--oxs-text-muted)] md:text-base">{subtitle}</p>
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
