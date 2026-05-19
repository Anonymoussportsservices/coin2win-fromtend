"use client";

import { useEffect, useMemo, useState } from "react";
import { getStoredUser } from "../lib/auth";
import { API_ENDPOINTS, apiGet, apiPost, notifyWalletChanged } from "../lib/gameApi";
import RecentBetsPanel from "./RecentBetsPanel";

function money(v: unknown) {
  return `$${Number(v || 0).toFixed(2)}`;
}

export default function MinesGame() {
  const user = getStoredUser();
  const userId = user?.user_id || "player_001";

  const [bet, setBet] = useState(1);
  const [mines, setMines] = useState(3);
  const [game, setGame] = useState<any>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [recentBets,setRecentBets]=useState<any[]>([]);

  useEffect(() => {
    async function loadActive() {
      if (!userId) return;
      try {
        const data = await apiGet(API_ENDPOINTS.minesBets(userId));
        const bets = Array.isArray(data?.bets) ? data.bets : [];
        setRecentBets(bets);
        const active = bets.find((b: any) => b?.status === "active");
        if (active) setGame(active);
      } catch {}
    }
    loadActive();
  }, [userId]);

  async function start() {
    setBusy(true);
    setError("");
    try {
      const data = await apiPost(API_ENDPOINTS.minesStart, {
        user_id: userId,
        amount_usd: bet,
        mine_count: mines,
      });
      setGame(data);
      notifyWalletChanged();
      try { const r=await apiGet(API_ENDPOINTS.minesBets(userId)); setRecentBets(Array.isArray(r?.bets)?r.bets:[]); } catch {}
    } catch (e: any) {
      setError(e?.message || "Start failed");
    } finally {
      setBusy(false);
    }
  }

  async function reveal(tile: number) {
    if (!game || game?.status !== "active" || busy) return;
    setBusy(true);
    setError("");
    try {
      const data = await apiPost(API_ENDPOINTS.minesReveal, {
        user_id: userId,
        bet_id: game?.bet_id || game?.id,
        tile_index: tile,
      });
      setGame(data);
      notifyWalletChanged();
      try { const r=await apiGet(API_ENDPOINTS.minesBets(userId)); setRecentBets(Array.isArray(r?.bets)?r.bets:[]); } catch {}
    } catch (e: any) {
      setError(e?.message || "Reveal failed");
    } finally {
      setBusy(false);
    }
  }

  async function cashout() {
    if (!game || game?.status !== "active" || busy) return;
    setBusy(true);
    setError("");
    try {
      const data = await apiPost(API_ENDPOINTS.minesCashout, {
        user_id: userId,
        bet_id: game?.bet_id || game?.id,
      });
      setGame(data);
      notifyWalletChanged();
      try { const r=await apiGet(API_ENDPOINTS.minesBets(userId)); setRecentBets(Array.isArray(r?.bets)?r.bets:[]); } catch {}
    } catch (e: any) {
      setError(e?.message || "Cashout failed");
    } finally {
      setBusy(false);
    }
  }

  const revealed = Array.isArray(game?.revealed_tiles) ? game.revealed_tiles : [];
  const status = String(game?.status || "");
  const canPlay = status === "active";

  const liveMultiplier = Number(game?.multiplier || 1);
  const liveCashout = Number(game?.cashout_value ?? game?.payout ?? 0);
  const safeReveals = Number(game?.safe_reveals || 0);

  const quickBets = [1, 5, 10, 25];

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const sync = () => setIsMobile(window.innerWidth < 768);
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  const statusTone = useMemo(() => {
    if (status === "active") return { bg: "#1b3a2d", fg: "#86efac", label: "Active" };
    if (status === "lost") return { bg: "#3b1219", fg: "#fca5a5", label: "Busted" };
    if (status === "cashed_out") return { bg: "#122b3b", fg: "#93c5fd", label: "Cashed Out" };
    return { bg: "#13202a", fg: "#cbd5e1", label: status || "-" };
  }, [status]);

  return (
    <div
      style={{
        maxWidth: 1180,
        margin: "0 auto",
        padding: isMobile ? 6 : 20,
        color: "#fff",
        display: "grid",
        gap: isMobile ? 8 : 18,
        overflowX: "hidden",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(4,minmax(0,1fr))" : "repeat(4,minmax(0,1fr))",
          gap: 12,
        }}
      >
        {[
          { label: "Bet", value: money(game?.amount_usd ?? bet) },
          { label: "Mines", value: String(game?.mine_count ?? mines) },
          { label: "Multiplier", value: `x${liveMultiplier.toFixed(2)}` },
          { label: "Safe Picks", value: String(safeReveals) },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              background: "#1a2c38",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 18,
              padding: "14px 16px",
            }}
          >
            <div style={{ fontSize: 11, color: "#7c8ea3", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em" }}>
              {item.label}
            </div>
            <div style={{ marginTop: 8, fontSize: isMobile ? 20 : 26, fontWeight: 900 }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "340px minmax(0,1fr)",
          gap: 18,
          alignItems: "start",
        }}
      >
        <div
          style={{
            order: isMobile ? 2 : 1,
            background: "#1a2c38",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 22,
            padding: isMobile ? 8 : 18,
            display: "grid",
            gap: isMobile ? 8 : 16,
          }}
        >
          <div>
            <div style={{ fontSize: 30, fontWeight: 900, lineHeight: 1 }}>Mines</div>
            <div style={{ color: "#8ea2b5", fontSize: 14, marginTop: 8 }}>
              Pick diamonds, avoid bombs, cash out whenever you like.
            </div>
          </div>

          <div
            style={{
              background: statusTone.bg,
              color: statusTone.fg,
              borderRadius: 16,
              padding: "12px 14px",
              fontWeight: 900,
            }}
          >
            {statusTone.label}
          </div>

          {!game && (
            <>
              <div>
                <div style={{ fontSize: 12, color: "#8ea2b5", fontWeight: 700, marginBottom: 8 }}>Bet Amount</div>
                <input
                  type="number"
                  min="0.1"
                  step="0.01"
                  value={bet}
                  onChange={(e) => setBet(Number(e.target.value || 0))}
                  style={{
                    width: "100%",
                    background: "#0f212e",
                    color: "#fff",
                    border: "1px solid #2a4555",
                    borderRadius: 14,
                    padding: "14px 14px",
                    fontSize: 16,
                    fontWeight: 800,
                    boxSizing: "border-box",
                  }}
                />
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 8, marginTop: 10 }}>
                  {quickBets.map((v) => (
                    <button
                      key={v}
                      onClick={() => setBet(v)}
                      style={{
                        background: "#13202a",
                        color: "#d7e3ee",
                        border: "1px solid #2a4555",
                        borderRadius: 12,
                        padding: "10px 0",
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      {money(v)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: "#8ea2b5", fontWeight: 700, marginBottom: 8 }}>Mines</div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={mines}
                  onChange={(e) => setMines(Number(e.target.value || 3))}
                  style={{ width: "100%" }}
                />
                <div style={{ marginTop: 8, fontWeight: 900, fontSize: 18 }}>{mines}</div>
              </div>

              <button
                onClick={start}
                disabled={busy}
                style={{
                  background: "#00e701",
                  color: "#071824",
                  border: "none",
                  borderRadius: 16,
                  padding: "15px 18px",
                  fontWeight: 900,
                  fontSize: 16,
                  cursor: "pointer",
                }}
              >
                {busy ? "Starting..." : "Bet"}
              </button>
            </>
          )}

          {game && (
            <>
              <div
                style={{
                  background: "#13202a",
                  border: "1px solid #2a4555",
                  borderRadius: 16,
                  padding: 14,
                  display: "grid",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", color: "#8ea2b5", fontSize: 13 }}>
                  <span>Current Multiplier</span>
                  <strong style={{ color: "#fff" }}>x{liveMultiplier.toFixed(2)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#8ea2b5", fontSize: 13 }}>
                  <span>Cashout Value</span>
                  <strong style={{ color: "#fff" }}>{money(liveCashout)}</strong>
                </div>
              </div>

              {canPlay ? (
                <button
                  onClick={cashout}
                  disabled={busy}
                  style={{
                    background: "#00e701",
                    color: "#071824",
                    border: "none",
                    borderRadius: 16,
                    padding: "15px 18px",
                    fontWeight: 900,
                    fontSize: 16,
                    cursor: "pointer",
                  }}
                >
                  {busy ? "Working..." : `Cash Out ${money(liveCashout)}`}
                </button>
              ) : (
                <button
                  onClick={() => setGame(null)}
                  style={{
                    background: "#13202a",
                    color: "#fff",
                    border: "1px solid #2a4555",
                    borderRadius: 16,
                    padding: "15px 18px",
                    fontWeight: 900,
                    fontSize: 16,
                    cursor: "pointer",
                  }}
                >
                  New Game
                </button>
              )}
            </>
          )}

          {error ? (
            <div
              style={{
                background: "#3b1219",
                color: "#fecaca",
                borderRadius: 14,
                padding: "12px 14px",
                fontWeight: 700,
              }}
            >
              {error}
            </div>
          ) : null}
        </div>

        <div
          style={{
            order: isMobile ? 1 : 2,
            background: "#1a2c38",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 22,
            padding: isMobile ? 8 : 18,
            overflow: "hidden",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "repeat(5,minmax(0,1fr))" : "repeat(5,minmax(72px,1fr))",
              gap: isMobile ? 6 : 12,
            }}
          >
            {[...Array(25)].map((_, i) => {
              const isRevealed = revealed.includes(i);
              return (
                <button
                  key={i}
                  onClick={() => reveal(i)}
                  disabled={!canPlay || busy || isRevealed}
                  style={{
                    aspectRatio: "1 / 1",
                    minHeight: isMobile ? 44 : 72,
                    borderRadius: 18,
                    border: isRevealed ? "1px solid rgba(16,185,129,0.55)" : "1px solid rgba(255,255,255,0.06)",
                    background: isRevealed
                      ? "linear-gradient(180deg,#1d4d3a 0%,#163a2a 100%)"
                      : "linear-gradient(180deg,#132634 0%,#0f212e 100%)",
                    color: "#fff",
                    fontSize: 24,
                    fontWeight: 900,
                    boxShadow: isRevealed ? "0 0 0 1px rgba(16,185,129,0.14) inset" : "none",
                    cursor: !canPlay || busy || isRevealed ? "default" : "pointer",
                    transition: "transform .12s ease, box-shadow .12s ease, border-color .12s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!(!canPlay || busy || isRevealed)) {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 10px 24px rgba(0,0,0,0.28)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = isRevealed ? "0 0 0 1px rgba(16,185,129,0.14) inset" : "none";
                  }}
                >
                  {isRevealed ? "💎" : "?"}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {!isMobile && <RecentBetsPanel game="Mines" bets={recentBets} />}
    </div>
  );
}
