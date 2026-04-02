"use client"

import { useEffect, useState } from "react"
import { apiAuth } from "@/lib/auth"
import PlayerShell from "@/components/PlayerShell"
import Link from "next/link"

type Tx = {
  id: number
  user_id: string
  type: string
  amount?: number | null
  balance_after?: number | null
  reference?: string | null
  created_at?: string | null
}

function formatAmount(value?: number | null) {
  if (value === null || value === undefined) return "-"
  const sign = value > 0 ? "+" : ""
  return `${sign}$${value.toFixed(2)}`
}

const CASHIER_TYPES = new Set([
  "deposit",
  "withdrawal_request",
  "withdraw_request",
  "withdrawal_complete",
  "withdrawal_refund",
  "admin_credit",
])

function prettyType(type: string) {
  switch (type) {
    case "deposit":
      return "Deposit"
    case "withdrawal_request":
    case "withdraw_request":
      return "Withdrawal Requested"
    case "withdrawal_complete":
      return "Withdrawal Completed"
    case "withdrawal_refund":
      return "Withdrawal Refunded"
    case "admin_credit":
      return "Manual Credit"
    default:
      return type
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
  }
}


function txBadgeStyle(type: string): React.CSSProperties {
  switch (type) {
    case "deposit":
      return { background: "rgba(16,185,129,0.14)", color: "#86efac", border: "1px solid rgba(16,185,129,0.22)" }
    case "withdrawal_request":
    case "withdraw_request":
      return { background: "rgba(245,158,11,0.14)", color: "#fcd34d", border: "1px solid rgba(245,158,11,0.22)" }
    case "withdrawal_complete":
      return { background: "rgba(59,130,246,0.14)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.22)" }
    case "withdrawal_refund":
      return { background: "rgba(239,68,68,0.14)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.22)" }
    case "admin_credit":
      return { background: "rgba(168,85,247,0.14)", color: "#d8b4fe", border: "1px solid rgba(168,85,247,0.22)" }
    default:
      return { background: "rgba(148,163,184,0.12)", color: "#cbd5e1", border: "1px solid rgba(148,163,184,0.20)" }
  }
}

export default function AccountHistoryPage() {
  const [transactions, setTransactions] = useState<Tx[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  async function loadHistory() {
    try {
      setLoading(true)
      setError("")

      const data = await apiAuth("/transactions/me?limit=100", "GET")
      const rows = Array.isArray(data?.transactions) ? data.transactions : []
      setTransactions(rows.filter((tx: Tx) => CASHIER_TYPES.has(String(tx.type || ""))))
    } catch (err: any) {
      setError(err?.message || "Failed to load transaction history")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  return (
    <PlayerShell
      title="Transaction History"
      subtitle="Deposits, withdrawals, credits, and money movements."
    >
<div className="mb-4">
  <Link
    href="/cashier"
    className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
  >
    ← Back to Cashier
  </Link>
</div>
      {loading && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 text-slate-300 shadow-sm">
          Loading transaction history...
        </div>
      )}

      {error && (
        <div className="rounded-3xl border border-red-500/40 bg-red-500/10 p-5 text-red-300 shadow-sm">
          {error}
        </div>
      )}

      {!loading && !error && transactions.length === 0 && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 text-slate-400 shadow-sm">
          No deposits, withdrawals, or credits yet.
        </div>
      )}

      {!loading && !error && transactions.length > 0 && (
        <>
          <div className="mb-3 text-xs text-slate-400">
            Balance reflects total balance after each transaction. Pending withdrawals may temporarily reduce available balance.
          </div>

          <div className="grid gap-3 md:hidden">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
                      Transaction #{tx.id}
                    </div>
                    <div className="mt-1 text-sm text-slate-400">
                      {tx.created_at || "-"}
                    </div>
                  </div>

                  <span
                    className="inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-bold"
                    style={txBadgeStyle(tx.type)}
                  >
                    {prettyType(tx.type)}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Amount
                    </div>
                    <div className="mt-1 font-bold text-white">
                      {formatAmount(tx.amount)}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Total Balance After
                    </div>
                    <div className="mt-1 font-bold text-white">
                      {tx.balance_after !== null && tx.balance_after !== undefined
                        ? `$${tx.balance_after.toFixed(2)}`
                        : "-"}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Reference
                    </div>
                    <div className="mt-1 break-all text-slate-300">
                      {tx.reference || "-"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/70 shadow-sm md:block">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-slate-900 text-slate-300">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Total Balance After</th>
                  <th className="px-4 py-3 text-left">Reference</th>
                  <th className="px-4 py-3 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-t border-slate-800">
                    <td className="px-4 py-3">{tx.id}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-bold"
                        style={txBadgeStyle(tx.type)}
                      >
                        {prettyType(tx.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatAmount(tx.amount)}</td>
                    <td className="px-4 py-3">
                      {tx.balance_after !== null && tx.balance_after !== undefined
                        ? `$${tx.balance_after.toFixed(2)}`
                        : "-"}
                    </td>
                    <td className="px-4 py-3">{tx.reference || "-"}</td>
                    <td className="px-4 py-3">{tx.created_at || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </PlayerShell>
  )
}
