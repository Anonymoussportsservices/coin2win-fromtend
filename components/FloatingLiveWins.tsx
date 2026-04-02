"use client"

import { useEffect, useState } from "react"

type WinItem = {
  id: number
  user: string
  game: string
  event_type: string
  amount: number
  reference?: string | null
  created_at?: string | null
}

export default function FloatingLiveWins() {
  const [items, setItems] = useState<WinItem[]>([])
  const [index, setIndex] = useState(0)
  const [hidden, setHidden] = useState(false)

  async function loadFeed() {
    try {
      const res = await fetch("/api/activity/wins?limit=12", {
        cache: "no-store",
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && Array.isArray(data?.items)) {
        setItems(data.items)
      }
    } catch {}
  }

  useEffect(() => {
    loadFeed()
    const feedTimer = setInterval(loadFeed, 5000)
    return () => clearInterval(feedTimer)
  }, [])

  useEffect(() => {
    if (items.length <= 1) return
    const rotateTimer = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length)
    }, 3000)
    return () => clearInterval(rotateTimer)
  }, [items])

  if (hidden || items.length === 0) return null

  const item = items[index]

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-800 bg-slate-900/95 p-4 shadow-2xl backdrop-blur">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
            Live Wins
          </div>
          <div className="text-xs text-slate-500">Recent public win activity</div>
        </div>

        <button
          onClick={() => setHidden(true)}
          className="rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
        <div className="text-sm text-slate-200">
          <span className="font-bold text-white">{item.user}</span>{" "}
          {item.game === "Crash" ? "cashed out on" : "won on"}{" "}
          <span className="font-semibold text-sky-400">{item.game}</span>
        </div>

        <div className="mt-2 text-lg font-bold text-emerald-300">
          ${Number(item.amount || 0).toFixed(2)}
        </div>
      </div>
    </div>
  )
}
