"use client";

import { useEffect, useMemo, useState } from "react";

type Game = {
  id: number;
  provider_game_id: string;
  title: string;
  category: string;
  image_url?: string;
  is_enabled: boolean;
  is_featured: boolean;
  is_live: boolean;
  sort_order: number;
};

export default function AgentCasinoGamesPage() {
  const [authorized, setAuthorized] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [games, setGames] = useState<Game[]>([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");

  async function loadGames() {
    const res = await fetch("/ui-api/admin/softswiss/games", { cache: "no-store" });
    const data = await res.json();
    setGames(Array.isArray(data.games) ? data.games : []);
  }

  useEffect(() => {
    try {
      const session = JSON.parse(localStorage.getItem("agent_session_data") || "{}");
      const id = String(session?.id || "").toLowerCase();
      const role = String(session?.role || "").toLowerCase();

      if (!id) {
        window.location.href = "/agent/login";
        return;
      }

      if (id !== "supercoin" && role !== "superadmin") {
        setAccessDenied(true);
        return;
      }

      setAuthorized(true);
      loadGames();
    } catch {
      window.location.href = "/agent/login";
    }
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return games;
    return games.filter((g) =>
      `${g.title} ${g.provider_game_id} ${g.category}`.toLowerCase().includes(q)
    );
  }, [games, query]);

  async function updateGame(id: number, patch: Partial<Game>) {
    setMessage("");
    const res = await fetch(`/ui-api/admin/softswiss/games/${id}/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });

    if (!res.ok) {
      setMessage("Save failed");
      return;
    }

    setGames((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
    setMessage("Saved ✅");
  }

  if (accessDenied) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-200">
        Access denied.
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="text-slate-300">Loading...</div>
    );
  }

  return (
    <div className="grid gap-4">
        <div className="rounded-3xl border border-white/10 bg-[#13202a] p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, provider ID, category..."
              className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none md:max-w-md"
            />
            <button
              onClick={loadGames}
              className="rounded-xl bg-emerald-400 px-4 py-3 text-sm font-black text-[#071824]"
            >
              Refresh
            </button>
          </div>
          {message ? <div className="mt-3 text-sm text-emerald-300">{message}</div> : null}
        </div>

        <div className="grid gap-4">
          {filtered.map((game) => (
            <div key={game.id} className="grid gap-4 rounded-3xl border border-white/10 bg-[#13202a] p-4 lg:grid-cols-[140px_minmax(0,1fr)]">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                {game.image_url ? (
                  <img src={game.image_url} alt={game.title} className="aspect-[3/4] w-full object-cover" />
                ) : (
                  <div className="flex aspect-[3/4] items-center justify-center text-5xl">🎰</div>
                )}
              </div>

              <div className="grid gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                    {game.provider_game_id}
                  </div>
                  <input
                    value={game.title}
                    onChange={(e) => setGames((prev) => prev.map((g) => g.id === game.id ? { ...g, title: e.target.value } : g))}
                    onBlur={(e) => updateGame(game.id, { title: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-lg font-black text-white outline-none"
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <label className="grid gap-1 text-xs font-bold text-slate-300">
                    Category
                    <select
                      value={game.category}
                      onChange={(e) => updateGame(game.id, { category: e.target.value })}
                      className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-white"
                    >
                      <option value="slots">slots</option>
                      <option value="live">live</option>
                      <option value="game-show">game-show</option>
                      <option value="blackjack">blackjack</option>
                      <option value="roulette">roulette</option>
                      <option value="table">table</option>
                    </select>
                  </label>

                  <label className="grid gap-1 text-xs font-bold text-slate-300">
                    Sort Order
                    <input
                      type="number"
                      value={game.sort_order}
                      onChange={(e) => setGames((prev) => prev.map((g) => g.id === game.id ? { ...g, sort_order: Number(e.target.value) } : g))}
                      onBlur={(e) => updateGame(game.id, { sort_order: Number(e.target.value) })}
                      className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-white"
                    />
                  </label>

                  <label className="grid gap-1 text-xs font-bold text-slate-300">
                    Thumbnail URL
                    <input
                      value={game.image_url || ""}
                      onChange={(e) => setGames((prev) => prev.map((g) => g.id === game.id ? { ...g, image_url: e.target.value } : g))}
                      onBlur={(e) => updateGame(game.id, { image_url: e.target.value })}
                      className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-white"
                    />
                  </label>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    ["is_enabled", "Enabled"],
                    ["is_featured", "Featured"],
                    ["is_live", "Live"],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => updateGame(game.id, { [key]: !(game as any)[key] } as any)}
                      className={`rounded-xl px-4 py-2 text-sm font-black ${
                        (game as any)[key]
                          ? "bg-emerald-400 text-[#071824]"
                          : "border border-white/10 bg-black/20 text-slate-300"
                      }`}
                    >
                      {label}: {(game as any)[key] ? "ON" : "OFF"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
  );
}
