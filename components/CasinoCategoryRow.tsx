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
      className="w-full max-w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 p-3 shadow-sm sm:rounded-3xl sm:p-5"
    >
      <div className="mb-3 flex flex-col gap-3 sm:mb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="break-words text-lg font-bold text-white sm:text-xl">
            {category.label}
          </h2>
          {category.description ? (
            <p className="mt-1 break-words text-xs text-slate-400 sm:text-sm">
              {category.description}
            </p>
          ) : null}
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
        className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4"
      >
        {games.map((game) => (
          <CasinoGameCard key={game.id} game={game} />
        ))}
      </div>
    </section>
  )
}
