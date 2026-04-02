"use client"

import { useEffect, useState } from "react"
import { DEFAULT_BRAND, fetchPublicBrand, type PublicBrand } from "@/lib/publicBrand"
import Image from "next/image"
import Link from "next/link"
import PlayerShell from "@/components/PlayerShell"
import CasinoCategoryRow from "@/components/CasinoCategoryRow"
import LobbyLiveFeed from "@/components/LobbyLiveFeed"
import {
  casinoCategories,
  casinoHero,
  getGamesByCategory,
} from "@/lib/casinoData"

const LOBBY_ORDER = [
  "originals",
  "slots",
  "hot",
  "live",
  "game-show",
  "new-releases",
  "blackjack",
  "roulette",
  "table",
]

export default function CasinoLobbyPage() {
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


  const orderedCategories = LOBBY_ORDER.map((id) =>
    casinoCategories.find((category) => category.id === id)
  ).filter(Boolean)

  return (
    <PlayerShell
      title="Casino"
      subtitle="Originals, slots, live casino, featured shelves, and live activity."
      fullWidth
    >
      <div className="w-full max-w-full overflow-x-hidden grid gap-3 text-white sm:gap-4">
        <section className="relative w-full max-w-full overflow-hidden rounded-2xl border border-white/10 bg-black p-3 shadow-[0_18px_40px_rgba(0,0,0,0.30)] sm:rounded-3xl sm:p-7">
          <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(0,231,1,0.22)_0%,rgba(14,165,233,0.12)_38%,rgba(0,0,0,0)_72%)] blur-xl sm:left-28 sm:h-64 sm:w-64 sm:-translate-x-0" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.03),transparent_28%,rgba(0,231,1,0.03)_72%,transparent_100%)]" />

          <div className="relative z-10 grid w-full max-w-full items-center gap-4 md:grid-cols-[280px_minmax(0,1fr)] sm:gap-6">
            <div className="grid place-items-center min-w-0">
              <Image
                src={brand.logo_url || "/c2w-logo.png"}
                alt={brand.brand_name || "Coin2Win"}
                width={260}
                height={260}
                className="h-auto w-[130px] max-w-full object-contain drop-shadow-[0_10px_28px_rgba(0,0,0,0.35)] sm:w-[180px] md:w-[260px]"
                priority
              />
            </div>

            <div className="grid min-w-0 gap-2 text-center md:text-left sm:gap-3">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-sky-400 sm:text-sm">
                {brand.brand_name || casinoHero.badge}
              </div>

              <h1 className="break-words text-2xl font-black leading-none tracking-tight sm:text-3xl md:text-5xl">
                {brand.brand_name || casinoHero.title}
              </h1>

              <p className="max-w-full break-words text-xs leading-5 text-slate-300 sm:text-sm sm:leading-7 md:max-w-3xl md:text-base">
                {brand.support_email ? `${brand.brand_name || "Coin2Win"} casino lobby • Support: ${brand.support_email}` : `${brand.brand_name || "Coin2Win"} casino lobby`}
              </p>

              <div className="mt-1 flex w-full flex-wrap justify-center gap-2 md:justify-start sm:mt-2 sm:gap-3">
                <Link
                  href={casinoHero.primaryCta.href}
                  className="max-w-full rounded-2xl bg-sky-500 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-sky-400 sm:px-5 sm:py-3 sm:text-sm"
                >
                  {casinoHero.primaryCta.label}
                </Link>

                <Link
                  href={casinoHero.secondaryCta.href}
                  className="max-w-full rounded-2xl border border-slate-700 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800 sm:px-5 sm:py-3 sm:text-sm"
                >
                  {casinoHero.secondaryCta.label}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full max-w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 p-2.5 shadow-sm sm:p-3">
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {orderedCategories.map((category) => (
              <a
                key={category!.id}
                href={`#${category!.id}`}
                className="shrink-0 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:border-sky-500/50 hover:bg-slate-800 sm:px-4 sm:text-sm"
              >
                {category!.id === "originals" ? `${brand.brand_name || "Coin2Win"} Originals` : category!.label}
              </a>
            ))}
          </div>
        </section>

        {orderedCategories.map((category) => (
          <CasinoCategoryRow
            key={category!.id}
            category={category!}
            games={getGamesByCategory(category!.id)}
          />
        ))}

        <LobbyLiveFeed />
      </div>
    </PlayerShell>
  )
}
