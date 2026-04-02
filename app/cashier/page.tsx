"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import PlayerShell from "@/components/PlayerShell";
import FilterPills from "@/components/FilterPills";
import { apiAuth, getStoredUser } from "@/lib/auth";
import { notifyWalletChanged } from "@/lib/gameApi";

type WalletSummary = {
  balance_available?: number;
  balance_total?: number;
  balance_pending?: number;
};

type TxRow = {
  id?: number;
  type?: string;
  amount?: number;
  balance_after?: number;
  created_at?: string;
  reference?: string | null;
};

type DepositRow = {
  id?: number;
  user_id?: string;
  payment_id?: string;
  status?: string;
  amount_usd?: number;
  pay_currency?: string;
  pay_amount?: number | null;
  pay_address?: string | null;
  created_at?: string;
  updated_at?: string;
};

type WithdrawalRow = {
  id?: number;
  user_id?: string;
  amount_usd?: number;
  payout_currency?: string;
  payout_address?: string | null;
  status?: string;
  note?: string | null;
  refunded?: number | null;
  created_at?: string;
  updated_at?: string;
};

const CASHIER_TYPES = new Set([
  "deposit",
  "withdrawal_request",
  "withdraw_request",
  "withdrawal_complete",
  "withdrawal_refund",
  "admin_credit",
]);


function fmtMoney(value: number | undefined | null) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function fmtDate(value?: string) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}


function formatTxType(type?: string) {
  switch (String(type || "")) {
    case "deposit":
      return "Deposit";
    case "withdrawal_request":
    case "withdraw_request":
      return "Withdrawal Requested";
    case "withdrawal_complete":
      return "Withdrawal Completed";
    case "withdrawal_refund":
      return "Withdrawal Refunded";
    case "admin_credit":
      return "Manual Credit";
    default:
      return String(type || "-")
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
  }
}


function formatDepositStatus(status?: string) {
  const v = String(status || "").toLowerCase();
  switch (v) {
    case "waiting":
      return "Waiting";
    case "confirming":
      return "Confirming";
    case "confirmed":
      return "Confirmed";
    case "finished":
    case "credited":
      return "Credited";
    case "failed":
      return "Failed";
    case "expired":
      return "Expired";
    case "partially_paid":
      return "Partially Paid";
    default:
      return v
        ? v.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ")
        : "Unknown";
  }
}

function depositStatusStyle(status?: string): CSSProperties {
  const v = String(status || "").toLowerCase();
  if (v === "credited" || v === "finished") {
    return {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: 30,
      padding: "5px 12px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 900,
      background: "rgba(16,185,129,0.14)",
      color: "#86efac",
      border: "1px solid rgba(16,185,129,0.22)",
    };
  }
  if (v === "confirming" || v === "confirmed" || v === "partially_paid") {
    return {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: 30,
      padding: "5px 12px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 900,
      background: "rgba(59,130,246,0.14)",
      color: "#93c5fd",
      border: "1px solid rgba(59,130,246,0.22)",
    };
  }
  if (v === "failed" || v === "expired") {
    return {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: 30,
      padding: "5px 12px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 900,
      background: "rgba(239,68,68,0.14)",
      color: "#fca5a5",
      border: "1px solid rgba(239,68,68,0.22)",
    };
  }
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 30,
    padding: "5px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    background: "rgba(245,158,11,0.14)",
    color: "#fcd34d",
    border: "1px solid rgba(245,158,11,0.22)",
  };
}

function shortValue(value?: string | null, left: number = 10, right: number = 8) {
  const v = String(value || "").trim();
  if (!v) return "-";
  if (v.length <= left + right + 3) return v;
  return `${v.slice(0, left)}...${v.slice(-right)}`;
}


function formatWithdrawalStatus(status?: string) {
  const v = String(status || "").toLowerCase();
  switch (v) {
    case "requested":
      return "Requested";
    case "approved":
      return "Approved";
    case "sent":
      return "Sent";
    case "completed":
      return "Completed";
    case "rejected":
      return "Rejected";
    default:
      return v
        ? v.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ")
        : "Unknown";
  }
}

function withdrawalStatusStyle(status?: string): CSSProperties {
  const v = String(status || "").toLowerCase();
  if (v === "completed") {
    return {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: 30,
      padding: "5px 12px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 900,
      background: "rgba(16,185,129,0.14)",
      color: "#86efac",
      border: "1px solid rgba(16,185,129,0.22)",
    };
  }
  if (v === "approved" || v === "sent") {
    return {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: 30,
      padding: "5px 12px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 900,
      background: "rgba(59,130,246,0.14)",
      color: "#93c5fd",
      border: "1px solid rgba(59,130,246,0.22)",
    };
  }
  if (v === "rejected") {
    return {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: 30,
      padding: "5px 12px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 900,
      background: "rgba(239,68,68,0.14)",
      color: "#fca5a5",
      border: "1px solid rgba(239,68,68,0.22)",
    };
  }
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 30,
    padding: "5px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    background: "rgba(245,158,11,0.14)",
    color: "#fcd34d",
    border: "1px solid rgba(245,158,11,0.22)",
  };
}


function txTypeBadgeStyle(type?: string): CSSProperties {
  switch (String(type || "")) {
    case "deposit":
      return {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 28,
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        background: "rgba(16,185,129,0.14)",
        color: "#86efac",
        border: "1px solid rgba(16,185,129,0.22)",
      };
    case "withdrawal_request":
    case "withdraw_request":
      return {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 28,
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        background: "rgba(245,158,11,0.14)",
        color: "#fcd34d",
        border: "1px solid rgba(245,158,11,0.22)",
      };
    case "withdrawal_complete":
      return {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 28,
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        background: "rgba(59,130,246,0.14)",
        color: "#93c5fd",
        border: "1px solid rgba(59,130,246,0.22)",
      };
    case "withdrawal_refund":
      return {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 28,
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        background: "rgba(239,68,68,0.14)",
        color: "#fca5a5",
        border: "1px solid rgba(239,68,68,0.22)",
      };
    case "admin_credit":
      return {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 28,
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        background: "rgba(168,85,247,0.14)",
        color: "#d8b4fe",
        border: "1px solid rgba(168,85,247,0.22)",
      };
    default:
      return {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 28,
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        background: "rgba(148,163,184,0.12)",
        color: "#cbd5e1",
        border: "1px solid rgba(148,163,184,0.20)",
      };
  }
}

type DatePreset = "all" | "today" | "yesterday" | "7d" | "30d";

function toLocalYmd(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateRangeFromPreset(preset: DatePreset) {
  const now = new Date();

  if (preset === "all") {
    return { startDate: "", endDate: "" };
  }

  if (preset === "today") {
    const ymd = toLocalYmd(now);
    return { startDate: ymd, endDate: ymd };
  }

  if (preset === "yesterday") {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    const ymd = toLocalYmd(d);
    return { startDate: ymd, endDate: ymd };
  }

  if (preset === "7d") {
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    return { startDate: toLocalYmd(start), endDate: toLocalYmd(now) };
  }

  const start = new Date(now);
  start.setDate(start.getDate() - 29);
  return { startDate: toLocalYmd(start), endDate: toLocalYmd(now) };
}

export default function CashierPage() {
  const user = getStoredUser();
  const [showKycModal, setShowKycModal] = useState(false);
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const [latestDeposit, setLatestDeposit] = useState<DepositRow | null>(null);
  const [latestWithdrawal, setLatestWithdrawal] = useState<WithdrawalRow | null>(null);
  const [datePreset, setDatePreset] = useState<DatePreset>("all");

  const [depositAmount, setDepositAmount] = useState("");
  const [depositCurrency, setDepositCurrency] = useState("btc");
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositResult, setDepositResult] = useState<any>(null);

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawCurrency, setWithdrawCurrency] = useState("btc");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadWallet() {
    if (!user?.user_id) return;
    try {
const data = await apiAuth(`/wallet/${encodeURIComponent(user.user_id)}`, "GET");
      setWallet(data || null);
    } catch (e: any) {
      setError(e?.message || "Failed to load wallet");
    }
  }

  async function loadTransactions() {
    try {
const params = new URLSearchParams({ limit: "50" });
      const { startDate, endDate } = getDateRangeFromPreset(datePreset);

      if (startDate) params.set("start_date", startDate);
      if (endDate) params.set("end_date", endDate);

      const data = await apiAuth(`/transactions/me?${params.toString()}`, "GET");
      const rows = Array.isArray(data?.transactions) ? data.transactions : [];
      setTransactions(
        rows.filter((tx: TxRow) => CASHIER_TYPES.has(String(tx?.type || "")))
      );
    } catch {
      setTransactions([]);
    }
  }


  async function loadDeposits() {
    if (!user?.user_id) return;
    try {
const data = await apiAuth(`/deposit/${encodeURIComponent(user.user_id)}?limit=10`, "GET");
      const rows = Array.isArray(data?.deposits) ? data.deposits : [];
      setLatestDeposit(rows.length ? rows[0] : null);
    } catch {
      setLatestDeposit(null);
    }
  }


  async function loadWithdrawals() {
    if (!user?.user_id) return;
    try {
const data = await apiAuth(`/withdraw/${encodeURIComponent(user.user_id)}?limit=10`, "GET");
      const rows = Array.isArray(data?.withdrawals) ? data.withdrawals : [];
      setLatestWithdrawal(rows.length ? rows[0] : null);
    } catch {
      setLatestWithdrawal(null);
    }
  }

  useEffect(() => {
    loadWallet();
    loadTransactions();
    loadDeposits();
    loadWithdrawals();

    const handleWalletRefresh = () => {
      loadWallet();
      loadTransactions();
      loadDeposits();
      loadWithdrawals();
    };

    const timer = setInterval(() => {
      loadWallet();
      loadTransactions();
      loadDeposits();
      loadWithdrawals();
    }, 8000);

    window.addEventListener("coin2win-auth-changed", handleWalletRefresh);
    window.addEventListener("coin2win-wallet-changed", handleWalletRefresh);

    return () => {
      clearInterval(timer);
      window.removeEventListener("coin2win-auth-changed", handleWalletRefresh);
      window.removeEventListener("coin2win-wallet-changed", handleWalletRefresh);
    };
  }, [user?.user_id, datePreset]);

  async function handleDeposit() {
    if (!user?.user_id) {
      setError("Please log in again.");
      return;
    }

    try {
setDepositLoading(true);
      setError("");
      setMessage("");
      setDepositResult(null);

      const amount = Number(depositAmount);
      if (!amount || amount <= 0) {
        throw new Error("Enter a valid deposit amount.");
      }

      const data = await apiAuth("/deposit/create", "POST", {
        user_id: user.user_id,
        amount_usd: amount,
        pay_currency: depositCurrency,
      });

      setDepositResult(data || null);
      setMessage("Deposit invoice created.");
      notifyWalletChanged();
      await loadTransactions();
    } catch (e: any) {
      setError(e?.message || "Failed to create deposit.");
    } finally {
      setDepositLoading(false);
    }
  }

  async function handleWithdraw() {
    if (!user?.user_id) {
      setError("Please log in again.");
      return;
    }

    const userId = user.user_id;

    try {
      setWithdrawLoading(true);
      setError("");
      setMessage("");

      const kyc = await apiAuth(
        `/kyc/me?user_id=${encodeURIComponent(userId)}`,
        "GET"
      );

      if (kyc?.kyc_status !== "verified") {
        setShowKycModal(true);
        return;
      }

      const amount = Number(withdrawAmount);
      if (!amount || amount <= 0) {
        throw new Error("Enter a valid withdrawal amount.");
      }

      if (!withdrawAddress.trim()) {
        throw new Error("Enter a wallet address.");
      }

      await apiAuth("/withdraw/create", "POST", {
        user_id: userId,
        amount_usd: amount,
        payout_currency: withdrawCurrency,
        payout_address: withdrawAddress.trim(),
      });

      setMessage("Withdrawal request submitted.");
      setWithdrawAmount("");
      setWithdrawAddress("");
      notifyWalletChanged();
      await loadWallet();
      await loadTransactions();
    } catch (e: any) {
      setError(e?.message || "Failed to request withdrawal.");
    } finally {
      setWithdrawLoading(false);
    }
  }

  const depositAddress = useMemo(() => {
    return (
      depositResult?.pay_address ||
      depositResult?.address ||
      depositResult?.deposit_address ||
      ""
    );
  }, [depositResult]);

  const depositPayAmount = useMemo(() => {
    return (
      depositResult?.pay_amount ||
      depositResult?.amount ||
      ""
    );
  }, [depositResult]);

  return (
    <PlayerShell
      title="Cashier"
      subtitle="Manage deposits, withdrawals and balances."
    >
      <div style={container}>
        {error ? <div style={errorStyle}>{error}</div> : null}
        {message ? <div style={successStyle}>{message}</div> : null}

        {showKycModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "rgba(0,0,0,0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: 16,
            }}
          >
            <div
              style={{
                background: "#1a2c38",
                padding: 24,
                borderRadius: 16,
                maxWidth: 400,
                width: "100%",
                textAlign: "center",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
              }}
            >
              <h3 style={{ margin: "0 0 12px 0", fontSize: 20, fontWeight: 800 }}>
                Verify your identity
              </h3>

              <p style={{ margin: "0 0 20px 0", color: "#b1bad3", lineHeight: 1.5 }}>
                Complete KYC verification to unlock withdrawals.
              </p>

              <div style={{ display: "grid", gap: 10 }}>
                <button
                  onClick={() => (window.location.href = "/kyc")}
                  style={{
                    background: "#00e701",
                    color: "#071824",
                    border: "none",
                    borderRadius: 12,
                    minHeight: 44,
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  Verify now
                </button>

                <button
                  onClick={() => setShowKycModal(false)}
                  style={{
                    background: "#213743",
                    color: "#ffffff",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12,
                    minHeight: 44,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}



        <div style={{ marginBottom: 16 }}>
          <FilterPills
            options={[
              { value: "all", label: "All" },
              { value: "today", label: "Today" },
              { value: "yesterday", label: "Yesterday" },
              { value: "7d", label: "Last 7 Days" },
              { value: "30d", label: "Last 30 Days" },
            ]}
            value={datePreset}
            onChange={(value) => setDatePreset(value as DatePreset)}
          />
        </div>

        <div style={grid}>
          <div style={card}>
            <h3 style={cardTitle}>Balance</h3>

            <div style={balanceBox}>
              <div style={balanceLabel}>Available</div>
              <div style={balanceValue}>{fmtMoney(wallet?.balance_available)}</div>
            </div>

            <div style={balanceRow}>
              <div>
                <div style={smallLabel}>Pending</div>
                <div style={smallValue}>{fmtMoney(wallet?.balance_pending)}</div>
              </div>

              <div>
                <div style={smallLabel}>Total</div>
                <div style={smallValue}>{fmtMoney(wallet?.balance_total)}</div>
              </div>
            </div>
          </div>

          <div style={card}>
            <h3 style={cardTitle}>Deposit</h3>

            <input
              placeholder="Amount (USD)"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              style={input}
            />

            <select
              value={depositCurrency}
              onChange={(e) => setDepositCurrency(e.target.value)}
              style={input}
            >
              <option value="btc">BTC</option>
              <option value="eth">ETH</option>
              <option value="ltc">LTC</option>
              <option value="usdttrc20">USDT (TRC20)</option>
              <option value="usdterc20">USDT (ERC20)</option>
            </select>

            <button style={primaryBtn} onClick={handleDeposit} disabled={depositLoading}>
              {depositLoading ? "Generating..." : "Generate Deposit Address"}
            </button>

            {depositResult ? (
              <div style={resultBox}>
                <div style={resultLabel}>Send To</div>
                <div style={resultValue}>{depositAddress || "-"}</div>

                <div style={{ ...resultLabel, marginTop: 10 }}>Amount To Pay</div>
                <div style={resultValue}>{String(depositPayAmount || "-")}</div>
              </div>
            ) : null}

            <div style={note}>
              Deposits are processed automatically after blockchain confirmation.
            </div>
          </div>

          <div style={card}>
            <h3 style={cardTitle}>Withdraw</h3>

            <input
              placeholder="Amount (USD)"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              style={input}
            />

            <select
              value={withdrawCurrency}
              onChange={(e) => setWithdrawCurrency(e.target.value)}
              style={input}
            >
              <option value="btc">BTC</option>
              <option value="eth">ETH</option>
              <option value="ltc">LTC</option>
              <option value="usdttrc20">USDT (TRC20)</option>
              <option value="usdterc20">USDT (ERC20)</option>
            </select>

            <input
              placeholder="Wallet Address"
              value={withdrawAddress}
              onChange={(e) => setWithdrawAddress(e.target.value)}
              style={input}
            />

            <button style={primaryBtn} onClick={handleWithdraw} disabled={withdrawLoading}>
              {withdrawLoading ? "Submitting..." : "Request Withdrawal"}
            </button>

            <div style={note}>
              Withdrawals are reviewed and processed quickly.
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={cardTitleWrap}>
            <h3 style={cardTitle}>Latest Deposit</h3>
            {latestDeposit ? (
              <span style={depositStatusStyle(latestDeposit.status)}>
                {formatDepositStatus(latestDeposit.status)}
              </span>
            ) : null}
          </div>

          {latestDeposit ? (
            <div style={depositStatusGrid}>
              <div style={depositStatusItem}>
                <div style={depositStatusLabel}>Amount</div>
                <div style={depositStatusValue}>
                  ${Number(latestDeposit.amount_usd || 0).toFixed(2)}
                </div>
              </div>

              <div style={depositStatusItem}>
                <div style={depositStatusLabel}>Pay Amount</div>
                <div style={depositStatusValue}>
                  {latestDeposit.pay_amount != null
                    ? `${latestDeposit.pay_amount} ${String(latestDeposit.pay_currency || "").toUpperCase()}`
                    : String(latestDeposit.pay_currency || "").toUpperCase() || "-"}
                </div>
              </div>

              <div style={depositStatusItem}>
                <div style={depositStatusLabel}>Payment ID</div>
                <div style={depositStatusValue}>{shortValue(latestDeposit.payment_id, 12, 10)}</div>
              </div>

              <div style={depositStatusItem}>
                <div style={depositStatusLabel}>Created</div>
                <div style={depositStatusValue}>{fmtDate(latestDeposit.created_at)}</div>
              </div>

              <div style={{ ...depositStatusItem, gridColumn: "1 / -1" }}>
                <div style={depositStatusLabel}>Wallet Address</div>
                <div style={depositStatusMono}>{latestDeposit.pay_address || "-"}</div>
              </div>
            </div>
          ) : (
            <div style={note}>No deposits created yet.</div>
          )}

          {depositResult?.payment_url ? (
            <a
              href={depositResult.payment_url}
              target="_blank"
              rel="noreferrer"
              style={secondaryBtn}
            >
              Open Payment Page
            </a>
          ) : null}
        </div>

        <div style={card}>
          <div style={cardTitleWrap}>
            <h3 style={cardTitle}>Latest Withdrawal</h3>
            {latestWithdrawal ? (
              <span style={withdrawalStatusStyle(latestWithdrawal.status)}>
                {formatWithdrawalStatus(latestWithdrawal.status)}
              </span>
            ) : null}
          </div>

          {latestWithdrawal ? (
            <div style={depositStatusGrid}>
              <div style={depositStatusItem}>
                <div style={depositStatusLabel}>Amount</div>
                <div style={depositStatusValue}>
                  ${Number(latestWithdrawal.amount_usd || 0).toFixed(2)}
                </div>
              </div>

              <div style={depositStatusItem}>
                <div style={depositStatusLabel}>Payout Currency</div>
                <div style={depositStatusValue}>
                  {String(latestWithdrawal.payout_currency || "").toUpperCase() || "-"}
                </div>
              </div>

              <div style={depositStatusItem}>
                <div style={depositStatusLabel}>Withdrawal ID</div>
                <div style={depositStatusValue}>#{latestWithdrawal.id ?? "-"}</div>
              </div>

              <div style={depositStatusItem}>
                <div style={depositStatusLabel}>Created</div>
                <div style={depositStatusValue}>{fmtDate(latestWithdrawal.created_at)}</div>
              </div>

              <div style={{ ...depositStatusItem, gridColumn: "1 / -1" }}>
                <div style={depositStatusLabel}>Payout Address</div>
                <div style={depositStatusMono}>{latestWithdrawal.payout_address || "-"}</div>
              </div>

              {latestWithdrawal.note ? (
                <div style={{ ...depositStatusItem, gridColumn: "1 / -1" }}>
                  <div style={depositStatusLabel}>Note</div>
                  <div style={depositStatusValue}>{latestWithdrawal.note}</div>
                </div>
              ) : null}
            </div>
          ) : (
            <div style={note}>No withdrawals created yet.</div>
          )}
        </div>

        <div style={historyCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}><div><h3 style={cardTitle}>Transaction History</h3><div style={{ marginTop: 6, fontSize: 12, color: "#9fb0bf" }}>Balance After reflects total balance after each transaction. Pending withdrawals may temporarily reduce available balance.</div></div><a href="/account/history" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 40, padding: "0 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "#13202a", color: "#fff", fontSize: 13, fontWeight: 800 }}>View Full History</a></div>

          <div style={table}>
            <div style={rowHeader}>
              <div>Date</div>
              <div>Type</div>
              <div>Amount</div>
              <div>Total Balance After</div>
            </div>

            {transactions.length ? (
              transactions.map((tx, idx) => (
                <div style={row} key={tx.id ?? `${tx.reference || "tx"}-${idx}`}>
                  <div>{fmtDate(tx.created_at)}</div>
                  <div>
                    <span style={txTypeBadgeStyle(tx.type)}>{formatTxType(tx.type)}</span>
                  </div>
                  <div style={{ color: Number(tx.amount || 0) >= 0 ? "#86efac" : "#fca5a5", fontWeight: 700 }}>
                    {Number(tx.amount || 0) > 0 ? "+" : ""}{fmtMoney(tx.amount)}
                  </div>
                  <div>{fmtMoney(tx.balance_after)}</div>
                </div>
              ))
            ) : (
              <div style={row}>
                <div>-</div>
                <div>-</div>
                <div>-</div>
                <div>-</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PlayerShell>
  );
}

const container: CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  width: "100%",
  display: "grid",
  gap: 24,
};

const grid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
  gap: 20,
};

const card: CSSProperties = {
  background: "#1a2c38",
  padding: 24,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.05)",
  display: "grid",
  gap: 16,
};

const historyCard: CSSProperties = {
  background: "#1a2c38",
  padding: 24,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.05)",
};

const cardTitle: CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 700,
  color: "#fff",
};


const cardTitleWrap: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 14,
};

const depositStatusGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
  gap: 14,
};

const depositStatusItem: CSSProperties = {
  background: "#13202a",
  border: "1px solid rgba(255,255,255,0.05)",
  borderRadius: 14,
  padding: 14,
  display: "grid",
  gap: 6,
};

const depositStatusLabel: CSSProperties = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#7f8fa4",
  fontWeight: 800,
};

const depositStatusValue: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: "#fff",
  overflowWrap: "anywhere",
};

const depositStatusMono: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "#cbd5e1",
  overflowWrap: "anywhere",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const balanceBox: CSSProperties = {
  background: "#13202a",
  padding: 18,
  borderRadius: 12,
  display: "grid",
  gap: 6,
};

const balanceLabel: CSSProperties = {
  fontSize: 12,
  color: "#9fb0bf",
};

const balanceValue: CSSProperties = {
  fontSize: 28,
  fontWeight: 800,
  color: "#00e701",
};

const balanceRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
};

const smallLabel: CSSProperties = {
  fontSize: 12,
  color: "#9fb0bf",
};

const smallValue: CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: "#fff",
};

const input: CSSProperties = {
  background: "#13202a",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 10,
  padding: "12px",
  color: "#fff",
};

const primaryBtn: CSSProperties = {
  background: "#00e701",
  border: "none",
  borderRadius: 10,
  padding: "12px",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryBtn: CSSProperties = {
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 44,
  padding: "0 16px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "#13202a",
  color: "#ffffff",
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
};


const note: CSSProperties = {
  fontSize: 12,
  color: "#9fb0bf",
};

const resultBox: CSSProperties = {
  background: "#13202a",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 12,
  padding: 12,
};

const resultLabel: CSSProperties = {
  fontSize: 11,
  color: "#9fb0bf",
};

const resultValue: CSSProperties = {
  fontSize: 13,
  color: "#fff",
  fontWeight: 700,
  wordBreak: "break-word",
  marginTop: 4,
};

const table: CSSProperties = {
  marginTop: 16,
  display: "grid",
  gap: 8,
};

const rowHeader: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
  fontWeight: 700,
  color: "#9fb0bf",
  fontSize: 12,
  gap: 8,
};

const row: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
  padding: "10px 0",
  borderTop: "1px solid rgba(255,255,255,0.05)",
  color: "#fff",
  gap: 8,
  fontSize: 14,
};

const errorStyle: CSSProperties = {
  background: "rgba(239,68,68,0.12)",
  color: "#fecaca",
  border: "1px solid rgba(239,68,68,0.22)",
  borderRadius: 12,
  padding: "10px 12px",
  fontWeight: 700,
};

const successStyle: CSSProperties = {
  background: "rgba(0,231,1,0.12)",
  color: "#86efac",
  border: "1px solid rgba(0,231,1,0.22)",
  borderRadius: 12,
  padding: "10px 12px",
  fontWeight: 700,
};
