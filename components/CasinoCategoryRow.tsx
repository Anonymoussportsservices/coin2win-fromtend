"use client"

import Link from "next/link"
import { useRef } from "react"
import CasinoGameCard from "@/components/CasinoGameCard"
import { type CasinoCategory, type CasinoGame } from "@/lib/casinoData"

export default function CasinoCategoryRow({
  category,
  games,
}: {
  category: CasinoCategory
  games: CasinoGame[]
}) {
  const railRef = useRef<HTMLDivElement | null>(null)

  if (!games.length) return null

  function scrollRow(direction: "left" | "right") {
    const el = railRef.current
    if (!el) return
    const amount = Math.max(280, Math.floor(el.clientWidth * 0.8))
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    })
  }

  return (
    <section
      id={category.id}
      className="w-full max-w-full overflow-hidden"
    >
      <div className="mb-2 flex items-center justify-between gap-3 sm:mb-3">
        <div className="min-w-0 flex-1">
          <h2 className="break-words text-xl font-black text-white sm:text-xl">
            {category.label}
          </h2>

        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => scrollRow("left")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-950 text-white transition hover:bg-slate-800"
            aria-label={`Scroll ${category.label} left`}
          >
            ←
          </button>

          <button
            type="button"
            onClick={() => scrollRow("right")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-950 text-white transition hover:bg-slate-800"
            aria-label={`Scroll ${category.label} right`}
          >
            →
          </button>

          {category.slug ? (
            <Link
              href={category.slug}
              className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              View All
            </Link>
          ) : null}
        </div>
      </div>

      <div
        ref={railRef}
        className="flex gap-3 overflow-x-auto pb-3 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4"
      >
        {games.map((game) => (
          <CasinoGameCard key={game.id} game={game} />
        ))}
      </div>
    </section>
  )
}
