"use client";

import PlayerShell from "@/components/PlayerShell";
import CasinoGameCard from "@/components/CasinoGameCard";
import { getGamesByCategory } from "@/lib/casinoData";

export default function OriginalsPage() {
  const games = getGamesByCategory("originals");

  return (
    <PlayerShell title="Originals" fullWidth>
      <main className="grid gap-5 text-white">
        <section>
          <h1 className="text-2xl font-black sm:text-3xl">Originals</h1>
          <p className="mt-1 text-sm font-semibold text-slate-400">
            Coin2Win in-house games built for fast play.
          </p>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {games.map((game) => (
            <div key={game.id} className="min-w-0">
              <CasinoGameCard game={game} />
            </div>
          ))}
        </section>
      </main>
    </PlayerShell>
  );
}
