"use client"

import { useEffect, useState } from "react"
import { adminGet, adminPost } from "@/lib/admin"

type Withdrawal = {
  id: number
  user_id: string
  amount_usd: number
  status: string
  payout_currency?: string
  payout_address?: string
  created_at?: string
  updated_at?: string
  refunded?: boolean
  note?: string
}

type Deposit = {
  id: number
  user_id: string
  payment_id?: string
  amount_usd: number
  status: string
  pay_currency?: string
  pay_amount?: number
  pay_address?: string
  created_at?: string
  updated_at?: string
}

type Transaction = {
  id: number
  user_id: string
  type: string
  amount?: number
  amount_usd?: number
  balance_after?: number
  reference?: string
  created_at?: string
}

function extractList(data: any, keys: string[]) {
  if (Array.isArray(data)) return data
  if (data && typeof data === "object") {
    for (const key of keys) {
      if (Array.isArray(data[key])) return data[key]
    }
  }
  return []
}

export default function AdminPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])

  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState("")
  const [withdrawalsError, setWithdrawalsError] = useState("")
  const [depositsError, setDepositsError] = useState("")
  const [transactionsError, setTransactionsError] = useState("")
  const [actionMessage, setActionMessage] = useState("")
  const [busyId, setBusyId] = useState<number | null>(null)

  async function loadData() {
    setLoading(true)
    setPageError("")
    setWithdrawalsError("")
    setDepositsError("")
    setTransactionsError("")

    const results = await Promise.allSettled([
      adminGet("/admin/withdrawals?limit=25"),
      adminGet("/admin/deposits?limit=25"),
      adminGet("/admin/transactions?limit=25"),
    ])

    const [wResult, dResult, tResult] = results

    if (wResult.status === "fulfilled") {
      setWithdrawals(extractList(wResult.value, ["withdrawals", "items", "results"]))
    } else {
      setWithdrawals([])
      setWithdrawalsError("Could not load withdrawals.")
      console.error("Withdrawals load error:", wResult.reason)
    }

    if (dResult.status === "fulfilled") {
      setDeposits(extractList(dResult.value, ["deposits", "items", "results"]))
    } else {
      setDeposits([])
      setDepositsError("Could not load deposits.")
      console.error("Deposits load error:", dResult.reason)
    }

    if (tResult.status === "fulfilled") {
      setTransactions(extractList(tResult.value, ["transactions", "items", "results"]))
    } else {
      setTransactions([])
      setTransactionsError("Could not load transactions.")
      console.error("Transactions load error:", tResult.reason)
    }

    if (
      wResult.status === "rejected" &&
      dResult.status === "rejected" &&
      tResult.status === "rejected"
    ) {
      setPageError("Admin dashboard could not load any data.")
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  async function runWithdrawalAction(
    id: number,
    action: "approve" | "reject" | "mark_sent" | "complete",
    successMessage: string
  ) {
    try {
      setBusyId(id)
      setActionMessage("")
      await adminPost(`/admin/withdrawals/${id}/${action}`)
      setActionMessage(successMessage)
      await loadData()
    } catch (err: any) {
      console.error(err)
      setActionMessage(err?.message || `Action failed for withdrawal #${id}.`)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-7xl p-6 md:p-8 space-y-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-sm text-neutral-400 mt-2">
              Operational view for withdrawals, deposits, and transactions.
            </p>
          </div>

          <button
            onClick={loadData}
            className="rounded-lg bg-white text-black px-4 py-2 text-sm font-semibold hover:opacity-90"
          >
            Refresh
          </button>
        </div>

        {loading && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-neutral-300">
            Loading admin panel...
          </div>
        )}

        {pageError && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-300">
            {pageError}
          </div>
        )}

        {actionMessage && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-300">
            {actionMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 shadow-lg">
            <div className="text-sm text-neutral-400">Recent Withdrawals</div>
            <div className="mt-2 text-3xl font-bold">{withdrawals.length}</div>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 shadow-lg">
            <div className="text-sm text-neutral-400">Recent Deposits</div>
            <div className="mt-2 text-3xl font-bold">{deposits.length}</div>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 shadow-lg">
            <div className="text-sm text-neutral-400">Recent Transactions</div>
            <div className="mt-2 text-3xl font-bold">{transactions.length}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 shadow-lg">
          <div className="border-b border-neutral-800 px-5 py-4">
            <h2 className="text-xl font-semibold">Recent Withdrawals</h2>
            {withdrawalsError && (
              <p className="mt-2 text-sm text-red-300">{withdrawalsError}</p>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-sm">
              <thead className="bg-neutral-800/80 text-neutral-300">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Currency</th>
                  <th className="px-4 py-3 text-left">Address</th>
                  <th className="px-4 py-3 text-left">Refunded</th>
                  <th className="px-4 py-3 text-left">Created</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id} className="border-t border-neutral-800">
                    <td className="px-4 py-3">{w.id}</td>
                    <td className="px-4 py-3">{w.user_id}</td>
                    <td className="px-4 py-3">${w.amount_usd}</td>
                    <td className="px-4 py-3">{w.status}</td>
                    <td className="px-4 py-3">{w.payout_currency || "-"}</td>
                    <td className="px-4 py-3 max-w-[220px] truncate">
                      {w.payout_address || "-"}
                    </td>
                    <td className="px-4 py-3">{w.refunded ? "Yes" : "No"}</td>
                    <td className="px-4 py-3">{w.created_at || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {w.status === "requested" && (
                          <>
                            <button
                              onClick={() =>
                                runWithdrawalAction(w.id, "approve", `Withdrawal #${w.id} approved.`)
                              }
                              disabled={busyId === w.id}
                              className="rounded bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-500 disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() =>
                                runWithdrawalAction(w.id, "reject", `Withdrawal #${w.id} rejected.`)
                              }
                              disabled={busyId === w.id}
                              className="rounded bg-red-600 px-3 py-1.5 text-white hover:bg-red-500 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {w.status === "approved" && (
                          <button
                            onClick={() =>
                              runWithdrawalAction(w.id, "mark_sent", `Withdrawal #${w.id} marked sent.`)
                            }
                            disabled={busyId === w.id}
                            className="rounded bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-500 disabled:opacity-50"
                          >
                            Mark Sent
                          </button>
                        )}

                        {w.status === "sent" && (
                          <button
                            onClick={() =>
                              runWithdrawalAction(w.id, "complete", `Withdrawal #${w.id} completed.`)
                            }
                            disabled={busyId === w.id}
                            className="rounded bg-purple-600 px-3 py-1.5 text-white hover:bg-purple-500 disabled:opacity-50"
                          >
                            Complete
                          </button>
                        )}

                        {!["requested", "approved", "sent"].includes(w.status) && (
                          <span className="text-neutral-500">No actions</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {withdrawals.length === 0 && !withdrawalsError && (
                  <tr className="border-t border-neutral-800">
                    <td colSpan={9} className="px-4 py-6 text-neutral-400">
                      No withdrawals found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 shadow-lg">
          <div className="border-b border-neutral-800 px-5 py-4">
            <h2 className="text-xl font-semibold">Recent Deposits</h2>
            {depositsError && (
              <p className="mt-2 text-sm text-red-300">{depositsError}</p>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-neutral-800/80 text-neutral-300">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Payment ID</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Currency</th>
                  <th className="px-4 py-3 text-left">Address</th>
                  <th className="px-4 py-3 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {deposits.map((d) => (
                  <tr key={d.id} className="border-t border-neutral-800">
                    <td className="px-4 py-3">{d.id}</td>
                    <td className="px-4 py-3">{d.user_id}</td>
                    <td className="px-4 py-3">{d.payment_id || "-"}</td>
                    <td className="px-4 py-3">${d.amount_usd}</td>
                    <td className="px-4 py-3">{d.status}</td>
                    <td className="px-4 py-3">{d.pay_currency || "-"}</td>
                    <td className="px-4 py-3 max-w-[220px] truncate">
                      {d.pay_address || "-"}
                    </td>
                    <td className="px-4 py-3">{d.created_at || "-"}</td>
                  </tr>
                ))}

                {deposits.length === 0 && !depositsError && (
                  <tr className="border-t border-neutral-800">
                    <td colSpan={8} className="px-4 py-6 text-neutral-400">
                      No deposits found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 shadow-lg">
          <div className="border-b border-neutral-800 px-5 py-4">
            <h2 className="text-xl font-semibold">Recent Transactions</h2>
            {transactionsError && (
              <p className="mt-2 text-sm text-red-300">{transactionsError}</p>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-sm">
              <thead className="bg-neutral-800/80 text-neutral-300">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Balance After</th>
                  <th className="px-4 py-3 text-left">Reference</th>
                  <th className="px-4 py-3 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-t border-neutral-800">
                    <td className="px-4 py-3">{t.id}</td>
                    <td className="px-4 py-3">{t.user_id}</td>
                    <td className="px-4 py-3">{t.type}</td>
                    <td className="px-4 py-3">${t.amount_usd ?? t.amount ?? "-"}</td>
                    <td className="px-4 py-3">{t.balance_after ?? "-"}</td>
                    <td className="px-4 py-3">{t.reference || "-"}</td>
                    <td className="px-4 py-3">{t.created_at || "-"}</td>
                  </tr>
                ))}

                {transactions.length === 0 && !transactionsError && (
                  <tr className="border-t border-neutral-800">
                    <td colSpan={7} className="px-4 py-6 text-neutral-400">
                      No transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
