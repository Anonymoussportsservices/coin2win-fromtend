from pathlib import Path
from datetime import datetime
import shutil

file = Path("/var/www/coin2win-ui/app/cashier/page.tsx")
backup = file.with_suffix(file.suffix + f".bak.{datetime.now().strftime('%Y%m%d-%H%M%S')}")
shutil.copy2(file, backup)

file.write_text("""\
"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import PlayerShell from "@/components/PlayerShell";
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

export default function CashierPage() {
  const user = getStoredUser();

  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<TxRow[]>([]);

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
      const data = await apiAuth("/transactions/me?limit=50", "GET");
      const rows = Array.isArray(data?.transactions) ? data.transactions : [];
      setTransactions(rows);
    } catch {
      setTransactions([]);
    }
  }

  useEffect(() => {
    loadWallet();
    loadTransactions();

    const handleWalletRefresh = () => {
      loadWallet();
      loadTransactions();
    };

    window.addEventListener("coin2win-auth-changed", handleWalletRefresh);
    window.addEventListener("coin2win-wallet-changed", handleWalletRefresh);

    return () => {
      window.removeEventListener("coin2win-auth-changed", handleWalletRefresh);
      window.removeEventListener("coin2win-wallet-changed", handleWalletRefresh);
    };
  }, [user?.user_id]);

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

    try {
      setWithdrawLoading(true);
      setError("");
      setMessage("");

      const amount = Number(withdrawAmount);
      if (!amount || amount <= 0) {
        throw new Error("Enter a valid withdrawal amount.");
      }
      if (!withdrawAddress.trim()) {
        throw new Error("Enter a wallet address.");
      }

      await apiAuth("/withdraw/create", "POST", {
        user_id: user.user_id,
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

        <div style={historyCard}>
          <h3 style={cardTitle}>Transaction History</h3>

          <div style={table}>
            <div style={rowHeader}>
              <div>Date</div>
              <div>Type</div>
              <div>Amount</div>
              <div>Balance After</div>
            </div>

            {transactions.length ? (
              transactions.map((tx, idx) => (
                <div style={row} key={tx.id ?? `${tx.reference || "tx"}-${idx}`}>
                  <div>{fmtDate(tx.created_at)}</div>
                  <div>{tx.type || "-"}</div>
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
""")
print(f"patched: {file}")
print(f"backup : {backup}")
