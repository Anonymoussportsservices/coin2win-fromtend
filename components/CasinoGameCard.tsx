"use client"

import Link from "next/link"
import { type CasinoGame } from "@/lib/casinoData"

export default function CasinoGameCard({ game }: { game: CasinoGame }) {
  const isPlayable = Boolean(game.live && game.href)

  const card = (
    <div className="group min-w-[180px] max-w-[180px] rounded-2xl border border-slate-800 bg-slate-900/70 p-3 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-slate-600 hover:bg-slate-900 sm:min-w-[220px] sm:max-w-[220px] sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-2xl sm:h-12 sm:w-12 sm:text-3xl">
          {game.image}
        </div>

        <div
          className={`rounded-full px-2 py-1 text-[9px] font-semibold tracking-wide sm:px-2.5 sm:text-[10px] ${
            isPlayable
              ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : game.badge === "Hot"
              ? "border border-amber-500/30 bg-amber-500/10 text-amber-300"
              : "border border-slate-700 bg-slate-800 text-slate-400"
          }`}
        >
          {isPlayable ? "LIVE" : game.badge || "SOON"}
        </div>
      </div>

      <div className="mt-3 sm:mt-4">
        <h3 className="text-sm font-semibold text-white sm:text-base">{game.name}</h3>
        <p className="mt-1 text-[11px] text-slate-400 sm:text-xs">{game.provider}</p>
      </div>

      <div className="mt-4 sm:mt-5">
        {isPlayable ? (
          <div className="inline-flex rounded-xl bg-sky-500 px-3 py-2 text-xs font-semibold text-white transition group-hover:bg-sky-400 sm:px-4 sm:text-sm">
            Play Now
          </div>
        ) : (
          <div className="inline-flex rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-400 sm:px-4 sm:text-sm">
            Coming Soon
          </div>
        )}
      </div>
    </div>
  )

  return isPlayable && game.href ? <Link href={game.href}>{card}</Link> : card
}
