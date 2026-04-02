"use client";

import Link from "next/link";
import { useEffect, useState } from "react"
import { DEFAULT_BRAND, fetchPublicBrand, type PublicBrand } from "@/lib/publicBrand";
import { clearAuth, getStoredUser } from "@/lib/auth";
import { getGamesByCategory } from "@/lib/casinoData";
import CasinoGameCard from "@/components/CasinoGameCard";

type WalletData = {
  user_id: string;
  balance_total: number;
  balance_available: number;
  balance_pending: number;
};

type Props = {
  categoryId: string;
  title: string;
  description: string;
  sectionTitle: string;
  sectionDescription: string;
  gridColsClassName?: string;
};

function money(v?: number) {
  if (typeof v !== "number" || Number.isNaN(v)) return "$0.00";
  return `$${v.toFixed(2)}`;
}

export default function CasinoCategoryPage({
  categoryId,
  title,
  description,
  sectionTitle,
  sectionDescription,
  gridColsClassName = "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
}: Props) {
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


  const [wallet, setWallet] = useState<WalletData | null>(null);
  const games = getGamesByCategory(categoryId);

  useEffect(() => {
    async function loadWallet() {
      const user = getStoredUser();
      if (!user?.user_id) return;

      const res = await fetch(`/api/wallet/${user.user_id}`, { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (res.ok) setWallet(data);
    }

    loadWallet();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-8 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-400">
                {brand.brand_name || "Coin2Win"} Casino
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
                {title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-400 md:text-base">
                {description}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {wallet && (
                <div className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Available
                  </div>
                  <div className="mt-1 text-sm font-bold text-white">
                    {money(wallet.balance_available)}
                  </div>
                </div>
              )}

              <Link
                href="/casino"
                className="rounded-2xl border border-slate-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Back to Casino
              </Link>

              <Link
                href="/cashier"
                className="rounded-2xl border border-slate-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Cashier
              </Link>

              <button
                onClick={() => {
                  clearAuth();
                  window.location.href = "/";
                }}
                className="rounded-2xl border border-red-500/40 px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500 hover:text-white"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-white">{sectionTitle}</h2>
            <p className="mt-1 text-sm text-slate-400">{sectionDescription}</p>
          </div>

          <div className={`grid gap-5 ${gridColsClassName}`}>
            {games.map((game) => (
              <CasinoGameCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
