"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import PlayerShell from "@/components/PlayerShell";
import CasinoCategoryRow from "@/components/CasinoCategoryRow";
import LobbyLiveFeed from "@/components/LobbyLiveFeed";
import {
  DEFAULT_BRAND,
  fetchPublicBrand,
  getReferralCodeFromUrl,
  type PublicBrand,
  type PublicCmsBanner,
} from "@/lib/publicBrand";
import { useBrandMeta } from "@/lib/useBrandMeta";
import { casinoCategories, getGamesByCategory, type CasinoGame } from "@/lib/casinoData";

type CmsFaq = {
  question?: string;
  answer?: string;
};

function normalizeBanners(brand: PublicBrand): PublicCmsBanner[] {
  const rows = Array.isArray((brand as any).home_banners_json) ? (brand as any).home_banners_json : [];

  if (rows.length) return rows;

  return [
    {
      badge: "",
      title: `${brand.brand_name || "Coin2Win"} Casino`,
      cta_label: "Enter Casino",
      cta_href: "/casino",
    },
    {
      badge: "Originals",
      title: "Play Crash",
      cta_label: "Play Crash",
      cta_href: "/crash",
    },
    {
      badge: "Fast Wallet",
      title: "Open Cashier",
      cta_label: "Open Cashier",
      cta_href: "/cashier",
    },
  ];
}

function normalizeFaq(brand: PublicBrand): CmsFaq[] {
  const rows = Array.isArray((brand as any).promotion_faq_json) ? (brand as any).promotion_faq_json : [];

  if (rows.length) return rows;

  return [
    {
      question: "How do I deposit?",
      answer: "Go to Cashier, choose your method, and follow the instructions.",
    },
    {
      question: "Are Originals provably fair?",
      answer: "Coin2Win Originals are built for transparent gameplay and preserved as in-house games.",
    },
    {
      question: "Where can I review my activity?",
      answer: "Use My Bets, Cashier history, and the player dashboard to review recent activity.",
    },
  ];
}

function HeroCarousel({ banners }: { banners: PublicCmsBanner[] }) {
  const [active, setActive] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const safeBanners = banners.length ? banners : [];
  const banner = safeBanners[active] || safeBanners[0];

  function go(next: number) {
    if (!safeBanners.length) return;
    setActive((next + safeBanners.length) % safeBanners.length);
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current == null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const diff = touchStartX.current - endX;
    touchStartX.current = null;

    if (Math.abs(diff) < 40) return;
    go(active + (diff > 0 ? 1 : -1));
  }

  if (!banner) return null;

  const bgImage = banner.image_url || banner.mobile_image_url || "";
  const href = banner.cta_href || "/casino";
  const label = banner.cta_label || "";

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#1a2c38] shadow-[0_18px_44px_rgba(0,0,0,0.28)]" style={{ aspectRatio: "16 / 5" }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {bgImage ? (
        <div className="absolute inset-0 bg-cover bg-center opacity-100" style={{ backgroundImage: `url(${bgImage})` }} />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(0,231,1,0.22),transparent_35%),linear-gradient(135deg,#213743,#0f212e)]" />
      )}

      <div className="absolute inset-0 bg-gradient-to-r from-[#071824]/45 via-[#071824]/18 to-transparent" />

      <div className="relative z-10 flex h-full max-w-2xl flex-col justify-end p-5 sm:p-8">
        {(banner.badge || "").trim() ? (
          <div className="mb-3 inline-flex w-fit rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-300">
            {banner.badge}
          </div>
        ) : null}

        <h1 className="text-4xl font-black leading-tight text-white sm:text-6xl">
          {banner.title || ""}
        </h1>

        <Link
          href={href}
          className="mt-6 inline-flex w-fit rounded-xl bg-emerald-400 px-5 py-3 text-sm font-black text-[#071824] transition hover:bg-emerald-300"
        >
          {label}
        </Link>
      </div>

      {safeBanners.length > 1 ? (
        <>
          <button
            type="button"
            onClick={() => go(active - 1)}
            className="absolute left-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 rounded-full border border-white/10 bg-black/35 text-white hover:bg-black/60 sm:block"
            aria-label="Previous banner"
          >
            ←
          </button>

          <button
            type="button"
            onClick={() => go(active + 1)}
            className="absolute right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 rounded-full border border-white/10 bg-black/35 text-white hover:bg-black/60 sm:block"
            aria-label="Next banner"
          >
            →
          </button>

          <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2">
            {safeBanners.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                className={`h-2 rounded-full transition-all ${i === active ? "w-8 bg-emerald-400" : "w-2 bg-white/35"}`}
                aria-label={`Go to banner ${i + 1}`}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

export default function HomePage() {
  const [brand, setBrand] = useState<PublicBrand>(DEFAULT_BRAND);
  const [referralCode, setReferralCode] = useState("");
  const [featuredGames, setFeaturedGames] = useState<CasinoGame[]>([]);

  useBrandMeta(brand);

  useEffect(() => {
    let mounted = true;

    fetchPublicBrand().then((data) => {
      if (mounted) setBrand(data || DEFAULT_BRAND);
    });

    setReferralCode(getReferralCodeFromUrl());

    fetch("/ui-api/casino/softswiss/games?limit=24", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        const games = Array.isArray(data.games)
          ? data.games
              .filter((g: any) => g.is_featured)
              .map((g: any) => ({
                id: g.provider_game_id,
                name: g.title,
                provider: "SoftSwiss",
                image: "🎰",
                thumbnail: g.image_url || "",
                href: `/casino/game/${g.provider_game_id}`,
                live: true,
                comingSoon: false,
                categories: ["featured", g.category || "slots"],
                badge: "Featured",
              }))
          : [];
        if (mounted) setFeaturedGames(games);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  const registerHref = useMemo(
    () => (referralCode ? `/register?ref=${encodeURIComponent(referralCode)}` : "/register"),
    [referralCode]
  );

  const homeBanners = normalizeBanners(brand);
  const faqRows = normalizeFaq(brand);

  const originalsCategory = casinoCategories.find((c) => c.id === "originals");
  const hotCategory = casinoCategories.find((c) => c.id === "hot");
  const liveCategory = casinoCategories.find((c) => c.id === "live");
  const featuredCategory = {
    id: "featured",
    label: "Featured Games",
    description: "Promoted casino picks controlled from Casino Games backoffice.",
  };

  return (
    <PlayerShell
      title={brand.brand_name || "Coin2Win"}
      subtitle="Stake-style casino home with CMS-ready banners."
      fullWidth
    >
      <main className="grid w-full gap-4 text-white sm:gap-5">
        <HeroCarousel banners={homeBanners} />

        <LobbyLiveFeed />

        {originalsCategory ? <CasinoCategoryRow category={originalsCategory} games={getGamesByCategory("originals")} /> : null}
        {featuredGames.length ? <CasinoCategoryRow category={featuredCategory} games={featuredGames} /> : null}
        {hotCategory ? <CasinoCategoryRow category={hotCategory} games={getGamesByCategory("hot")} /> : null}
        {liveCategory ? <CasinoCategoryRow category={liveCategory} games={getGamesByCategory("live")} /> : null}

        <section className="grid gap-3 rounded-3xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-400">
              FAQ
            </div>
            <h2 className="mt-1 text-xl font-black">Questions & answers</h2>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {faqRows.map((item, idx) => (
              <details
                key={`${item.question || "faq"}-${idx}`}
                className="rounded-2xl border border-slate-800 bg-[#13202a] p-4 open:border-emerald-400/30"
              >
                <summary className="cursor-pointer text-sm font-black text-white">
                  {item.question || "FAQ question"}
                </summary>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {item.answer || "FAQ answer controlled from CMS."}
                </p>
              </details>
            ))}
          </div>
        </section>
      </main>
    </PlayerShell>
  );
}
