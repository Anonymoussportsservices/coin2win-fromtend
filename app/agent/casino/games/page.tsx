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

const categories = ["all", "slots", "live", "game-show", "blackjack", "roulette", "table"];

export default function AgentCasinoGamesPage() {
  const [authorized, setAuthorized] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [games, setGames] = useState<Game[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [message, setMessage] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkCategory, setBulkCategory] = useState("slots");
  const [filteredMatched, setFilteredMatched] = useState<number | null>(null);

  async function syncGames() {
    const ok = window.confirm("Sync games from SoftSwiss? With SOFTSWISS_ENABLED=false this will safely skip.");
    if (!ok) return;

    setMessage("Syncing games...");
    const res = await fetch("/ui-api/admin/softswiss/games/sync", {
      method: "POST",
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data?.ok) {
      setMessage("Sync failed ❌");
      return;
    }

    if (data.skipped) {
      setMessage(`Sync skipped: ${data.reason || "disabled"} ✅`);
      return;
    }

    setMessage(`Sync complete: ${data.upserted || 0} games upserted ✅`);
    loadGames(1);
  }

  async function loadGames(nextPage = page) {
    setMessage("Loading games...");
    const params = new URLSearchParams();
    params.set("page", String(nextPage));
    params.set("limit", "50");
    if (query.trim()) params.set("q", query.trim());
    if (category !== "all") params.set("category", category);
    if (status !== "all") params.set("status", status);

    const res = await fetch(`/ui-api/admin/softswiss/games?${params.toString()}`, { cache: "no-store" });
    const data = await res.json();
    setGames(Array.isArray(data.games) ? data.games : []);
    setSelectedIds([]);
    setPage(Number(data.page || nextPage));
    setPages(Number(data.pages || 1));
    setTotal(Number(data.total || 0));
    setMessage("");
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

  const stats = useMemo(() => {
    return {
      total: games.length,
      enabled: games.filter((g) => g.is_enabled).length,
      disabled: games.filter((g) => !g.is_enabled).length,
      featured: games.filter((g) => g.is_featured).length,
      live: games.filter((g) => g.is_live).length,
    };
  }, [games]);

  const filtered = games;

  async function updateGame(id: number, patch: Partial<Game>) {
    setSavingId(id);
    setMessage("");

    try {
      const res = await fetch(`/ui-api/admin/softswiss/games/${id}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });

      if (!res.ok) throw new Error("Save failed");

      setGames((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
      setMessage("Saved ✅");
    } catch {
      setMessage("Save failed ❌");
    } finally {
      setSavingId(null);
    }
  }

  function toggleSelected(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleSelectVisible() {
    const visibleIds = games.map((g) => g.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
    setSelectedIds(allSelected ? [] : visibleIds);
  }

  async function previewFilteredBulk() {
    const res = await fetch("/ui-api/admin/softswiss/games/bulk-update-filtered", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: query, category, status, dry_run: true }),
    });
    const data = await res.json().catch(() => ({}));
    setFilteredMatched(Number(data.matched || 0));
    setMessage(`Filtered action would affect ${Number(data.matched || 0)} games`);
  }

  async function applyFilteredBulk(patch: Partial<Game>) {
    const matched = filteredMatched ?? total;
    if (!matched) {
      setMessage("No filtered games to update");
      return;
    }

    const ok = window.confirm(`Apply this change to ALL ${matched} filtered games?`);
    if (!ok) return;

    setMessage("Applying to filtered games...");
    const body: any = { q: query, category, status };
    if (patch.category) body.set_category = patch.category;
    if (typeof patch.is_enabled === "boolean") body.is_enabled = patch.is_enabled;
    if (typeof patch.is_featured === "boolean") body.is_featured = patch.is_featured;
    if (typeof patch.is_live === "boolean") body.is_live = patch.is_live;

    const res = await fetch("/ui-api/admin/softswiss/games/bulk-update-filtered", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok) {
      setMessage("Filtered bulk update failed ❌");
      return;
    }

    setMessage(`Updated ${data.updated || 0} filtered games ✅`);
    setFilteredMatched(null);
    loadGames(page);
  }

  async function bulkUpdate(patch: Partial<Game>) {
    if (!selectedIds.length) {
      setMessage("Select games first");
      return;
    }

    setMessage("Bulk saving...");
    const res = await fetch("/ui-api/admin/softswiss/games/bulk-update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds, ...patch }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok) {
      setMessage("Bulk update failed ❌");
      return;
    }

    setGames((prev) =>
      prev.map((g) => (selectedIds.includes(g.id) ? { ...g, ...patch } : g))
    );
    setMessage(`Bulk updated ${data.updated || selectedIds.length} games ✅`);
  }

  async function uploadThumbnail(game: Game, file: File) {
    setSavingId(game.id);
    setMessage("Uploading thumbnail...");

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/ui-api/upload", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (!res.ok || !data?.url) throw new Error("Upload failed");

      const finalUrl = data.url.startsWith("http") ? data.url : `${window.location.origin}${data.url}`;
      await updateGame(game.id, { image_url: finalUrl });
      setMessage("Thumbnail uploaded ✅");
    } catch {
      setMessage("Upload failed ❌");
      setSavingId(null);
    }
  }

  if (accessDenied) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-200">
        Access denied.
      </div>
    );
  }

  if (!authorized) {
    return <div className="text-slate-300">Loading...</div>;
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-3xl border border-white/10 bg-[#13202a] p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-300">
              SoftSwiss Catalog
            </div>
            <h1 className="mt-1 text-2xl font-black text-white">Casino Games</h1>
            <p className="mt-1 text-sm text-slate-400">
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={syncGames}
              className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-sm font-black text-sky-200 transition hover:bg-sky-400/20"
            >
              Sync Games
            </button>

            <button
              onClick={() => loadGames(page)}
              className="rounded-xl bg-emerald-400 px-4 py-3 text-sm font-black text-[#071824] transition hover:bg-emerald-300"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-5">
          <Stat label="Total" value={stats.total} />
          <Stat label="Enabled" value={stats.enabled} />
          <Stat label="Disabled" value={stats.disabled} />
          <Stat label="Featured" value={stats.featured} />
          <Stat label="Live" value={stats.live} />
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, provider ID, category..."
            className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
          />

          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All categories" : c}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
          >
            <option value="all">All statuses</option>
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
            <option value="featured">Featured</option>
            <option value="live">Live</option>
          </select>
        </div>

        {message ? <div className="mt-3 text-sm text-emerald-300">{message}</div> : null}
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="mb-3 flex flex-col gap-2 border-b border-white/10 pb-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="text-sm font-black text-white">Apply to all filtered results</div>
              <div className="text-xs text-slate-400">
                Uses current search/category/status filters, across every page.
                {filteredMatched !== null ? ` Matched: ${filteredMatched}` : ""}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={previewFilteredBulk}
                className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs font-black text-slate-300 hover:bg-black/40"
              >
                Preview Count
              </button>
              <button
                onClick={() => applyFilteredBulk({ is_enabled: true })}
                className="rounded-xl bg-emerald-400 px-3 py-2 text-xs font-black text-[#071824]"
              >
                Enable Filtered
              </button>
              <button
                onClick={() => applyFilteredBulk({ is_enabled: false })}
                className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-black text-red-200"
              >
                Disable Filtered
              </button>
              <button
                onClick={() => applyFilteredBulk({ is_featured: true })}
                className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-black text-emerald-200"
              >
                Feature Filtered
              </button>
              <button
                onClick={() => applyFilteredBulk({ is_featured: false })}
                className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs font-black text-white"
              >
                Unfeature Filtered
              </button>
              <button
                onClick={() => applyFilteredBulk({ category: bulkCategory })}
                className={`rounded-xl px-3 py-2 text-xs font-black ${bulkCategory ? "bg-blue-500 text-white" : "border border-white/10 bg-black/25 text-slate-300"}`}
              >
                Set Filtered Category
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="text-sm font-bold text-slate-300">
              {selectedIds.length} selected on this page
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={toggleSelectVisible}
                className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs font-black text-slate-300 hover:bg-black/40"
              >
                Select Visible
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs font-black text-slate-300 hover:bg-black/40"
              >
                Clear
              </button>
              <button
                onClick={() => bulkUpdate({ is_enabled: true })}
                className="rounded-xl bg-emerald-400 px-3 py-2 text-xs font-black text-[#071824]"
              >
                Enable
              </button>
              <button
                onClick={() => bulkUpdate({ is_enabled: false })}
                className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-black text-red-200"
              >
                Disable
              </button>
              <button
                onClick={() => bulkUpdate({ is_featured: true })}
                className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-black text-emerald-200"
              >
                Feature
              </button>
              <button
                onClick={() => bulkUpdate({ is_featured: false })}
                className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs font-black text-white"
              >
                Unfeature
              </button>
              <select
                value={bulkCategory}
                onChange={(e) => setBulkCategory(e.target.value)}
                className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs font-black text-white"
              >
                {categories.filter((c) => c !== "all").map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <button
                onClick={() => bulkUpdate({ category: bulkCategory })}
                className={`rounded-xl px-3 py-2 text-xs font-black ${bulkCategory ? "bg-blue-500 text-white" : "border border-white/10 bg-black/25 text-slate-300"}`}
              >
                Set Category
              </button>
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-300">
          <button
            onClick={() => loadGames(1)}
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 font-bold hover:bg-black/35"
          >
            Apply Filters
          </button>
          <span>
            Showing {games.length} of {total} games · Page {page} of {pages}
          </span>
        </div>
      </div>

      <div className="grid gap-3">
        <div className="hidden overflow-hidden rounded-3xl border border-white/10 bg-[#13202a] lg:block">
          <div className="grid grid-cols-[44px_58px_minmax(220px,1fr)_150px_150px_120px_190px] items-center gap-3 border-b border-white/10 bg-black/20 px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
            <div></div>
            <div>Image</div>
            <div>Game</div>
            <div>Category</div>
            <div>Status</div>
            <div>Sort</div>
            <div>Actions</div>
          </div>

          {filtered.map((game) => (
            <div
              key={game.id}
              className="grid grid-cols-[44px_58px_minmax(220px,1fr)_150px_150px_120px_190px] items-center gap-3 border-b border-white/5 px-4 py-3 transition hover:bg-white/[0.03]"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(game.id)}
                onChange={() => toggleSelected(game.id)}
                className="h-4 w-4 accent-emerald-400"
              />

              <div className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
                {game.image_url ? (
                  <img
                    src={game.image_url}
                    alt={game.title}
                    className="h-[74px] w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      const fallback = e.currentTarget.parentElement?.querySelector(".fallback-thumb");
                      if (fallback) fallback.classList.remove("hidden");
                    }}
                  />
                ) : null}

                <div className={`fallback-thumb ${game.image_url ? "hidden" : ""} flex h-[74px] w-full items-center justify-center bg-gradient-to-br from-[#0f212e] to-[#071824] text-xs font-black text-slate-400`}>
                  {game.title.slice(0, 10)}
                </div>
              </div>

              <div className="min-w-0">
                <input
                  value={game.title}
                  onChange={(e) =>
                    setGames((prev) => prev.map((g) => (g.id === game.id ? { ...g, title: e.target.value } : g)))
                  }
                  onBlur={(e) => updateGame(game.id, { title: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm font-black text-white outline-none"
                />
                <div className="mt-1 truncate text-[11px] font-bold text-slate-500">{game.provider_game_id}</div>
              </div>

              <select
                value={game.category}
                onChange={(e) => updateGame(game.id, { category: e.target.value })}
                className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white"
              >
                {categories.filter((c) => c !== "all").map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <div className="flex flex-wrap gap-1">
                <StatusPill active={game.is_enabled} label="Enabled" />
                <StatusPill active={game.is_featured} label="Featured" />
              </div>

              <input
                type="number"
                value={game.sort_order}
                onChange={(e) =>
                  setGames((prev) =>
                    prev.map((g) => (g.id === game.id ? { ...g, sort_order: Number(e.target.value) } : g))
                  )
                }
                className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white"
              />
              <button
                onClick={async () => {
                  await updateGame(game.id, { sort_order: Number(game.sort_order) });
                  loadGames(page);
                }}
                className="mt-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-black text-emerald-200"
              >
                Save Sort
              </button>

              <div className="flex flex-wrap gap-2">
                <a
                  href={`/casino/game/${game.provider_game_id}`}
                  target="_blank"
                  className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-3 py-2 text-xs font-black text-sky-200"
                >
                  Preview
                </a>

                <label className="cursor-pointer rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs font-black text-slate-200 hover:bg-black/40">
                  Upload
                  <span className="mt-1 block text-[10px] font-bold text-slate-500">3:4 · 600×800 · WebP/JPG/PNG</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadThumbnail(game, file);
                      e.currentTarget.value = "";
                    }}
                  />
                </label>

                {[
                  ["is_enabled", "E"],
                  ["is_featured", "F"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    disabled={savingId === game.id}
                    title={String(key)}
                    onClick={() => updateGame(game.id, { [key]: !(game as any)[key] } as any)}
                    className={`h-9 w-9 rounded-xl text-xs font-black transition disabled:opacity-50 ${
                      (game as any)[key]
                        ? "bg-emerald-400 text-[#071824]"
                        : "border border-white/10 bg-black/25 text-slate-300 hover:bg-black/40"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-3 lg:hidden">
          {filtered.map((game) => (
            <div key={game.id} className="overflow-hidden rounded-3xl border border-white/10 bg-[#13202a] shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
              <div className="relative">
                {game.image_url ? (
                  <img
                    src={game.image_url}
                    alt={game.title}
                    className="h-36 w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      const fallback = e.currentTarget.parentElement?.querySelector(".fallback-thumb");
                      if (fallback) fallback.classList.remove("hidden");
                    }}
                  />
                ) : null}

                <div className={`fallback-thumb ${game.image_url ? "hidden" : ""} flex h-36 w-full items-center justify-center bg-gradient-to-br from-[#0f212e] to-[#071824] text-lg font-black text-slate-400`}>
                  {game.title.slice(0, 12)}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                <label className="absolute left-3 top-3 flex items-center gap-2 rounded-xl border border-white/10 bg-black/55 px-3 py-2 text-xs font-black text-white backdrop-blur">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(game.id)}
                    onChange={() => toggleSelected(game.id)}
                    className="h-4 w-4 accent-emerald-400"
                  />
                  Select
                </label>
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="break-all text-[10px] font-bold uppercase tracking-[0.14em] text-slate-300">{game.provider_game_id}</div>
                  <input
                    value={game.title}
                    onChange={(e) =>
                      setGames((prev) => prev.map((g) => (g.id === game.id ? { ...g, title: e.target.value } : g)))
                    }
                    onBlur={(e) => updateGame(game.id, { title: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/45 px-3 py-2 text-base font-black text-white outline-none backdrop-blur"
                  />
                </div>
              </div>

              <div className="grid gap-3 p-3">
                <div className="flex flex-wrap gap-2">
                  <StatusPill active={game.is_enabled} label="Enabled" />
                  <StatusPill active={game.is_featured} label="Featured" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={game.category}
                    onChange={(e) => updateGame(game.id, { category: e.target.value })}
                    className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white"
                  >
                    {categories.filter((c) => c !== "all").map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>

                  <input
                    type="number"
                    value={game.sort_order}
                    onChange={(e) =>
                      setGames((prev) =>
                        prev.map((g) => (g.id === game.id ? { ...g, sort_order: Number(e.target.value) } : g))
                      )
                    }
                    className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white"
                  />
                  <button
                    onClick={async () => {
                      await updateGame(game.id, { sort_order: Number(game.sort_order) });
                      loadGames(page);
                    }}
                    className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-black text-emerald-200"
                  >
                    Save Sort
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <a
                    href={`/casino/game/${game.provider_game_id}`}
                    target="_blank"
                    className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-3 py-2 text-xs font-black text-sky-200"
                  >
                    Preview
                  </a>

                  <label className="cursor-pointer rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs font-black text-slate-200">
                    Upload
                    <span className="mt-1 block text-[10px] font-bold text-slate-500">3:4 · 600×800</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadThumbnail(game, file);
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>

                  <button
  onClick={() => updateGame(game.id, { is_enabled: !game.is_enabled })}
  className={`rounded-xl px-3 py-2 text-xs font-black ${
    game.is_enabled
      ? "bg-emerald-400 text-[#071824]"
      : "border border-white/10 bg-black/25 text-white"
  }`}
>
  Enabled
</button>
                  <button
  onClick={() => updateGame(game.id, { is_featured: !game.is_featured })}
  className={`rounded-xl px-3 py-2 text-xs font-black ${
    game.is_featured
      ? "bg-emerald-400 text-[#071824]"
      : "border border-white/10 bg-black/25 text-white"
  }`}
>
  Featured
</button>
                </div>

                {savingId === game.id ? <div className="text-sm font-bold text-amber-300">Saving...</div> : null}
              </div>
            </div>
          ))}
        </div>

        {!filtered.length ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-[#13202a] p-8 text-center text-slate-400">
            No games match these filters.
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-[#13202a] p-4">
          <button
            disabled={page <= 1}
            onClick={() => loadGames(Math.max(1, page - 1))}
            className="rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Previous
          </button>

          <div className="text-sm font-bold text-slate-300">
            Page {page} of {pages} · {total} total
          </div>

          <button
            disabled={page >= pages}
            onClick={() => loadGames(Math.min(pages, page + 1))}
            className="rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={`rounded-full px-2 py-1 text-[10px] font-black ${
      active
        ? "bg-emerald-400/15 text-emerald-300"
        : "bg-slate-700/40 text-slate-400"
    }`}>
      {label}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-black text-white">{value}</div>
    </div>
  );
}
