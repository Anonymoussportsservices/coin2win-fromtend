"use client"

import Link from "next/link"
import { type CasinoGame } from "@/lib/casinoData"

export default function CasinoGameCard({ game }: { game: CasinoGame }) {
  const isPlayable = Boolean(game.live && game.href)

  const card = (
    <div className="group relative min-w-[150px] max-w-[150px] overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-400/55 hover:shadow-[0_18px_42px_rgba(0,231,1,0.16)] sm:min-w-[190px] sm:max-w-[190px]">
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-950">
        {game.thumbnail ? (
          <img src={game.thumbnail} alt={game.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-6xl">{game.image}</div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-90" />

        {/* PLAY OVERLAY */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition duration-300 group-hover:opacity-100">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400 text-black shadow-xl">
            ▶
          </div>
        </div>


        <div className="absolute left-2 top-2 rounded-full border border-white/10 bg-black/55 px-2 py-1 text-[10px] font-black text-white backdrop-blur">
          {isPlayable ? "PLAY" : game.badge || "SOON"}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="line-clamp-2 text-sm font-black text-white">{game.name}</h3>
          <p className="mt-1 truncate text-[11px] font-semibold text-slate-300">{game.provider}</p>
        </div>
      </div>
    </div>
  )

  return isPlayable && game.href ? <Link href={game.href}>{card}</Link> : card
}
