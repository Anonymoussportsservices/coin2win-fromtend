"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { getStoredUser } from "@/lib/auth";
import { API_ENDPOINTS, apiGet, apiPost, notifyWalletChanged } from "@/lib/gameApi";
import CrashGraph from "@/components/CrashGraph";

type CrashRound = {
  id: number;
  status: "betting" | "running" | "crashed" | string;
  current_multiplier: number;
  seconds_until_start?: number;
  elapsed_seconds?: number;
  crashed?: boolean;
  crash_point?: number | null;
  betting_started_at?: string | null;
  starts_at?: string | null;
  crashed_at?: string | null;
};

type CrashBet = {
  id: number;
  round_id: number;
  amount_usd: number;
  auto_cashout?: number | null;
  status: string;
  cashout_multiplier?: number | null;
  payout: number;
  created_at?: string;
  settled_at?: string | null;
};

type RoundBet = {
  bet_id: number;
  player: string;
  amount: number;
  auto_cashout?: number | null;
  status: string;
  payout: number;
  cashout_multiplier?: number | null;
  is_real?: boolean;
};

type CrashHistoryItem = {
  id: number;
  crash_point?: number | null;
};

function fmtMoney(n: number | undefined | null) {
  return `$${Number(n || 0).toFixed(2)}`;
}

function fmtMultiplier(n: number | undefined | null) {
  return `${Number(n || 1).toFixed(2)}x`;
}

function shortName(value: string | undefined | null) {
  const v = String(value || "Player");
  return v.length > 14 ? `${v.slice(0, 12)}…` : v;
}

function isOpenBet(bet: CrashBet) {
  const status = String(bet.status || "").toLowerCase();
  return ![
    "cashed_out",
    "lost",
    "crashed",
    "completed",
    "settled",
    "won",
    "win",
  ].includes(status);
}

function statusTone(status: string) {
  const s = String(status || "").toLowerCase();
  if (["cashed_out", "won", "win"].includes(s)) {
    return { color: "#86efac", bg: "rgba(0,231,1,0.12)" };
  }
  if (["lost", "crashed"].includes(s)) {
    return { color: "#fca5a5", bg: "rgba(255,93,93,0.12)" };
  }
  return { color: "#9fb0bf", bg: "rgba(255,255,255,0.05)" };
}


function liveBetAccent(bet: {
  amount?: number | null;
  payout?: number | null;
  status?: string | null;
}) {
  const amount = Number(bet.amount || 0);
  const payout = Number(bet.payout || 0);
  const status = String(bet.status || "").toLowerCase();

  const isHighRoller = amount >= 25;
  const isHotCashout = payout >= 50 || ["cashed_out", "won", "win"].includes(status) && payout >= 10;

  return {
    isHighRoller,
    isHotCashout,
  };
}

function recentActionAccent(bet: {
  amount_usd?: number | null;
  payout?: number | null;
  status?: string | null;
}) {
  const amount = Number(bet.amount_usd || 0);
  const payout = Number(bet.payout || 0);
  const status = String(bet.status || "").toLowerCase();

  const isWin = ["cashed_out", "won", "win"].includes(status) || payout > amount;
  const isBigBet = amount >= 25;
  const isBigWin = payout >= 25;

  return {
    isWin,
    isBigBet,
    isBigWin,
  };
}

function multiplierFeel(value: number, crashed: boolean) {
  const v = Math.max(1, Number(value || 1));

  if (crashed) {
    return {
      scale: 1,
      glow: "0 0 22px rgba(255,93,93,0.34)",
      letterSpacing: "-0.04em",
      y: 0,
    };
  }

  if (v >= 10) {
    return {
      scale: 1.18,
      glow: "0 0 52px rgba(0,231,1,0.78)",
      letterSpacing: "-0.08em",
      y: -5,
    };
  }

  if (v >= 5) {
    return {
      scale: 1.12,
      glow: "0 0 40px rgba(0,231,1,0.62)",
      letterSpacing: "-0.065em",
      y: -2,
    };
  }

  if (v >= 2) {
    return {
      scale: 1.08,
      glow: "0 0 30px rgba(0,231,1,0.50)",
      letterSpacing: "-0.05em",
      y: -1,
    };
  }

  return {
    scale: 1,
    glow: "0 0 18px rgba(0,231,1,0.28)",
    letterSpacing: "-0.04em",
    y: 0,
  };
}

export default function CrashGame() {
  const user = getStoredUser();

  const [round, setRound] = useState<CrashRound | null>(null);
  const [displayMultiplier, setDisplayMultiplier] = useState(1);

  const [amount, setAmount] = useState("1.00");
  const [autoCashout, setAutoCashout] = useState("");

  const [myBets, setMyBets] = useState<CrashBet[]>([]);
  const [roundBets, setRoundBets] = useState<RoundBet[]>([]);
  const [recentCrashHistory, setRecentCrashHistory] = useState<CrashHistoryItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [cashingOut, setCashingOut] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [justCashedOut, setJustCashedOut] = useState(false);

  const [dotPulse, setDotPulse] = useState(1);
  const [crashFlash, setCrashFlash] = useState(false);
  const [multiplierBurst, setMultiplierBurst] = useState(1);
  const burstLevelRef = useRef(0);

  const [isMobileLike, setIsMobileLike] = useState(false);

  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const targetMultiplierRef = useRef(1);
  const lastRoundIdRef = useRef<number | null>(null);
  const lastStatusRef = useRef<string | null>(null);

  useEffect(() => {
    function syncViewportMode() {
      setIsMobileLike(window.innerWidth <= 980);
    }

    syncViewportMode();
    window.addEventListener("resize", syncViewportMode);
    return () => window.removeEventListener("resize", syncViewportMode);
  }, []);

  const activeBet = useMemo(() => {
    if (!round) return null;
    return (
      myBets.find((b) => b.round_id === round.id && isOpenBet(b)) ||
      myBets.find((b) => isOpenBet(b)) ||
      null
    );
  }, [myBets, round]);

  async function fetchCurrentRound() {
    const data = await apiGet(API_ENDPOINTS.crashGlobalCurrent);
    return data?.round as CrashRound;
  }

  async function fetchRoundBets(roundId: number) {
    const data = await apiGet(API_ENDPOINTS.crashGlobalRoundBets(roundId));
    return Array.isArray(data?.bets) ? (data.bets as RoundBet[]) : [];
  }

  async function fetchMyBets(userId: string) {
    const data = await apiGet(API_ENDPOINTS.crashGlobalMyBets(userId));
    return Array.isArray(data?.bets) ? (data.bets as CrashBet[]) : [];
  }

  async function fetchCrashHistory() {
    const data = await apiGet(API_ENDPOINTS.crashGlobalHistory);
    return Array.isArray(data?.rounds) ? (data.rounds as CrashHistoryItem[]) : [];
  }

  async function refreshAll() {
    const currentRound = await fetchCurrentRound();
    setRound(currentRound);

    const tasks: Promise<any>[] = [fetchRoundBets(currentRound.id), fetchCrashHistory()];
    if (user?.user_id) tasks.push(fetchMyBets(user.user_id));

    const [betsForRound, historyRows, ownBets] = await Promise.all(tasks);

    setRoundBets(Array.isArray(betsForRound) ? betsForRound : []);
    setRecentCrashHistory(Array.isArray(historyRows) ? historyRows.slice(0, 12) : []);
    if (user?.user_id) {
      setMyBets(Array.isArray(ownBets) ? ownBets : []);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        const currentRound = await fetchCurrentRound();
        if (!mounted) return;

        setRound(currentRound);

        const nextRoundId = Number(currentRound.id);
        const nextStatus = String(currentRound.status || "").toLowerCase();
        const nextTarget = Math.max(
          1,
          Number(
            nextStatus === "crashed"
              ? (currentRound.crash_point ?? currentRound.current_multiplier ?? 1)
              : (currentRound.current_multiplier ?? 1)
          )
        );

        const roundChanged = lastRoundIdRef.current !== nextRoundId;
        const statusChanged = lastStatusRef.current !== nextStatus;

        if (roundChanged || nextStatus === "betting") {
          targetMultiplierRef.current = 1;
          setDisplayMultiplier(1);
        } else if (nextStatus === "crashed") {
          targetMultiplierRef.current = nextTarget;
          setDisplayMultiplier(nextTarget);
        } else {
          targetMultiplierRef.current = nextTarget;
        }

        lastRoundIdRef.current = nextRoundId;
        lastStatusRef.current = nextStatus;

        const [betsForRound, historyRows, ownBets] = await Promise.all([
          fetchRoundBets(currentRound.id),
          fetchCrashHistory(),
          user?.user_id ? fetchMyBets(user.user_id) : Promise.resolve([]),
        ]);

        if (!mounted) return;
        setRoundBets(Array.isArray(betsForRound) ? betsForRound : []);
        setRecentCrashHistory(Array.isArray(historyRows) ? historyRows.slice(0, 12) : []);
        setMyBets(Array.isArray(ownBets) ? ownBets : []);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Request failed");
      }
    }

    run();
    const interval = setInterval(run, 250);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [user?.user_id]);

  useEffect(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

    const animate = () => {
      setDisplayMultiplier((prev) => {
        if (!round) return prev;

        const status = String(round.status || "").toLowerCase();

        if (status === "betting") return 1;

        if (status === "crashed") {
          return Math.max(
            1,
            Number(round.crash_point ?? targetMultiplierRef.current ?? prev)
          );
        }

        const target = Math.max(1, Number(targetMultiplierRef.current || prev || 1));
        const diff = target - prev;

        if (Math.abs(diff) < 0.001) return target;

        // Smooth interpolation only — no fake prediction.
        // Fast enough to feel fluid, slow enough to stay believable.
        const next = prev + diff * 0.72;

        return next;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [round]);

  
  useEffect(() => {
    const interval = setInterval(() => {
      setDotPulse((p) => (p === 1 ? 1.25 : 1));
    }, 420);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const status = String(round?.status || "").toLowerCase();
    if (status !== "crashed") return;

    setCrashFlash(true);

    const flashTimer = setTimeout(() => {
      setCrashFlash(false);
    }, 180);

    return () => {
      clearTimeout(flashTimer);
    };
  }, [round?.id, round?.status]);


  useEffect(() => {
    const status = String(round?.status || "").toLowerCase();
    if (status === "crashed" || status === "betting") {
      burstLevelRef.current = 0;
      setMultiplierBurst(1);
      return;
    }

    const v = Math.max(1, Number(displayMultiplier || 1));
    let level = 0;
    if (v >= 10) level = 3;
    else if (v >= 5) level = 2;
    else if (v >= 2) level = 1;

    if (level > burstLevelRef.current) {
      burstLevelRef.current = level;

      const burstScale = level === 3 ? 1.22 : level === 2 ? 1.16 : 1.11;
      setMultiplierBurst(burstScale);

      const t = setTimeout(() => {
        setMultiplierBurst(1);
      }, 240);

      return () => clearTimeout(t);
    }
  }, [displayMultiplier, round?.status, round?.id]);

  useEffect(() => {
    return () => {
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  async function handlePlaceBet() {
    if (!user?.user_id) {
      setError("Please log in again.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const parsedAmount = Number(amount);
      if (!parsedAmount || parsedAmount <= 0) {
        throw new Error("Enter a valid amount.");
      }

      const payload: Record<string, unknown> = {
        user_id: user.user_id,
        amount_usd: parsedAmount,
      };

      const trimmedAuto = autoCashout.trim();
      if (trimmedAuto !== "") {
        const parsedAuto = Number(trimmedAuto);
        if (Number.isNaN(parsedAuto)) {
          throw new Error("Auto cashout must be a number.");
        }
        if (parsedAuto <= 1.0) {
          throw new Error("Auto cashout must be greater than 1.0.");
        }
        payload.auto_cashout = parsedAuto;
      }

      await apiPost(API_ENDPOINTS.crashGlobalBet, payload);

      notifyWalletChanged();
      setMessage("Bet placed successfully.");
      await refreshAll();
    } catch (e: any) {
      setError(e?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleCashout() {
    if (!activeBet?.id) {
      setError("No active bet to cash out.");
      return;
    }

    try {
      setCashingOut(true);
      setError("");
      setMessage("");

      await apiPost(API_ENDPOINTS.crashGlobalCashout(activeBet.id), {});

      notifyWalletChanged();
      setJustCashedOut(true);
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
      pulseTimerRef.current = setTimeout(() => {
        setJustCashedOut(false);
      }, 800);

      setMessage("💰 Cashed Out Successfully!");
      await refreshAll();
    } catch (e: any) {
      setError(e?.message || "Cashout failed");
    } finally {
      setCashingOut(false);
    }
  }


  const livePlayers = useMemo(() => {
    return [...roundBets]
      .sort((a, b) => (b.bet_id || 0) - (a.bet_id || 0))
      .slice(0, 14);
  }, [roundBets]);

  const recentAction = useMemo(() => {
    return [...myBets].slice(0, 8);
  }, [myBets]);

  const liveStats = useMemo(() => {
    const totalStake = livePlayers.reduce((sum, bet) => sum + Number(bet.amount || 0), 0);
    const totalPlayers = livePlayers.length;
    const cashedOut = livePlayers.filter((bet) =>
      ["cashed_out", "won", "win"].includes(String(bet.status || "").toLowerCase())
    ).length;

    return { totalStake, totalPlayers, cashedOut };
  }, [livePlayers]);

  const multiplierTone = multiplierFeel(
    displayMultiplier,
    String(round?.status || "").toLowerCase() === "crashed"
  );

  if (!round) {
    return <div style={loadingCard}>Loading crash...</div>;
  }

  return (
    <div style={pageWrap}>
      {error ? <div style={errorStyle}>{error}</div> : null}
      {message ? <div style={successStyle}>{message}</div> : null}

      <div
        style={{
          ...topGrid,
          gridTemplateColumns: isMobileLike
            ? "minmax(0, 1fr)"
            : "minmax(0, 1.35fr) minmax(320px, 0.8fr)",
        }}
      >
        <div
          style={{
            ...graphCard,
            boxShadow: crashFlash
              ? "0 0 0 2px rgba(255,93,93,0.18), 0 0 36px rgba(255,93,93,0.28), 0 20px 50px rgba(0,0,0,0.30)"
              : graphCard.boxShadow,
            border: crashFlash
              ? "1px solid rgba(255,93,93,0.32)"
              : graphCard.border,
            background: crashFlash
              ? "radial-gradient(circle at top, rgba(255,93,93,0.18) 0%, rgba(255,93,93,0.08) 18%, rgba(19,32,42,1) 58%, rgba(12,20,28,1) 100%)"
              : graphCard.background,
            transition: "background 0.18s ease, box-shadow 0.18s ease, border 0.18s ease, transform 0.06s ease",
          }}
        >
          <div style={brandBadge}>LIVE CRASH</div>

          <div
            style={{
              ...multiplier,
              fontSize: isMobileLike ? 36 : 56,
              marginTop: isMobileLike ? 2 : 26,
              color: round.status === "crashed" ? "#ff5d5d" : "#00e701",
              textShadow: round.status === "crashed"
                ? "0 0 18px rgba(255,93,93,0.28)"
                : multiplierTone.glow,
              letterSpacing: multiplierTone.letterSpacing,
              transform: `translateY(${multiplierTone.y}px) scale(${multiplierTone.scale * multiplierBurst})`,
            }}
          >
            {displayMultiplier.toFixed(2)}x
          </div>

          {round.status === "betting" && (
            <div style={countdown}>
              Betting closes in {Math.max(0, Math.floor(round.seconds_until_start || 0))}s
            </div>
          )}

          {round.status === "running" && (
            <div style={subState}>Round is live — cash out before it explodes.</div>
          )}

          {round.status === "crashed" && (
            <div style={crashedState}>
              Crashed at {fmtMultiplier(round.crash_point || displayMultiplier)}
            </div>
          )}

          <div style={curveWrap}>
            <CrashGraph
              multiplier={displayMultiplier}
              status={String(round.status || "")}
              isMobileLike={isMobileLike}
              dotPulse={dotPulse}
            />
          </div>

          <div style={crashHistoryStripStyle}>
            {recentCrashHistory.map((item) => {
              const point = Number(item.crash_point || 0);
              const tone =
                point >= 10
                  ? crashHistoryPillHotStyle
                  : point >= 2
                  ? crashHistoryPillWarmStyle
                  : crashHistoryPillColdStyle;

              return (
                <div key={item.id} style={{ ...crashHistoryPillBaseStyle, ...tone }}>
                  {point > 0 ? `${point.toFixed(2)}x` : "—"}
                </div>
              );
            })}
          </div>
        </div>

        <div
          style={{
            ...betCard,
            border: activeBet
              ? "1px solid rgba(0,231,1,0.28)"
              : betCard.border,
            boxShadow: activeBet
              ? "0 0 0 1px rgba(0,231,1,0.08), 0 0 28px rgba(0,231,1,0.12), 0 20px 50px rgba(0,0,0,0.22)"
              : betCard.boxShadow,
            background: activeBet
              ? "linear-gradient(180deg, #1e3328 0%, #172733 100%)"
              : betCard.background,
            transition: "background 0.18s ease, box-shadow 0.18s ease, border 0.18s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: isMobileLike ? "flex-end" : "space-between",
              alignItems: "center",
              gap: 12,
              minHeight: isMobileLike ? 0 : undefined,
            }}
          >
            {!isMobileLike ? <div style={cardHeader}>Bet Panel</div> : null}
            {activeBet ? <div style={activeBetPillStyle}>LIVE BET</div> : null}
          </div>

          <div style={fieldLabel}>Amount (USD)</div>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={input}
            inputMode="decimal"
            placeholder="1.00"
          />

          <div style={fieldLabel}>Auto Cashout</div>
          <input
            value={autoCashout}
            onChange={(e) => setAutoCashout(e.target.value)}
            style={input}
            inputMode="decimal"
            placeholder="Optional — leave blank for manual cashout"
          />

          <div style={quickRow}>
            {["1.00", "2.00", "5.00"].map((v) => (
              <button key={v} style={miniBtn} onClick={() => setAmount(v)}>
                {fmtMoney(Number(v))}
              </button>
            ))}
          </div>

          {!activeBet ? (
            <button
              style={{
                ...primaryBtn,
                marginTop: isMobileLike ? -4 : undefined,
                transform: isMobileLike ? "translateY(-14px)" : undefined,
                opacity: loading || round.status !== "betting" ? 0.65 : 1,
                cursor: loading || round.status !== "betting" ? "not-allowed" : "pointer",
              }}
              disabled={loading || round.status !== "betting"}
              onClick={handlePlaceBet}
            >
              {loading ? "Placing bet..." : "Place Bet"}
            </button>
          ) : (
            <button
              style={{
                ...cashoutBtn,
                marginTop: isMobileLike ? -4 : undefined,
                background: justCashedOut ? "#00e701" : "#ff4d4f",
                color: justCashedOut ? "#071824" : "#fff",
                transform: `${isMobileLike ? "translateY(-14px) " : ""}${justCashedOut ? "scale(1.08)" : "scale(1)"}`,
                boxShadow: justCashedOut
                  ? "0 0 0 2px rgba(0,231,1,0.25), 0 0 32px rgba(0,231,1,0.35)"
                  : cashoutBtn.boxShadow,
                transition: "all 0.18s ease",
              }}
              disabled={cashingOut || String(round.status).toLowerCase() !== "running"}
              onClick={handleCashout}
            >
              {cashingOut ? "Cashing out..." : justCashedOut ? "CASHED OUT" : "Cash Out"}
            </button>
          )}

          <div
            style={{
              ...betMeta,
              background: activeBet ? "rgba(0,231,1,0.07)" : betMeta.background,
              border: activeBet
                ? "1px solid rgba(0,231,1,0.14)"
                : betMeta.border,
              boxShadow: activeBet
                ? "inset 0 1px 0 rgba(255,255,255,0.03)"
                : undefined,
              transition: "background 0.18s ease, border 0.18s ease, box-shadow 0.18s ease",
            }}
          >
            <div style={metaRow}>
              <span style={metaLabel}>Current round</span>
              <strong style={metaValue}>#{round.id}</strong>
            </div>
            <div style={metaRow}>
              <span style={metaLabel}>Status</span>
              <strong style={metaValue}>{round.status}</strong>
            </div>
            {activeBet ? (
              <>
                <div style={metaRow}>
                  <span style={metaLabel}>Your stake</span>
                  <strong
                    style={{
                      ...metaValue,
                      color: "#b7f7c2",
                      textShadow: "0 0 10px rgba(0,231,1,0.16)",
                    }}
                  >
                    {fmtMoney(activeBet.amount_usd)}
                  </strong>
                </div>
                <div style={metaRow}>
                  <span style={metaLabel}>Auto cashout</span>
                  <strong
                    style={{
                      ...metaValue,
                      color: "#ffffff",
                    }}
                  >
                    {activeBet.auto_cashout ? fmtMultiplier(activeBet.auto_cashout) : "Manual"}
                  </strong>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div
        style={{
          ...bottomGrid,
          gridTemplateColumns: isMobileLike ? "1fr" : "1fr 1fr",
        }}
      >
        <div style={historyCard}>
          <div style={liveHeader}>
            <div>
              <div style={cardHeader}>Live Bets</div>
              <div style={liveSubHeader}>
                {liveStats.totalPlayers} players • {fmtMoney(liveStats.totalStake)} staked
              </div>
            </div>
            <div style={pillLive}>LIVE</div>
          </div>

          <div style={liveStatsRow}>
            <div style={statBox}>
              <div style={statLabel}>Players</div>
              <div style={statValue}>{liveStats.totalPlayers}</div>
            </div>
            <div style={statBox}>
              <div style={statLabel}>Staked</div>
              <div style={statValue}>{fmtMoney(liveStats.totalStake)}</div>
            </div>
            <div style={statBox}>
              <div style={statLabel}>Cashed out</div>
              <div style={statValue}>{liveStats.cashedOut}</div>
            </div>
          </div>

          <div style={tableWrap}>
            {livePlayers.length ? (
              livePlayers.map((bet) => {
                const tone = statusTone(bet.status);
                const accent = liveBetAccent({
                  amount: bet.amount,
                  payout: bet.payout,
                  status: bet.status,
                });

                return (
                  <div
                    key={bet.bet_id}
                    style={{
                      ...tableRow,
                      gridTemplateColumns: isMobileLike ? "1fr" : tableRow.gridTemplateColumns,
                      gap: isMobileLike ? 8 : tableRow.gap,
                      padding: isMobileLike ? "10px 12px" : tableRow.padding,
                      border: accent.isHotCashout
                        ? "1px solid rgba(0,231,1,0.18)"
                        : accent.isHighRoller
                        ? "1px solid rgba(245,158,11,0.20)"
                        : tableRow.border,
                      boxShadow: accent.isHotCashout
                        ? "0 0 24px rgba(0,231,1,0.10)"
                        : accent.isHighRoller
                        ? "0 0 24px rgba(245,158,11,0.08)"
                        : undefined,
                      background: accent.isHotCashout
                        ? "linear-gradient(180deg, rgba(0,231,1,0.06) 0%, rgba(255,255,255,0.04) 100%)"
                        : accent.isHighRoller
                        ? "linear-gradient(180deg, rgba(245,158,11,0.06) 0%, rgba(255,255,255,0.04) 100%)"
                        : tableRow.background,
                    }}
                  >
                    <div
                      style={{
                        ...leftCell,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-start",
                        alignItems: "flex-start",
                        gap: 4,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                          flexWrap: "wrap",
                          width: "100%",
                        }}
                      >
                        <div style={rowTitle}>{shortName(bet.player)}</div>
                        {accent.isHighRoller ? (
                          <span
                            style={{
                              ...highRollerBadgeStyle,
                              fontSize: isMobileLike ? 9 : highRollerBadgeStyle.fontSize,
                              padding: isMobileLike ? "3px 7px" : highRollerBadgeStyle.padding,
                            }}
                          >
                            HIGH ROLLER
                          </span>
                        ) : null}
                      </div>
                      <div style={rowSub}>{fmtMoney(bet.amount)}</div>
                    </div>

                    <div
                      style={{
                        ...centerCell,
                        textAlign: isMobileLike ? "left" : centerCell.textAlign,
                        display: "flex",
                        flexDirection: isMobileLike ? "row" : "column",
                        justifyContent: "space-between",
                        alignItems: isMobileLike ? "center" : "flex-end",
                        gap: isMobileLike ? 8 : 0,
                      }}
                    >
                      <div style={rowTitle}>
                        {bet.cashout_multiplier
                          ? fmtMultiplier(bet.cashout_multiplier)
                          : bet.auto_cashout
                          ? fmtMultiplier(bet.auto_cashout)
                          : "Manual"}
                      </div>
                      <div
                        style={{
                          ...statusChip,
                          color: tone.color,
                          background: tone.bg,
                          fontSize: isMobileLike ? 10 : statusChip.fontSize,
                        }}
                      >
                        {bet.status}
                      </div>
                    </div>

                    <div
                      style={{
                        ...rightCell,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: isMobileLike ? "flex-start" : "flex-end",
                        gap: 3,
                      }}
                    >
                      <div
                        style={{
                          ...rowTitle,
                          color: Number(bet.payout || 0) > Number(bet.amount || 0) ? "#86efac" : "#fff",
                          textShadow:
                            Number(bet.payout || 0) > Number(bet.amount || 0)
                              ? "0 0 12px rgba(0,231,1,0.18)"
                              : "none",
                        }}
                      >
                        {fmtMoney(bet.payout || bet.amount)}
                      </div>
                      <div
                        style={{
                          ...rowSub,
                          display: "flex",
                          justifyContent: isMobileLike ? "flex-start" : "flex-end",
                          gap: 4,
                          flexWrap: "wrap",
                        }}
                      >
                        <span>bet #{bet.bet_id}</span>
                        {accent.isHotCashout ? (
                          <span
                            style={{
                              ...hotCashoutBadgeStyle,
                              fontSize: isMobileLike ? 9 : hotCashoutBadgeStyle.fontSize,
                              padding: isMobileLike ? "2px 6px" : hotCashoutBadgeStyle.padding,
                            }}
                          >
                            HOT CASHOUT
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={emptyRow}>No live bets yet.</div>
            )}
          </div>
        </div>

        <div style={historyCard}>
          <div style={cardHeader}>Your Recent Action</div>
          <div style={tableWrap}>
            {recentAction.length ? (
              recentAction.map((bet) => {
                const accent = recentActionAccent(bet);

                return (
                  <div
                    key={bet.id}
                    style={{
                      ...tableRow,
                      gridTemplateColumns: isMobileLike ? "1fr" : tableRow.gridTemplateColumns,
                      gap: isMobileLike ? 8 : tableRow.gap,
                      padding: isMobileLike ? "10px 12px" : tableRow.padding,
                      border: accent.isBigWin
                        ? "1px solid rgba(0,231,1,0.18)"
                        : accent.isBigBet
                        ? "1px solid rgba(245,158,11,0.20)"
                        : tableRow.border,
                      boxShadow: accent.isBigWin
                        ? "0 0 24px rgba(0,231,1,0.10)"
                        : accent.isBigBet
                        ? "0 0 24px rgba(245,158,11,0.08)"
                        : undefined,
                      background: accent.isBigWin
                        ? "linear-gradient(180deg, rgba(0,231,1,0.06) 0%, rgba(255,255,255,0.04) 100%)"
                        : accent.isBigBet
                        ? "linear-gradient(180deg, rgba(245,158,11,0.06) 0%, rgba(255,255,255,0.04) 100%)"
                        : tableRow.background,
                    }}
                  >
                    <div
                      style={{
                        ...leftCell,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: 4,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                          flexWrap: "wrap",
                          width: "100%",
                        }}
                      >
                        <div style={rowTitle}>Round #{bet.round_id}</div>
                        {accent.isBigBet ? (
                          <span
                            style={{
                              ...highRollerBadgeStyle,
                              fontSize: isMobileLike ? 9 : highRollerBadgeStyle.fontSize,
                              padding: isMobileLike ? "3px 7px" : highRollerBadgeStyle.padding,
                            }}
                          >
                            BIG BET
                          </span>
                        ) : null}
                      </div>
                      <div style={rowSub}>{fmtMoney(bet.amount_usd)}</div>
                    </div>

                    <div
                      style={{
                        ...rightCell,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: isMobileLike ? "flex-start" : "flex-end",
                        gap: 3,
                      }}
                    >
                      <div
                        style={{
                          ...rowTitle,
                          color: accent.isWin ? "#86efac" : "#fff",
                          textShadow: accent.isWin ? "0 0 12px rgba(0,231,1,0.18)" : "none",
                          fontWeight: accent.isWin ? 900 : 800,
                        }}
                      >
                        {fmtMoney(bet.payout)}
                      </div>
                      <div
                        style={{
                          ...rowSub,
                          display: "flex",
                          justifyContent: isMobileLike ? "flex-start" : "flex-end",
                          gap: 4,
                          flexWrap: "wrap",
                        }}
                      >
                        <span>{bet.status}</span>
                        {accent.isWin ? (
                          <span
                            style={{
                              ...hotCashoutBadgeStyle,
                              fontSize: isMobileLike ? 9 : hotCashoutBadgeStyle.fontSize,
                              padding: isMobileLike ? "2px 6px" : hotCashoutBadgeStyle.padding,
                            }}
                          >
                            WIN
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={emptyRow}>No crash bets yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const pageWrap: CSSProperties = {
  display: "grid",
  gap: 12,
  width: "100%",
  maxWidth: "100%",
  margin: "0 auto",
  padding: 0,
  boxSizing: "border-box",
  overflowX: "hidden",
};

const topGrid: CSSProperties = {
  display: "grid",
  gap: 12,
  width: "100%",
  minWidth: 0,
  alignItems: "stretch",
};

const bottomGrid: CSSProperties = {
  display: "grid",
  gap: 12,
  width: "100%",
  minWidth: 0,
  alignItems: "stretch",
};

const graphCard: CSSProperties = {
  position: "relative",
  width: "100%",
  minWidth: 0,
  background: "radial-gradient(circle at top, rgba(0,231,1,0.10) 0%, rgba(0,231,1,0.03) 20%, rgba(19,32,42,1) 58%, rgba(12,20,28,1) 100%)",
  borderRadius: 22,
  padding: 16,
  textAlign: "center",
  border: "1px solid rgba(255,255,255,0.07)",
  minHeight: 260,
  overflow: "hidden",
  boxSizing: "border-box",
  boxShadow: "0 20px 50px rgba(0,0,0,0.30)",
};

const brandBadge: CSSProperties = {
  position: "absolute",
  top: 14,
  right: 14,
  background: "rgba(0,231,1,0.14)",
  color: "#86efac",
  border: "1px solid rgba(0,231,1,0.22)",
  borderRadius: 999,
  padding: "7px 12px",
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: "0.08em",
  boxShadow: "0 8px 24px rgba(0,231,1,0.10)",
};

const multiplier: CSSProperties = {
  fontWeight: 900,
  lineHeight: 1,
  letterSpacing: "-0.04em",
  transformOrigin: "center center",
  willChange: "transform, text-shadow, color",
  transition: "color 160ms ease, text-shadow 160ms ease, transform 180ms ease, letter-spacing 180ms ease",
};

const countdown: CSSProperties = {
  marginTop: 12,
  color: "#d6e4ef",
  fontSize: 12,
  fontWeight: 800,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 999,
  padding: "8px 12px",
  display: "inline-flex",
};

const subState: CSSProperties = {
  marginTop: 12,
  color: "#d6e4ef",
  fontSize: 12,
  fontWeight: 700,
  background: "rgba(0,231,1,0.08)",
  border: "1px solid rgba(0,231,1,0.14)",
  borderRadius: 999,
  padding: "8px 12px",
  display: "inline-flex",
};

const crashedState: CSSProperties = {
  marginTop: 12,
  color: "#ffd3d3",
  fontSize: 12,
  fontWeight: 900,
  background: "rgba(255,93,93,0.10)",
  border: "1px solid rgba(255,93,93,0.16)",
  borderRadius: 999,
  padding: "8px 12px",
  display: "inline-flex",
};

const curveWrap: CSSProperties = {
  width: "100%",
  minWidth: 0,
  marginTop: 2,
  overflow: "hidden",
};

const crashHistoryStripStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  marginTop: 2,
  overflowX: "auto",
  paddingBottom: 2,
};

const crashHistoryPillBaseStyle: CSSProperties = {
  borderRadius: 999,
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: "0.02em",
  whiteSpace: "nowrap",
  border: "1px solid transparent",
  flex: "0 0 auto",
};

const crashHistoryPillColdStyle: CSSProperties = {
  background: "rgba(255,93,93,0.10)",
  color: "#fca5a5",
  border: "1px solid rgba(255,93,93,0.18)",
};

const crashHistoryPillWarmStyle: CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  color: "#e2e8f0",
  border: "1px solid rgba(255,255,255,0.08)",
};

const crashHistoryPillHotStyle: CSSProperties = {
  background: "rgba(245,158,11,0.14)",
  color: "#fcd34d",
  border: "1px solid rgba(245,158,11,0.22)",
  boxShadow: "0 0 18px rgba(245,158,11,0.08)",
};

const svgStyle: CSSProperties = {
  width: "100%",
  maxWidth: "100%",
  display: "block",
};

const betCard: CSSProperties = {
  width: "100%",
  minWidth: 0,
  background: "linear-gradient(180deg, #1c2f3c 0%, #172733 100%)",
  borderRadius: 22,
  padding: 16,
  border: "1px solid rgba(255,255,255,0.06)",
  display: "grid",
  gap: 12,
  alignContent: "start",
  boxSizing: "border-box",
  overflow: "hidden",
  boxShadow: "0 20px 50px rgba(0,0,0,0.22)",
};

const historyCard: CSSProperties = {
  width: "100%",
  minWidth: 0,
  background: "linear-gradient(180deg, #1b2d39 0%, #16252f 100%)",
  borderRadius: 22,
  padding: 16,
  border: "1px solid rgba(255,255,255,0.06)",
  boxSizing: "border-box",
  overflow: "hidden",
  boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
};

const cardHeader: CSSProperties = {
  color: "#fff",
  fontSize: 18,
  fontWeight: 900,
  letterSpacing: "-0.02em",
  marginBottom: 4,
};

const liveHeader: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "flex-start",
  marginBottom: 10,
};

const liveSubHeader: CSSProperties = {
  color: "#9fb0bf",
  fontSize: 12,
};

const pillLive: CSSProperties = {
  background: "rgba(0,231,1,0.14)",
  color: "#86efac",
  border: "1px solid rgba(0,231,1,0.22)",
  borderRadius: 999,
  padding: "7px 12px",
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: "0.08em",
  boxShadow: "0 8px 24px rgba(0,231,1,0.10)",
};

const activeBetPillStyle: CSSProperties = {
  background: "rgba(0,231,1,0.16)",
  color: "#b7f7c2",
  border: "1px solid rgba(0,231,1,0.24)",
  borderRadius: 999,
  padding: "7px 12px",
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: "0.08em",
  boxShadow: "0 10px 24px rgba(0,231,1,0.14)",
  whiteSpace: "nowrap",
};

const highRollerBadgeStyle: CSSProperties = {
  background: "rgba(245,158,11,0.14)",
  color: "#fcd34d",
  border: "1px solid rgba(245,158,11,0.24)",
  borderRadius: 999,
  padding: "4px 8px",
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: "0.08em",
  whiteSpace: "nowrap",
};

const hotCashoutBadgeStyle: CSSProperties = {
  background: "rgba(0,231,1,0.14)",
  color: "#86efac",
  border: "1px solid rgba(0,231,1,0.22)",
  borderRadius: 999,
  padding: "3px 7px",
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: "0.08em",
  whiteSpace: "nowrap",
};

const liveStatsRow: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 8,
  marginBottom: 12,
};

const statBox: CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  borderRadius: 14,
  padding: "11px 12px",
  border: "1px solid rgba(255,255,255,0.05)",
};

const statLabel: CSSProperties = {
  color: "#9fb0bf",
  fontSize: 11,
  marginBottom: 4,
};

const statValue: CSSProperties = {
  color: "#fff",
  fontSize: 12,
  fontWeight: 800,
};

const fieldLabel: CSSProperties = {
  color: "#9fb0bf",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const input: CSSProperties = {
  background: "#13202a",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 14,
  padding: "12px 13px",
  color: "#fff",
  fontSize: 12,
  width: "100%",
  boxSizing: "border-box",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
};

const quickRow: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 8,
};

const miniBtn: CSSProperties = {
  border: "1px solid rgba(255,255,255,0.08)",
  background: "#213743",
  color: "#fff",
  borderRadius: 12,
  padding: "10px 10px",
  fontWeight: 800,
  cursor: "pointer",
};

const primaryBtn: CSSProperties = {
  background: "linear-gradient(180deg, #2bff2b 0%, #00e701 100%)",
  color: "#071824",
  border: "none",
  borderRadius: 14,
  padding: "13px 14px",
  fontWeight: 900,
  fontSize: 15,
  boxShadow: "0 16px 30px rgba(0,231,1,0.18)",
};

const cashoutBtn: CSSProperties = {
  background: "linear-gradient(180deg, #ff696b 0%, #ff4d4f 100%)",
  color: "#fff",
  border: "none",
  borderRadius: 14,
  padding: "13px 14px",
  fontWeight: 900,
  fontSize: 15,
  transition: "all 0.2s ease",
  cursor: "pointer",
  boxShadow: "0 16px 30px rgba(255,77,79,0.16)",
};

const betMeta: CSSProperties = {
  marginTop: 2,
  display: "grid",
  gap: 7,
  background: "rgba(255,255,255,0.04)",
  borderRadius: 16,
  padding: 12,
  border: "1px solid rgba(255,255,255,0.05)",
};

const metaRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 8,
};

const metaLabel: CSSProperties = {
  color: "#9fb0bf",
  fontSize: 12,
};

const metaValue: CSSProperties = {
  color: "#fff",
  fontSize: 12,
  fontWeight: 800,
};

const tableWrap: CSSProperties = {
  display: "grid",
  gap: 10,
  marginTop: 8,
};

const tableRow: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto auto",
  gap: 12,
  alignItems: "center",
  background: "rgba(255,255,255,0.04)",
  borderRadius: 14,
  padding: "13px 14px",
  border: "1px solid rgba(255,255,255,0.05)",
};

const leftCell: CSSProperties = {
  minWidth: 0,
};

const centerCell: CSSProperties = {
  textAlign: "right",
  minWidth: 0,
};

const rightCell: CSSProperties = {
  textAlign: "right",
  minWidth: 0,
};

const rowTitle: CSSProperties = {
  color: "#fff",
  fontWeight: 800,
  fontSize: 12,
  letterSpacing: "-0.01em",
};

const rowSub: CSSProperties = {
  color: "#9fb0bf",
  fontSize: 12,
  marginTop: 3,
};

const statusChip: CSSProperties = {
  marginTop: 5,
  borderRadius: 999,
  padding: "5px 9px",
  fontSize: 11,
  fontWeight: 900,
  display: "inline-block",
};

const emptyRow: CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  borderRadius: 14,
  padding: "14px 16px",
  color: "#9fb0bf",
  fontSize: 12,
  border: "1px solid rgba(255,255,255,0.05)",
};

const errorStyle: CSSProperties = {
  background: "rgba(239,68,68,0.12)",
  color: "#fecaca",
  border: "1px solid rgba(239,68,68,0.22)",
  borderRadius: 12,
  padding: "10px 12px",
  fontWeight: 700,
};

const successStyle: CSSProperties = {
  background: "rgba(0,231,1,0.12)",
  color: "#b7f7c2",
  border: "1px solid rgba(0,231,1,0.22)",
  borderRadius: 12,
  padding: "10px 12px",
  fontWeight: 700,
};

const loadingCard: CSSProperties = {
  width: "100%",
  background: "#1a2c38",
  border: "1px solid rgba(255,255,255,0.05)",
  borderRadius: 18,
  padding: 20,
  color: "#fff",
};
