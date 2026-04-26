"use client"

import { useEffect, useState } from "react"
import { DEFAULT_BRAND, fetchPublicBrand, type PublicBrand } from "@/lib/publicBrand"
import PlayerShell from "@/components/PlayerShell"
import CasinoCategoryRow from "@/components/CasinoCategoryRow"
import LobbyLiveFeed from "@/components/LobbyLiveFeed"
import {
  casinoCategories,
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
  const [softSwissGames, setSoftSwissGames] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    fetchPublicBrand().then((data) => {
      if (mounted) setBrand(data || DEFAULT_BRAND);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    fetch("/ui-api/casino/softswiss/games", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (mounted) setSoftSwissGames(Array.isArray(data?.games) ? data.games : []);
      })
      .catch(() => {
        if (mounted) setSoftSwissGames([]);
      });
    return () => {
      mounted = false;
    };
  }, []);


  const orderedCategories = LOBBY_ORDER.map((id) =>
    casinoCategories.find((category) => category.id === id)
  ).filter(Boolean)

  const casinoBanners = Array.isArray(brand.casino_banners_json) ? brand.casino_banners_json : [];
  const casinoBannerImage = casinoBanners[0]?.image_url || casinoBanners[0]?.mobile_image_url || "";

  return (
    <PlayerShell
      title="Casino"
      subtitle="Originals, slots, live casino, featured shelves, and live activity."
      fullWidth
    >
      <div className="w-full max-w-full overflow-x-hidden grid gap-3 text-white sm:gap-4">
        {casinoBannerImage ? (
          <section
            className="relative w-full max-w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_18px_40px_rgba(0,0,0,0.30)] sm:rounded-3xl"
            style={{ aspectRatio: "16 / 5" }}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${casinoBannerImage})` }}
            />
          </section>
        ) : null}

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
            games={
                  category!.id === "slots"
                    ? [
                        ...getGamesByCategory(category!.id),
                        ...softSwissGames
                          .filter((g) => String(g.category || "slots") === "slots")
                          .map((g) => ({
                            id: `softswiss-${g.provider_game_id}`,
                            name: g.title,
                            provider: "SoftSwiss",
                            image: "🎰",
                            thumbnail: g.image_url || "",
                            href: `/casino/game/${g.provider_game_id}`,
                            live: true,
                            comingSoon: false,
                            categories: ["slots"],
                            badge: g.is_featured ? "Hot" : "Soon",
                          })),
                      ]
                    : getGamesByCategory(category!.id)
                }
          />
        ))}

        <LobbyLiveFeed />
      </div>
    </PlayerShell>
  )
}
