"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PlayerShell from "@/components/PlayerShell";
import { DEFAULT_BRAND, fetchPublicBrand, type PublicBrand } from "@/lib/publicBrand";

type PromoCard = {
  title?: string;
  image_url?: string;
  description?: string;
  terms?: string;
  cta_label?: string;
  cta_href?: string;
};

export default function PromotionsPage() {
  const [brand, setBrand] = useState<PublicBrand>(DEFAULT_BRAND);
  const [selected, setSelected] = useState<PromoCard | null>(null);

  useEffect(() => {
    fetchPublicBrand().then((data) => setBrand(data || DEFAULT_BRAND));
  }, []);

  const promos: PromoCard[] = Array.isArray((brand as any).promotion_cards_json)
    ? (brand as any).promotion_cards_json.filter((p: PromoCard) => p?.image_url)
    : [];

  return (
    <PlayerShell title="Promotions" fullWidth>
      <main className="grid gap-5 text-white">
        <section className="flex flex-col gap-1">
          <h1 className="text-2xl font-black sm:text-3xl">Promotions</h1>
          <p className="text-sm font-semibold text-slate-400">
            Current offers and featured rewards.
          </p>
        </section>

        {promos.length ? (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {promos.map((promo, idx) => (
              <button
                key={`${promo.title || "promo"}-${idx}`}
                onClick={() => setSelected(promo)}
                className="group overflow-hidden rounded-3xl border border-white/10 bg-[#13202a] shadow-[0_18px_40px_rgba(0,0,0,0.24)] transition hover:-translate-y-1 hover:border-emerald-400/45 hover:shadow-[0_18px_46px_rgba(0,231,1,0.14)]"
              >
                <img
                  src={promo.image_url}
                  alt={promo.title || "Promotion"}
                  className="aspect-[16/9] w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </button>
            ))}
          </section>
        ) : (
          <section className="rounded-3xl border border-dashed border-white/10 bg-[#13202a] p-8 text-center text-slate-400">
            No promotions available right now.
          </section>
        )}

        {selected ? (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="animate-[promoModal_180ms_ease-out] w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#13202a] shadow-[0_28px_90px_rgba(0,0,0,0.65)]">
              {selected.image_url ? (
                <img
                  src={selected.image_url}
                  alt={selected.title || "Promotion"}
                  className="aspect-[16/9] w-full object-cover"
                />
              ) : null}

              <div className="grid gap-4 p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-white">
                      {selected.title || "Promotion"}
                    </h2>
                    {selected.description ? (
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        {selected.description}
                      </p>
                    ) : null}
                  </div>

                  <button
                    onClick={() => setSelected(null)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/25 text-xl font-black text-white hover:bg-black/40"
                  >
                    ×
                  </button>
                </div>

                {selected.terms ? (
                  <div className="max-h-40 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-slate-400">
                    {selected.terms}
                  </div>
                ) : null}

                {selected.cta_href ? (
                  <Link
                    href={selected.cta_href}
                    className="inline-flex w-fit rounded-xl bg-emerald-400 px-5 py-3 text-sm font-black text-[#071824] transition hover:bg-emerald-300"
                  >
                    {selected.cta_label || "Play Now"}
                  </Link>
                ) : null}
              </div>
            </div>

            <style jsx>{`
              @keyframes promoModal {
                from {
                  opacity: 0;
                  transform: scale(0.96) translateY(8px);
                }
                to {
                  opacity: 1;
                  transform: scale(1) translateY(0);
                }
              }
            `}</style>
          </div>
        ) : null}
      </main>
    </PlayerShell>
  );
}
