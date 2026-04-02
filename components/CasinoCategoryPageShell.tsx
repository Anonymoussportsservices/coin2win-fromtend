"use client"

import { useEffect, useState } from "react"

import Image from "next/image"
import Link from "next/link"
import PlayerShell from "@/components/PlayerShell"
import CasinoGameCard from "@/components/CasinoGameCard"
import { type CasinoGame } from "@/lib/casinoData"
import { DEFAULT_BRAND, fetchPublicBrand, type PublicBrand } from "@/lib/publicBrand"

export default function CasinoCategoryPageShell({
  title,
  subtitle,
  heading,
  description,
  games,
  columns = "xl:grid-cols-4",
}: {
  title: string
  subtitle: string
  heading: string
  description: string
  games: CasinoGame[]
  columns?: string
}) {
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


  return (
    <PlayerShell title={title} subtitle={subtitle}>
      <div className="grid gap-4 text-white sm:gap-5">
        <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-black p-4 shadow-sm sm:rounded-3xl sm:p-6">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.03),transparent_28%,rgba(0,231,1,0.03)_72%,transparent_100%)]" />

          <div className="pointer-events-none absolute left-1/2 top-24 h-44 w-44 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(0,231,1,0.22)_0%,rgba(14,165,233,0.12)_38%,rgba(0,0,0,0)_72%)] blur-2xl sm:left-28 sm:top-1/2 sm:h-64 sm:w-64 sm:-translate-x-0 sm:-translate-y-1/2" />

          <div className="relative z-10 grid items-center gap-5 sm:gap-6 lg:grid-cols-[260px_1fr]">
            <div className="grid place-items-center">
              <Image
                src="/c2w-logo.png"
                alt={brand.brand_name || "Coin2Win"}
                width={260}
                height={260}
                priority
                className="h-auto w-[160px] object-contain drop-shadow-[0_10px_28px_rgba(0,0,0,0.35)] sm:w-[220px] lg:w-[260px]"
              />
            </div>

            <div className="grid gap-3 text-center lg:text-left">
              <div className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                {heading}
              </div>

              <div className="text-base font-extrabold text-[#00e701] drop-shadow-[0_0_18px_rgba(0,231,1,0.18)] sm:text-xl lg:text-2xl">
                {brand.brand_name || "Coin2Win"} Casino
              </div>

              <p className="max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                {description}
              </p>

              <div className="pt-1">
                <Link
                  href="/casino"
                  className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  ← Back to Casino
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm sm:rounded-3xl sm:p-5">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white">{heading}</h2>
            <p className="mt-1 text-sm text-slate-400">{description}</p>
          </div>

          <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${columns}`}>
            {games.map((game) => (
              <CasinoGameCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      </div>
    </PlayerShell>
  )
}
