"use client"

import { useEffect, useState } from "react"
import { DEFAULT_BRAND, fetchPublicBrand, type PublicBrand } from "@/lib/publicBrand"

type WinItem = {
  id: number
  user: string
  game: string
  event_type: string
  amount: number
  reference?: string | null
  created_at?: string | null
}

export default function LiveWinsFeed() {
  const [brand, setBrand] = useState<PublicBrand>(DEFAULT_BRAND);

  useEffect(() => {
    let mounted = true;
    fetchPublicBrand().then((data) => {
      if (mounted) setBrand(data || DEFAULT_BRAND);
    });
    return () => {
      mounted = false;
    };
  }, []);


  const [items, setItems] = useState<WinItem[]>([])
  const [loading, setLoading] = useState(true)

  async function loadFeed() {
    try {
      const res = await fetch("/api/activity/wins?limit=12", {
        cache: "no-store",
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setItems(Array.isArray(data?.items) ? data.items : [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFeed()
    const timer = setInterval(loadFeed, 4000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white">Live Wins</h2>
        <p className="mt-1 text-sm text-slate-400">
          Recent public win activity across {brand.brand_name || "Coin2Win"}.
        </p>
      </div>

      {loading && (
        <div className="text-sm text-slate-400">Loading live wins...</div>
      )}

      {!loading && items.length === 0 && (
        <div className="text-sm text-slate-400">No wins yet.</div>
      )}

      {!loading && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950 p-4"
            >
              <div className="text-sm text-slate-200">
                <span className="font-semibold text-white">{item.user}</span>{" "}
                {item.game === "Crash" ? "cashed out on" : "won on"}{" "}
                <span className="font-semibold text-sky-400">{item.game}</span>
              </div>

              <div className="text-sm font-bold text-emerald-300">
                ${Number(item.amount || 0).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
