"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AnyData = Record<string, any>;

type CenterStatus = {
  loading: boolean;
  error: string;
};

function money(value: unknown) {
  const amount = Number(value || 0);

  return `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function number(value: unknown) {
  return Number(value || 0).toLocaleString();
}

function comparison(current: unknown, previous: unknown) {
  const currentValue = Number(current || 0);
  const previousValue = Number(previous || 0);

  if (previousValue === 0) {
    return {
      direction: currentValue > 0 ? "up" : "flat",
      label: currentValue > 0 ? "New" : "0.0%",
    } as const;
  }

  const change =
    ((currentValue - previousValue) /
      Math.abs(previousValue)) *
    100;

  return {
    direction:
      change > 0 ? "up" : change < 0 ? "down" : "flat",
    label: `${Math.abs(change).toFixed(1)}%`,
  } as const;
}

function currentMonthRange() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return {
    startDate: `${year}-${month}-01`,
    endDate: `${year}-${month}-${day}`,
    label: now.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    }),
  };
}

function safeSession() {
  try {
    return JSON.parse(
      localStorage.getItem("agent_session_data") || "{}"
    );
  } catch {
    return {};
  }
}

async function fetchJson(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = data?.detail;

    throw new Error(
      typeof detail === "string"
        ? detail
        : detail?.message ||
          detail?.reason_code ||
          `Request failed (${response.status})`
    );
  }

  return data;
}

function Metric({
  label,
  value,
  tone = "neutral",
  comparisonData,
  priority = false,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "neutral" | "success" | "danger" | "warning" | "info";
  comparisonData?: {
    direction: "up" | "down" | "flat";
    label: string;
    positiveWhenUp?: boolean;
  };
  priority?: boolean;
}) {
  const tones = {
    neutral: "text-[var(--oxs-text-primary)]",
    success: "text-[var(--oxs-success)]",
    danger: "text-[var(--oxs-danger)]",
    warning: "text-[var(--oxs-warning)]",
    info: "text-[var(--oxs-info)]",
  };

  return (
    <div
      className={[
        "flex min-h-[84px] flex-col justify-center border-b border-[var(--oxs-border-metric)] bg-[var(--oxs-surface-metric)] px-1 py-3 shadow-[var(--oxs-shadow-metric)]",
        priority
          ? "border-b-[var(--oxs-accent)] bg-[rgb(16_185_129_/_0.035)] px-3"
          : "",
      ].join(" ")}
    >
      <div className="text-[10px] font-medium uppercase leading-4 tracking-[0.12em] text-[var(--oxs-text-subtle)]">
        {label}
      </div>

      <div
        className={[
          "mt-1.5 font-black leading-tight tracking-[-0.02em]",
          priority ? "text-2xl" : "text-xl",
          tones[tone],
        ].join(" ")}
      >
        {value}
      </div>

      {comparisonData ? (
        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-medium">
          <span
            className={
              comparisonData.direction === "flat"
                ? "text-[var(--oxs-text-muted)]"
                : comparisonData.direction === "up"
                  ? comparisonData.positiveWhenUp === false
                    ? "text-[var(--oxs-danger)]"
                    : "text-[var(--oxs-success)]"
                  : comparisonData.positiveWhenUp === false
                    ? "text-[var(--oxs-success)]"
                    : "text-[var(--oxs-danger)]"
            }
          >
            {comparisonData.direction === "up"
              ? "▲"
              : comparisonData.direction === "down"
                ? "▼"
                : "—"}{" "}
            {comparisonData.label}
          </span>

          <span className="font-normal text-[var(--oxs-text-subtle)]">
            vs previous period
          </span>
        </div>
      ) : null}
    </div>
  );
}

function HealthPill({
  status,
}: {
  status: "healthy" | "warning" | "critical";
}) {
  const styles = {
    healthy:
      "border-[var(--oxs-success-border)] bg-[var(--oxs-success-surface)] text-[var(--oxs-success)]",
    warning:
      "border-[var(--oxs-warning-border)] bg-[var(--oxs-warning-surface)] text-[var(--oxs-warning)]",
    critical:
      "border-[var(--oxs-danger-border)] bg-[var(--oxs-danger-surface)] text-[var(--oxs-danger)]",
  };

  const labels = {
    healthy: "Operations Healthy",
    warning: "Needs Review",
    critical: "Action Required",
  };

  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-xs font-black",
        styles[status],
      ].join(" ")}
    >
      {labels[status]}
    </span>
  );
}

function CenterCard({
  eyebrow,
  title,
  status,
  children,
  actions,
  restricted = false,
  expanded,
  onToggle,
  summary,
}: {
  eyebrow: string;
  title: string;
  status: CenterStatus;
  children: React.ReactNode;
  actions: Array<{
    label: string;
    href: string;
  }>;
  restricted?: boolean;
  expanded: boolean;
  onToggle: () => void;
  summary: React.ReactNode;
}) {
  return (
    <section
      className={[
        "flex flex-col rounded-3xl border border-[var(--oxs-border-panel)] bg-[var(--oxs-surface-panel)] shadow-[var(--oxs-shadow-panel-premium)]",
        expanded ? "min-h-[320px] p-6" : "p-4",
        "md:min-h-[320px] md:p-6",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-start justify-between gap-4 text-left md:pointer-events-none"
      >
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--oxs-text-muted)]">
            {eyebrow}
          </div>

          <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--oxs-text-primary)]">
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {restricted ? (
            <span className="rounded-full border border-[var(--oxs-restricted-border)] bg-[var(--oxs-restricted-surface)] px-3 py-1 text-xs font-black text-[var(--oxs-text-muted)]">
              Restricted
            </span>
          ) : status.error ? (
            <span className="rounded-full border border-[var(--oxs-danger-border)] bg-[var(--oxs-danger-surface)] px-3 py-1 text-xs font-black text-[var(--oxs-danger)]">
              Unavailable
            </span>
          ) : status.loading ? (
            <span className="rounded-full border border-[var(--oxs-info-border)] bg-[var(--oxs-info-surface)] px-3 py-1 text-xs font-black text-[var(--oxs-info)]">
              Loading
            </span>
          ) : (
            <span className="rounded-full border border-[var(--oxs-success-border)] bg-[var(--oxs-success-surface)] px-3 py-1 text-xs font-black text-[var(--oxs-success)]">
              Live
            </span>
          )}

          <span
            aria-hidden="true"
            className="inline-flex text-lg font-black text-[var(--oxs-text-muted)] md:hidden"
          >
            {expanded ? "−" : "+"}
          </span>
        </div>
      </button>

      {!expanded && !restricted && !status.error && !status.loading ? (
        <div className="mt-2 text-sm font-bold text-[var(--oxs-text-strong)] md:hidden">
          {summary}
        </div>
      ) : null}

      <div
        className={[
          "mt-5 flex-1",
          expanded ? "block" : "hidden",
          "md:block",
        ].join(" ")}
      >
        {restricted ? (
          <div className="flex h-full min-h-[155px] items-center justify-center rounded-2xl border border-dashed border-[var(--oxs-border-default)] bg-[var(--oxs-surface-secondary)] p-6 text-sm font-black text-[var(--oxs-text-subtle)]">
            Restricted access
          </div>
        ) : status.error ? (
          <div className="rounded-2xl border border-[var(--oxs-danger-border-soft)] bg-[var(--oxs-danger-surface)] p-4 text-sm text-[var(--oxs-danger-soft)]">
            {status.error}
          </div>
        ) : status.loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-[82px] animate-pulse rounded-2xl bg-[var(--oxs-surface-utility)]"
              />
            ))}
          </div>
        ) : (
          children
        )}
      </div>

      {!restricted ? (
        <div
          className={[
            "mt-5 flex-wrap gap-2.5 border-t border-[var(--oxs-border-subtle)] pt-4",
            expanded ? "flex" : "hidden",
            "md:flex",
          ].join(" ")}
        >
          {actions.map((action) => (
            <Link
              key={`${title}-${action.label}`}
              href={action.href}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[var(--oxs-border-default)] bg-[var(--oxs-surface-utility)] px-4 py-2.5 text-xs font-bold text-[var(--oxs-text-strong)] transition hover:border-emerald-400/30 hover:bg-emerald-400/10 hover:text-emerald-200"
            >
              {action.label}
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default function AgentDashboard() {
  const [viewerId, setViewerId] = useState("");
  const [viewerRole, setViewerRole] = useState("");
  const [openCenter, setOpenCenter] = useState<string | null>(null);

  function toggleCenter(center: string) {
    setOpenCenter((current) => (current === center ? null : center));
  }

  const [dashboard, setDashboard] = useState<AnyData | null>(null);
  const [moneyCenter, setMoneyCenter] = useState<AnyData | null>(null);
  const [withdrawals, setWithdrawals] = useState<AnyData | null>(null);
  const [users, setUsers] = useState<AnyData[]>([]);
  const [kyc, setKyc] = useState<AnyData[]>([]);
  const [crm, setCrm] = useState<AnyData | null>(null);
  const [security, setSecurity] = useState<AnyData | null>(null);
  const [intelligence, setIntelligence] = useState<AnyData | null>(null);
  const [gaming, setGaming] = useState<AnyData | null>(null);
  const [brands, setBrands] = useState<AnyData[]>([]);
  const [platformHealth, setPlatformHealth] = useState<AnyData | null>(null);

  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [statuses, setStatuses] = useState<Record<string, CenterStatus>>({
    financial: { loading: true, error: "" },
    operations: { loading: true, error: "" },
    security: { loading: true, error: "" },
    gaming: { loading: true, error: "" },
    intelligence: { loading: true, error: "" },
    platform: { loading: true, error: "" },
  });

  function updateStatus(
    center: string,
    patch: Partial<CenterStatus>
  ) {
    setStatuses((current) => ({
      ...current,
      [center]: {
        ...current[center],
        ...patch,
      },
    }));
  }

  const isPlatformAdmin = useMemo(() => {
    const role = String(viewerRole || "").toLowerCase();
    const id = String(viewerId || "").toLowerCase();

    return (
      id === "supercoin" ||
      role === "superadmin" ||
      role === "super_admin"
    );
  }, [viewerId, viewerRole]);

  function moduleHref(path: string) {
    if (!viewerId) return path;

    const joiner = path.includes("?") ? "&" : "?";

    return `${path}${joiner}viewer_id=${encodeURIComponent(
      viewerId
    )}`;
  }

  useEffect(() => {
    async function loadMissionControl() {
      const session = safeSession();
      const params = new URLSearchParams(window.location.search);

      const resolvedViewer =
        params.get("viewer_id") ||
        localStorage.getItem("agent_viewer_id") ||
        session?.id ||
        "";

      if (!resolvedViewer) {
        window.location.href = "/agent/login";
        return;
      }

      if (params.get("viewer_id")) {
        localStorage.setItem(
          "agent_viewer_id",
          resolvedViewer
        );
      }

      setViewerId(resolvedViewer);

      try {
        setPageLoading(true);
        setPageError("");

        const monthRange = currentMonthRange();

        const dashboardQuery = new URLSearchParams({
          period: "custom",
          start_date: monthRange.startDate,
          end_date: monthRange.endDate,
        });

        const dashboardData = await fetchJson(
          `/ui-api/agent/dashboard/${encodeURIComponent(
            resolvedViewer
          )}?${dashboardQuery.toString()}`
        );

        setDashboard(dashboardData);

        const resolvedRole = String(
          dashboardData?.viewer?.role ||
            dashboardData?.hierarchy?.viewer_role ||
            session?.role ||
            ""
        );

        setViewerRole(resolvedRole);

        const platformAdmin =
          String(resolvedViewer).toLowerCase() === "supercoin" ||
          ["superadmin", "super_admin"].includes(
            resolvedRole.toLowerCase()
          );

        const financialPromise = Promise.all([
          fetchJson(
            `/ui-api/agent/money-center/${encodeURIComponent(
              resolvedViewer
            )}?${new URLSearchParams({
              period: "custom",
              start_date: monthRange.startDate,
              end_date: monthRange.endDate,
            }).toString()}`
          ),
          fetchJson(
            `/ui-api/admin/withdrawals/metrics?viewer_id=${encodeURIComponent(
              resolvedViewer
            )}`
          ),
        ]);

        const operationsPromise = Promise.all([
          fetchJson(
            `/ui-api/admin/users?viewer_id=${encodeURIComponent(
              resolvedViewer
            )}`
          ),
          fetchJson(
            `/ui-api/admin/kyc/users?viewer_id=${encodeURIComponent(
              resolvedViewer
            )}`
          ),
          fetchJson(
            `/ui-api/admin/crm/low-balance/${encodeURIComponent(
              resolvedViewer
            )}?threshold=10&segment=low_balance&days=7`
          ),
        ]);

        const securityPromise = fetchJson(
          `/ui-api/admin/security/login-logs?viewer_id=${encodeURIComponent(
            resolvedViewer
          )}&limit=100`
        );

        const intelligencePromise = fetchJson(
          `/ui-api/admin/intelligence/player-pnl/${encodeURIComponent(
            resolvedViewer
          )}?${new URLSearchParams({
            period: "custom",
            start_date: monthRange.startDate,
            end_date: monthRange.endDate,
          }).toString()}`
        );

        const platformHealthPromise = fetchJson(
          "/ui-api/platform/health"
        );

        const results = await Promise.allSettled([
          financialPromise,
          operationsPromise,
          securityPromise,
          intelligencePromise,
          platformHealthPromise,
        ]);

        const financialResult = results[0];

        if (financialResult.status === "fulfilled") {
          const [moneyData, withdrawalData] =
            financialResult.value;

          setMoneyCenter(moneyData);
          setWithdrawals(withdrawalData);
          updateStatus("financial", {
            loading: false,
            error: "",
          });
        } else {
          updateStatus("financial", {
            loading: false,
            error:
              financialResult.reason?.message ||
              "Financial data unavailable",
          });
        }

        const operationsResult = results[1];

        if (operationsResult.status === "fulfilled") {
          const [usersData, kycData, crmData] =
            operationsResult.value;

          setUsers(
            Array.isArray(usersData?.users)
              ? usersData.users
              : []
          );

          setKyc(
            Array.isArray(kycData?.users)
              ? kycData.users
              : []
          );

          setCrm(crmData);

          updateStatus("operations", {
            loading: false,
            error: "",
          });
        } else {
          updateStatus("operations", {
            loading: false,
            error:
              operationsResult.reason?.message ||
              "Operations data unavailable",
          });
        }

        const securityResult = results[2];

        if (securityResult.status === "fulfilled") {
          setSecurity(securityResult.value);
          updateStatus("security", {
            loading: false,
            error: "",
          });
        } else {
          updateStatus("security", {
            loading: false,
            error:
              securityResult.reason?.message ||
              "Security data unavailable",
          });
        }

        const intelligenceResult = results[3];

        if (intelligenceResult.status === "fulfilled") {
          setIntelligence(intelligenceResult.value);
          updateStatus("intelligence", {
            loading: false,
            error: "",
          });
        } else {
          updateStatus("intelligence", {
            loading: false,
            error:
              intelligenceResult.reason?.message ||
              "Intelligence data unavailable",
          });
        }

        const healthResult = results[4];

        if (healthResult.status === "fulfilled") {
          setPlatformHealth(healthResult.value);
        }

        if (platformAdmin) {
          try {
            const [
              totalGames,
              enabledGames,
              disabledGames,
              featuredGames,
              liveGames,
            ] = await Promise.all([
              fetchJson(
                "/ui-api/admin/softswiss/games?page=1&limit=1"
              ),
              fetchJson(
                "/ui-api/admin/softswiss/games?page=1&limit=1&status=enabled"
              ),
              fetchJson(
                "/ui-api/admin/softswiss/games?page=1&limit=1&status=disabled"
              ),
              fetchJson(
                "/ui-api/admin/softswiss/games?page=1&limit=1&status=featured"
              ),
              fetchJson(
                "/ui-api/admin/softswiss/games?page=1&limit=1&status=live"
              ),
            ]);

            setGaming({
              total: totalGames?.total || 0,
              enabled: enabledGames?.total || 0,
              disabled: disabledGames?.total || 0,
              featured: featuredGames?.total || 0,
              live: liveGames?.total || 0,
            });

            updateStatus("gaming", {
              loading: false,
              error: "",
            });
          } catch (error: any) {
            updateStatus("gaming", {
              loading: false,
              error:
                error?.message ||
                "Gaming catalog unavailable",
            });
          }

          try {
            const brandData = await fetchJson(
              "/ui-api/admin/brands"
            );

            setBrands(
              Array.isArray(brandData?.brands)
                ? brandData.brands
                : []
            );

            updateStatus("platform", {
              loading: false,
              error: "",
            });
          } catch (error: any) {
            updateStatus("platform", {
              loading: false,
              error:
                error?.message ||
                "Platform data unavailable",
            });
          }
        } else {
          updateStatus("gaming", {
            loading: false,
            error: "",
          });

          updateStatus("platform", {
            loading: false,
            error: "",
          });
        }
      } catch (error: any) {
        setPageError(
          error?.message || "Operational Panel failed to load"
        );
      } finally {
        setPageLoading(false);
      }
    }

    loadMissionControl();
  }, []);

  const dashboardSummary = dashboard?.summary || {};
  const moneySummary = moneyCenter?.summary || {};
  const previousMoneySummary =
    moneyCenter?.previous_summary || {};
  const intelligenceSummary = intelligence?.summary || {};

  const pendingWithdrawals =
    Number(withdrawals?.requested || 0) +
    Number(withdrawals?.approved || 0) +
    Number(withdrawals?.sent || 0);

  const pendingKyc = kyc.filter(
    (row) =>
      String(row?.kyc_status || "").toLowerCase() ===
      "pending"
  ).length;

  const activeUsers = users.filter(
    (row) => row?.is_active !== false
  ).length;

  const inactiveUsers = Math.max(
    users.length - activeUsers,
    0
  );

  const agentNetwork = users.filter(
    (row) =>
      String(row?.role || "").toLowerCase() !== "player"
  ).length;

  const loginRows = Array.isArray(security?.logs)
    ? security.logs
    : [];

  const failedLogins = loginRows.filter(
    (row: AnyData) => row?.success === false
  ).length;

  const uniqueDevices = new Set(
    loginRows
      .map((row: AnyData) => row?.device_hash)
      .filter(Boolean)
  ).size;

  const ipAccounts = new Map<string, Set<string>>();

  for (const row of loginRows) {
    if (!row?.ip_address) continue;

    const account =
      row?.user_id ||
      row?.agent_id ||
      row?.login_identifier ||
      "";

    if (!ipAccounts.has(row.ip_address)) {
      ipAccounts.set(row.ip_address, new Set());
    }

    if (account) {
      ipAccounts.get(row.ip_address)?.add(account);
    }
  }

  const sharedIps = Array.from(ipAccounts.values()).filter(
    (accounts) => accounts.size > 1
  ).length;

  const intelligenceItems = Array.isArray(
    intelligence?.items
  )
    ? intelligence.items
    : [];

  const topPlayerWinner =
    intelligenceItems.length > 0
      ? [...intelligenceItems].sort(
          (a, b) =>
            Number(b?.player_net || 0) -
            Number(a?.player_net || 0)
        )[0]
      : null;

  const topHouseContributor =
    intelligenceItems.length > 0
      ? [...intelligenceItems].sort(
          (a, b) =>
            Number(b?.house_net || 0) -
            Number(a?.house_net || 0)
        )[0]
      : null;

  const activeBrands = brands.filter(
    (brand) => brand?.is_active !== false
  ).length;

  const homeBanners = brands.reduce(
    (sum, brand) =>
      sum +
      (Array.isArray(brand?.home_banners_json)
        ? brand.home_banners_json.length
        : 0),
    0
  );

  const casinoBanners = brands.reduce(
    (sum, brand) =>
      sum +
      (Array.isArray(brand?.casino_banners_json)
        ? brand.casino_banners_json.length
        : 0),
    0
  );

  const financialAlerts = Array.isArray(
    moneyCenter?.alerts
  )
    ? moneyCenter.alerts.length
    : 0;

  const operationalAlerts = [
    pendingWithdrawals > 0
      ? {
          key: "pending-withdrawals",
          severity: "critical",
          title: "Pending Withdrawals",
          value: number(pendingWithdrawals),
          href: moduleHref("/agent/withdrawals"),
        }
      : null,
    pendingKyc > 0
      ? {
          key: "pending-kyc",
          severity: "warning",
          title: "Pending KYC",
          value: number(pendingKyc),
          href: moduleHref("/agent/kyc"),
        }
      : null,
    failedLogins > 0
      ? {
          key: "failed-logins",
          severity: "warning",
          title: "Failed Logins",
          value: number(failedLogins),
          href: moduleHref("/agent/security"),
        }
      : null,
    financialAlerts > 0
      ? {
          key: "financial-alerts",
          severity: "warning",
          title: "Financial Alerts",
          value: number(financialAlerts),
          href: moduleHref("/agent/deposits"),
        }
      : null,
    Number(moneySummary?.net_flow || 0) < 0
      ? {
          key: "negative-net-flow",
          severity: "critical",
          title: "Negative Net Flow",
          value: money(moneySummary?.net_flow),
          href: moduleHref("/agent/deposits"),
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    severity: "critical" | "warning";
    title: string;
    value: string;
    href: string;
  }>;

  const attentionCount =
    pendingWithdrawals +
    pendingKyc +
    failedLogins +
    financialAlerts;

  const hasCritical = operationalAlerts.some(
    (alert) => alert.severity === "critical"
  );

  const hasWarning = operationalAlerts.some(
    (alert) => alert.severity === "warning"
  );

  const healthStatus = hasCritical
    ? "critical"
    : hasWarning
      ? "warning"
      : "healthy";

  if (pageLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-6 text-sm font-bold text-[var(--oxs-text-secondary)] sm:px-6 lg:px-8">
        Loading Operational Panel...
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
      {pageError ? (
        <div className="mb-5 rounded-2xl border border-[var(--oxs-danger-border-soft)] bg-[var(--oxs-danger-surface)] px-5 py-4 text-sm font-bold text-[var(--oxs-danger-soft)]">
          {pageError}
        </div>
      ) : null}

      <section className="rounded-3xl border border-[var(--oxs-border-executive)] bg-[var(--oxs-surface-executive)] p-6 shadow-[var(--oxs-shadow-executive)] md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-center">
          <div>
            <h1 className="text-3xl font-black tracking-[-0.025em] text-[var(--oxs-text-primary)] md:text-4xl">
              Operational Panel
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-2.5">
              <span className="inline-flex min-h-8 items-center rounded-full border border-[var(--oxs-border-default)] bg-[var(--oxs-surface-utility)] px-3.5 py-1.5 text-xs font-bold text-[var(--oxs-text-secondary)]">
                {viewerId}
              </span>

              <span className="inline-flex min-h-8 items-center rounded-full border border-[var(--oxs-info-border-soft)] bg-[var(--oxs-info-surface)] px-3.5 py-1.5 text-xs font-bold text-[var(--oxs-info)]">
                {viewerRole || "operator"}
              </span>

              <span className="inline-flex min-h-8 items-center rounded-full border border-[var(--oxs-accent-violet-border)] bg-[var(--oxs-accent-violet-surface)] px-3.5 py-1.5 text-xs font-bold text-[var(--oxs-accent-violet)]">
                Month to Date · {currentMonthRange().label}
              </span>

              <HealthPill
                status={healthStatus}
              />
            </div>

          </div>

          <div className="grid grid-cols-2 gap-4">
            <Metric
              label="Net Flow"
              value={money(moneySummary?.net_flow)}
              tone={
                Number(moneySummary?.net_flow || 0) >= 0
                  ? "success"
                  : "danger"
              }
              comparisonData={{
                ...comparison(
                  moneySummary?.net_flow,
                  previousMoneySummary?.net_flow
                ),
                positiveWhenUp: true,
              }}
            />

            <Metric
              label="GGR"
              value={money(dashboardSummary?.ggr)}
              tone="neutral"
            />

            <Metric
              label="Active Players"
              value={number(
                dashboardSummary?.active_players
              )}
              tone="neutral"
            />

            <Metric
              label="Attention"
              value={number(operationalAlerts.length)}
              tone={
                attentionCount > 0 ? "danger" : "success"
              }
            />
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-3xl border border-[var(--oxs-border-attention)] bg-[var(--oxs-surface-attention)] p-5 shadow-[var(--oxs-shadow-attention)]">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black tracking-tight text-[var(--oxs-text-primary)]">
            Attention Queue
          </h2>

          <div className="text-3xl font-black text-[var(--oxs-text-primary)]">
            {operationalAlerts.length}
          </div>
        </div>

        {operationalAlerts.length > 0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {operationalAlerts.map((alert) => (
              <Link
                key={alert.key}
                href={alert.href}
                className={[
                  "flex min-h-[82px] items-center justify-between gap-4 rounded-2xl border px-4 py-3 transition",
                  alert.severity === "critical"
                    ? "border-[var(--oxs-danger-border-soft)] bg-[var(--oxs-danger-surface)] hover:border-rose-400/40"
                    : "border-[var(--oxs-warning-border-soft)] bg-[var(--oxs-warning-surface)] hover:border-amber-400/40",
                ].join(" ")}
              >
                <div>
                  <div
                    className={[
                      "text-[10px] font-bold uppercase tracking-[0.16em]",
                      alert.severity === "critical"
                        ? "text-[var(--oxs-danger)]"
                        : "text-[var(--oxs-warning)]",
                    ].join(" ")}
                  >
                    {alert.severity}
                  </div>

                  <div className="mt-1 font-black text-[var(--oxs-text-primary)]">
                    {alert.title}
                  </div>
                </div>

                <div className="text-xl font-black text-[var(--oxs-text-primary)]">
                  {alert.value}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-[var(--oxs-border-subtle)] bg-[var(--oxs-surface-secondary)] px-5 py-6 text-sm font-black text-[var(--oxs-text-muted)]">
            No active alerts
          </div>
        )}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <CenterCard
          eyebrow="Financial"
          title="Financial Center"
          status={statuses.financial}
          summary={money(moneySummary?.net_flow)}
          expanded={openCenter === "financial"}
          onToggle={() => toggleCenter("financial")}
          actions={[
            {
              label: "Deposits",
              href: moduleHref("/agent/deposits"),
            },
            {
              label: "Withdrawals",
              href: moduleHref("/agent/withdrawals"),
            },
            {
              label: "Billing",
              href: moduleHref("/agent/billing"),
            },
          ]}
        >
          <div className="grid grid-cols-2 gap-3">
            <Metric
              label="Deposits"
              value={money(moneySummary?.deposit_amount)}
              tone="neutral"
              comparisonData={{
                ...comparison(
                  moneySummary?.deposit_amount,
                  previousMoneySummary?.deposit_amount
                ),
                positiveWhenUp: true,
              }}
            />

            <Metric
              label="Withdrawals"
              value={money(
                moneySummary?.withdrawal_amount
              )}
              tone="neutral"
              comparisonData={{
                ...comparison(
                  moneySummary?.withdrawal_amount,
                  previousMoneySummary?.withdrawal_amount
                ),
                positiveWhenUp: false,
              }}
            />

            <Metric
              label="Net Flow"
              priority
              value={money(moneySummary?.net_flow)}
              tone={
                Number(moneySummary?.net_flow || 0) >= 0
                  ? "success"
                  : "danger"
              }
              comparisonData={{
                ...comparison(
                  moneySummary?.net_flow,
                  previousMoneySummary?.net_flow
                ),
                positiveWhenUp: true,
              }}
            />

            <Metric
              label="GGR"
              value={money(dashboardSummary?.ggr)}
              tone="neutral"
            />

            <Metric
              label="Pending Withdrawals"
              value={money(
                withdrawals?.total_pending_amount
              )}
              tone={
                Number(withdrawals?.total_pending_amount || 0) > 0
                  ? "warning"
                  : "neutral"
              }
            />

            <Metric
              label="Available Balance"
              value={money(
                dashboardSummary?.balance_available
              )}
              tone="neutral"
            />
          </div>
        </CenterCard>

        <CenterCard
          eyebrow="Operations"
          title="Operations Center"
          status={statuses.operations}
          summary={number(dashboardSummary?.active_players)}
          expanded={openCenter === "operations"}
          onToggle={() => toggleCenter("operations")}
          actions={[
            {
              label: "Users",
              href: moduleHref("/agent/users"),
            },
            {
              label: "KYC",
              href: moduleHref("/agent/kyc"),
            },
            {
              label: "CRM",
              href: moduleHref("/agent/crm"),
            },
            {
              label: "Hierarchy",
              href: moduleHref("/agent/tree"),
            },
          ]}
        >
          <div className="grid grid-cols-2 gap-3">
            <Metric
              label="Active Players"
              value={number(
                dashboardSummary?.active_players
              )}
              tone="neutral"
            />

            <Metric
              label="Total Users"
              value={number(users.length)}
              tone="neutral"
            />

            <Metric
              label="Pending KYC"
              value={number(pendingKyc)}
              tone={pendingKyc > 0 ? "warning" : "neutral"}
            />

            <Metric
              label="Inactive Accounts"
              value={number(inactiveUsers)}
              tone={inactiveUsers > 0 ? "warning" : "neutral"}
            />

            <Metric
              label="CRM Candidates"
              value={number(crm?.count)}
              tone="neutral"
            />

            <Metric
              label="Agent Network"
              value={number(agentNetwork)}
              tone="neutral"
            />
          </div>
        </CenterCard>

        <CenterCard
          eyebrow="Intelligence"
          title="Intelligence Center"
          status={statuses.intelligence}
          summary={money(intelligenceSummary?.house_net)}
          expanded={openCenter === "intelligence"}
          onToggle={() => toggleCenter("intelligence")}
          actions={[
            {
              label: "Intelligence",
              href: moduleHref("/agent/intelligence"),
            },
          ]}
        >
          <div className="grid grid-cols-2 gap-3">
            <Metric
              label="Total Bet"
              value={money(intelligenceSummary?.total_bet)}
              tone="neutral"
            />

            <Metric
              label="Total Win"
              value={money(intelligenceSummary?.total_win)}
              tone="neutral"
            />

            <Metric
              label="House Net"
              priority
              value={money(
                intelligenceSummary?.house_net
              )}
              tone={
                Number(
                  intelligenceSummary?.house_net || 0
                ) >= 0
                  ? "success"
                  : "danger"
              }
            />

            <Metric
              label="Players"
              value={number(
                intelligenceSummary?.players
              )}
              tone="neutral"
            />
          </div>

          <div className="mt-3 grid gap-2">
            <div className="rounded-2xl border border-[var(--oxs-border-subtle)] bg-[var(--oxs-surface-secondary)] px-3 py-3 text-xs">
              <div className="text-[var(--oxs-text-subtle)]">
                Top Player Winner
              </div>

              <div className="mt-1 flex items-center justify-between gap-3">
                <span className="truncate font-black text-[var(--oxs-text-primary)]">
                  {topPlayerWinner?.user_id || "-"}
                </span>

                <span
                  className={[
                    "font-black",
                    Number(topPlayerWinner?.player_net || 0) > 0
                      ? "text-[var(--oxs-danger)]"
                      : "text-[var(--oxs-text-secondary)]",
                  ].join(" ")}
                >
                  {money(topPlayerWinner?.player_net)}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--oxs-border-subtle)] bg-[var(--oxs-surface-secondary)] px-3 py-3 text-xs">
              <div className="text-[var(--oxs-text-subtle)]">
                Top House Contributor
              </div>

              <div className="mt-1 flex items-center justify-between gap-3">
                <span className="truncate font-black text-[var(--oxs-text-primary)]">
                  {topHouseContributor?.user_id || "-"}
                </span>

                <span
                  className={[
                    "font-black",
                    Number(topHouseContributor?.house_net || 0) >= 0
                      ? "text-[var(--oxs-success)]"
                      : "text-[var(--oxs-danger)]",
                  ].join(" ")}
                >
                  {money(topHouseContributor?.house_net)}
                </span>
              </div>
            </div>
          </div>
        </CenterCard>

        <CenterCard
          eyebrow="Security"
          title="Security Center"
          status={statuses.security}
          summary={number(failedLogins)}
          expanded={openCenter === "security"}
          onToggle={() => toggleCenter("security")}
          actions={[
            {
              label: "Security",
              href: moduleHref("/agent/security"),
            },
          ]}
        >
          <div className="grid grid-cols-2 gap-3">
            <Metric
              label="Recent Logins"
              value={number(loginRows.length)}
              tone="neutral"
            />

            <Metric
              label="Failed Logins"
              value={number(failedLogins)}
              tone={
                failedLogins > 0 ? "warning" : "neutral"
              }
            />

            <Metric
              label="Unique Devices"
              value={number(uniqueDevices)}
              tone="neutral"
            />

            <Metric
              label="Shared IPs"
              value={number(sharedIps)}
              tone={
                sharedIps > 0 ? "warning" : "neutral"
              }
            />
          </div>
        </CenterCard>

        <CenterCard
          eyebrow="Gaming"
          title="Gaming Center"
          status={statuses.gaming}
          summary={money(
            dashboardSummary?.ggr_breakdown?.casino_aggregator
          )}
          expanded={openCenter === "gaming"}
          onToggle={() => toggleCenter("gaming")}
          restricted={!isPlatformAdmin}
          actions={[
            {
              label: "Casino Games",
              href: moduleHref("/agent/casino/games"),
            },
          ]}
        >
          <div className="grid grid-cols-2 gap-3">
            <Metric
              label="Total Games"
              value={number(gaming?.total)}
              tone="neutral"
            />

            <Metric
              label="Enabled"
              value={number(gaming?.enabled)}
              tone="neutral"
            />

            <Metric
              label="Disabled"
              value={number(gaming?.disabled)}
              tone={
                Number(gaming?.disabled || 0) > 0
                  ? "warning"
                  : "neutral"
              }
            />

            <Metric
              label="Live Games"
              value={number(gaming?.live)}
              tone="neutral"
            />

            <Metric
              label="Featured"
              value={number(gaming?.featured)}
              tone="neutral"
            />

            <Metric
              label="Casino GGR"
              priority
              value={money(
                dashboardSummary?.ggr_breakdown
                  ?.casino_aggregator
              )}
              tone={
                Number(
                  dashboardSummary?.ggr_breakdown
                    ?.casino_aggregator || 0
                ) >= 0
                  ? "success"
                  : "danger"
              }
            />
          </div>
        </CenterCard>

        <CenterCard
          eyebrow="Platform"
          title="Platform Center"
          status={statuses.platform}
          summary={
            platformHealth?.status === "ok"
              ? "Online"
              : "Unavailable"
          }
          expanded={openCenter === "platform"}
          onToggle={() => toggleCenter("platform")}
          restricted={!isPlatformAdmin}
          actions={[
            {
              label: "Brand CMS",
              href: "/admin/brands",
            },
          ]}
        >
          <div className="grid grid-cols-2 gap-3">
            <Metric
              label="API Status"
              value={
                platformHealth?.status === "ok"
                  ? "Online"
                  : "Unavailable"
              }
              tone={
                platformHealth?.status === "ok"
                  ? "success"
                  : "danger"
              }
            />

            <Metric
              label="Active Brands"
              value={number(activeBrands)}
              tone="neutral"
            />

            <Metric
              label="Brands"
              value={number(brands.length)}
              tone="neutral"
            />

            <Metric
              label="Home Banners"
              value={number(homeBanners)}
              tone="neutral"
            />

            <Metric
              label="Casino Banners"
              value={number(casinoBanners)}
              tone="neutral"
            />
          </div>
        </CenterCard>
      </div>
    </main>
  );
}
