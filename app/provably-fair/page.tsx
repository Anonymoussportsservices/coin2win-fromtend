"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import PlayerShell from "@/components/PlayerShell";
import { getStoredUser } from "@/lib/auth";
import { API_ENDPOINTS, apiGet, apiPost } from "@/lib/gameApi";

type DiceBet = {
  id: number;
  amount_usd: number;
  condition: string;
  target: number;
  roll: number;
  win: boolean;
  payout: number;
  created_at?: string;
  nonce?: number | null;
  client_seed?: string | null;
  server_seed_hash?: string | null;
};

type DiceSeedState = {
  user_id?: string;
  current_server_seed_hash?: string;
  current_client_seed?: string;
  current_nonce?: number;
  revealed_prev_server_seed?: string | null;
  revealed_prev_server_seed_hash?: string | null;
};

type VerifyResult = {
  roll?: number;
  server_seed_hash?: string;
  client_seed?: string;
  nonce?: number;
  outcome?: "win" | "loss" | null;
  condition?: string;
  target?: number | null;
};


type CrashSeedState = {
  user_id?: string;
  server_seed_hash?: string;
  client_seed?: string;
  nonce_next?: number;
  revealed_prev_server_seed?: string | null;
  revealed_prev_server_seed_hash?: string | null;
};

type CrashRound = {
  id: number;
  round_id?: number | null;
  amount_usd?: number | null;
  auto_cashout?: number | null;
  payout?: number | null;
  status?: string | null;
  created_at?: string | null;
  settled_at?: string | null;

  server_seed_hash?: string | null;
  client_seed?: string | null;
  nonce?: number | null;
  crash_point?: number | null;
  round_status?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
};

type CrashVerifyResult = {
  crash_point?: number;
  server_seed_hash?: string;
  client_seed?: string;
  nonce?: number;
  outcome?: "win" | "loss" | "manual" | null;
  auto_cashout?: number | null;
};

function fmtMoney(value: number | undefined | null) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function fmtTime(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortHash(value?: string | null, left: number = 14, right: number = 10) {
  const v = String(value || "").trim();
  if (!v) return "—";
  if (v.length <= left + right + 3) return v;
  return `${v.slice(0, left)}...${v.slice(-right)}`;
}

function outcomeTone(win: boolean): CSSProperties {
  return win
    ? {
        background: "rgba(16,185,129,0.14)",
        color: "#86efac",
        border: "1px solid rgba(16,185,129,0.22)",
      }
    : {
        background: "rgba(239,68,68,0.14)",
        color: "#fca5a5",
        border: "1px solid rgba(239,68,68,0.22)",
      };
}


function verificationStatusStyle(ready: boolean): CSSProperties {
  return ready
    ? {
        background: "rgba(16,185,129,0.14)",
        color: "#86efac",
        border: "1px solid rgba(16,185,129,0.22)",
      }
    : {
        background: "rgba(245,158,11,0.14)",
        color: "#fcd34d",
        border: "1px solid rgba(245,158,11,0.22)",
      };
}


function getBetVerificationState(
  betHash?: string | null,
  currentHash?: string | null,
  revealedPrevHash?: string | null
): "ready" | "awaiting" | "unavailable" {
  const b = String(betHash || "").trim();
  const c = String(currentHash || "").trim();
  const p = String(revealedPrevHash || "").trim();

  if (b && p && b === p) return "ready";
  if (b && c && b === c) return "awaiting";
  return "unavailable";
}

function verificationBadgeStyle(state: "ready" | "awaiting" | "unavailable"): CSSProperties {
  if (state === "ready") {
    return {
      background: "rgba(16,185,129,0.14)",
      color: "#86efac",
      border: "1px solid rgba(16,185,129,0.22)",
    };
  }
  if (state === "awaiting") {
    return {
      background: "rgba(245,158,11,0.14)",
      color: "#fcd34d",
      border: "1px solid rgba(245,158,11,0.22)",
    };
  }
  return {
    background: "rgba(148,163,184,0.12)",
    color: "#cbd5e1",
    border: "1px solid rgba(148,163,184,0.20)",
  };
}

function verificationLabel(state: "ready" | "awaiting" | "unavailable") {
  if (state === "ready") return "Ready to Verify";
  if (state === "awaiting") return "Awaiting Seed Reveal";
  return "Past Seed Not Available";
}

function verificationButtonLabel(state: "ready" | "awaiting" | "unavailable") {
  if (state === "ready") return "Load Into Verifier";
  if (state === "awaiting") return "Waiting for Reveal";
  return "Unavailable";
}

export default function ProvablyFairPage() {
  const user = getStoredUser();
  const userId = user?.user_id ?? "";

  const [seedState, setSeedState] = useState<DiceSeedState | null>(null);
  const [diceBets, setDiceBets] = useState<DiceBet[]>([]);
  const [crashSeedState, setCrashSeedState] = useState<CrashSeedState | null>(null);
  const [crashRounds, setCrashRounds] = useState<CrashRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [clientSeedInput, setClientSeedInput] = useState("");
  const [seedActionMessage, setSeedActionMessage] = useState("");
  const [seedActionLoading, setSeedActionLoading] = useState(false);

  const [verifyServerSeed, setVerifyServerSeed] = useState("");
  const [verifyClientSeed, setVerifyClientSeed] = useState("");
  const [verifyNonce, setVerifyNonce] = useState("");
  const [verifyCondition, setVerifyCondition] = useState<"under" | "over">("under");
  const [verifyTarget, setVerifyTarget] = useState("");
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [verifyError, setVerifyError] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);

  const [crashVerifyServerSeed, setCrashVerifyServerSeed] = useState("");
  const [crashVerifyClientSeed, setCrashVerifyClientSeed] = useState("");
  const [crashVerifyNonce, setCrashVerifyNonce] = useState("");
  const [crashVerifyAutoCashout, setCrashVerifyAutoCashout] = useState("");
  const [crashVerifyResult, setCrashVerifyResult] = useState<CrashVerifyResult | null>(null);
  const [crashVerifyError, setCrashVerifyError] = useState("");
  const [crashVerifyLoading, setCrashVerifyLoading] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const [infoModal, setInfoModal] = useState<null | "hash" | "client" | "nonce" | "verification">(null);

  useEffect(() => {
    let active = true;

    async function load(isInitial: boolean = false) {
      if (!userId) return;

      try {
        if (isInitial) {
          setLoading(true);
        }
        setPageError("");

        const [seedData, betsData, crashSeedData, crashMyBetsData] = await Promise.all([
          apiGet(API_ENDPOINTS.diceFair(userId)).catch(() => null),
          apiGet(API_ENDPOINTS.diceBets(userId)).catch(() => ({ bets: [] })),
          apiGet(API_ENDPOINTS.crashGlobalFair).catch(() => null),
          apiGet(API_ENDPOINTS.crashGlobalMyBets(userId)).catch(() => ({ bets: [] })),
        ]);

        if (!active) return;

        setSeedState(seedData || null);
        setClientSeedInput((prev) => prev || String(seedData?.current_client_seed || ""));
        setVerifyClientSeed((prev) => prev || String(seedData?.current_client_seed || ""));
        setDiceBets(Array.isArray(betsData?.bets) ? betsData.bets : []);

        setCrashSeedState(crashSeedData || null);
        setCrashVerifyClientSeed((prev) => prev || String(crashSeedData?.client_seed || ""));
        setCrashRounds(Array.isArray(crashMyBetsData?.bets) ? crashMyBetsData.bets : []);
      } catch (err) {
        if (!active) return;
        setPageError(err instanceof Error ? err.message : "Failed to load provably fair data");
      } finally {
        if (active && isInitial) {
          setLoading(false);
        }
      }
    }

    load(true);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        load(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      active = false;
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [userId]);

  const recentDiceBets = useMemo(() => {
    return [...diceBets]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 12);
  }, [diceBets]);


  const recentCrashRounds = useMemo(() => {
    return [...crashRounds]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 12);
  }, [crashRounds]);

  async function refreshSeedState() {
    if (!userId) return;
    const data = await apiGet(API_ENDPOINTS.diceFair(userId));
    setSeedState(data || null);
    return data;
  }

  async function copyText(value?: string | number | null, label: string = "Copied") {
    const text = String(value ?? "").trim();
    if (!text || text === "—") return;
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage(`${label} copied`);
      window.setTimeout(() => setCopyMessage(""), 1600);
    } catch {
      setCopyMessage("Copy failed");
      window.setTimeout(() => setCopyMessage(""), 1600);
    }
  }

  async function handleUpdateClientSeed() {
    if (!userId) return;
    try {
      setSeedActionLoading(true);
      setSeedActionMessage("");
      const data = await apiPost(API_ENDPOINTS.diceSetClientSeed(userId), {
        client_seed: clientSeedInput.trim(),
      });
      setSeedActionMessage(`Client seed updated to: ${String(data?.client_seed || "")}`);
      await refreshSeedState();
      setVerifyClientSeed(clientSeedInput.trim());
    } catch (err) {
      setSeedActionMessage(err instanceof Error ? err.message : "Failed to update client seed");
    } finally {
      setSeedActionLoading(false);
    }
  }

  async function handleRotateSeed() {
    if (!userId) return;
    try {
      setSeedActionLoading(true);
      setSeedActionMessage("");
      const data = await apiPost(API_ENDPOINTS.diceRotateSeed(userId), {});
      setSeedActionMessage(
        `Server seed rotated. New hash: ${String(data?.new_server_seed_hash || "-")}`
      );
      const fresh = await refreshSeedState();
      setVerifyClientSeed(String(fresh?.current_client_seed || ""));
    } catch (err) {
      setSeedActionMessage(err instanceof Error ? err.message : "Failed to rotate server seed");
    } finally {
      setSeedActionLoading(false);
    }
  }

  async function handleVerifyRoll() {
    try {
      setVerifyLoading(true);
      setVerifyError("");
      setVerifyResult(null);

      const data = await apiPost(API_ENDPOINTS.diceVerify, {
        server_seed: verifyServerSeed.trim(),
        client_seed: verifyClientSeed.trim(),
        nonce: Number(verifyNonce),
      });

      const roll = Number(data?.roll);
      const target = Number(verifyTarget);
      let outcome: "win" | "loss" | null = null;

      if (!Number.isNaN(roll) && !Number.isNaN(target) && target > 0 && target < 100) {
        outcome =
          verifyCondition === "under"
            ? (roll < target ? "win" : "loss")
            : (roll > target ? "win" : "loss");
      }

      setVerifyResult({
        ...(data || null),
        outcome,
        condition: verifyCondition,
        target: !Number.isNaN(target) ? target : null,
      });
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setVerifyLoading(false);
    }
  }

  function loadBetIntoVerifier(bet: DiceBet) {
    setVerifyClientSeed(String(bet.client_seed || ""));
    setVerifyNonce(String(bet.nonce ?? ""));
    setVerifyCondition(bet.condition === "over" ? "over" : "under");
    setVerifyTarget(String(bet.target ?? ""));
    setVerifyResult(null);
    setVerifyError("");
  }


  async function handleCrashVerify() {
    try {
      setCrashVerifyLoading(true);
      setCrashVerifyError("");
      setCrashVerifyResult(null);

      const data = await apiPost(API_ENDPOINTS.crashVerify, {
        server_seed: crashVerifyServerSeed.trim(),
        client_seed: crashVerifyClientSeed.trim(),
        nonce: Number(crashVerifyNonce),
      });

      const crashPoint = Number(data?.crash_point);
      const autoCashout = Number(crashVerifyAutoCashout);
      let outcome: "win" | "loss" | "manual" | null = null;

      if (!Number.isNaN(autoCashout) && autoCashout > 1 && !Number.isNaN(crashPoint)) {
        outcome = crashPoint >= autoCashout ? "win" : "loss";
      } else {
        outcome = "manual";
      }

      setCrashVerifyResult({
        ...(data || null),
        outcome,
        auto_cashout: !Number.isNaN(autoCashout) && autoCashout > 1 ? autoCashout : null,
      });
    } catch (err) {
      setCrashVerifyError(err instanceof Error ? err.message : "Crash verification failed");
    } finally {
      setCrashVerifyLoading(false);
    }
  }

  function loadCrashRoundIntoVerifier(round: CrashRound) {
    setCrashVerifyClientSeed(String(round.client_seed || ""));
    setCrashVerifyNonce(String(round.nonce ?? ""));
    setCrashVerifyAutoCashout(
      round.auto_cashout != null ? String(round.auto_cashout) : ""
    );
    setCrashVerifyResult(null);
    setCrashVerifyError("");
  }

  return (
    <PlayerShell
      title="Provably Fair"
      subtitle="Verify Dice outcomes with server seed hash, client seed, and nonce."
    >
      <div style={wrapStyle}>
        <section style={heroStyle}>
          <div style={heroEyebrowStyle}>Trust & Transparency</div>
          <h1 style={heroTitleStyle}>Provably Fair Dice</h1>
          <p style={heroTextStyle}>
            Verify Dice outcomes with transparent seed sessions and deterministic rolls.
          </p>

          <div style={heroButtonRowStyle}>
            <Link href="/bets" style={ghostLinkStyle}>
              View My Bets
            </Link>
            <Link href="/cashier" style={ghostLinkStyle}>
              Back to Cashier
            </Link>
          </div>
        </section>

        <section style={noticeStyle}>
          <div style={noticeTitleStyle}>Important</div>
          <div style={noticeTextStyle}>
            To verify a roll, you need the <strong>revealed server seed</strong>, not just the
            server seed hash. The hash is the commitment shown before play, while the revealed
            seed is what lets anyone independently recompute the exact Dice result.
          </div>
          <div style={{ ...noticeTextStyle, marginTop: 10 }}>
            Each Dice bet is generated from three inputs:
            <strong> server seed + client seed + nonce</strong>. Once a seed session is revealed,
            the result can be independently checked and matched against the original bet.
          </div>
          <div style={{ ...noticeTextStyle, marginTop: 10 }}>
            Bets placed under the <strong>current active server seed</strong> may show
            <strong> Awaiting Seed Reveal</strong>. They become fully verifiable after the next
            server seed rotation reveals that prior seed.
          </div>
        </section>

        {copyMessage ? <div style={copyToastStyle}>{copyMessage}</div> : null}

        {infoModal ? (
          <div style={modalBackdropStyle} onClick={() => setInfoModal(null)}>
            <div style={modalCardStyle} onClick={(e) => e.stopPropagation()}>
              <div style={modalHeaderStyle}>
                <div style={modalTitleStyle}>
                  {infoModal === "hash"
                    ? "Server Seed Hash"
                    : infoModal === "client"
                    ? "Client Seed"
                    : infoModal === "nonce"
                    ? "Nonce"
                    : "Verification"}
                </div>
                <button
                  type="button"
                  onClick={() => setInfoModal(null)}
                  style={modalCloseStyle}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div style={modalTextStyle}>
                {infoModal === "hash"
                  ? "This is the cryptographic commitment shown before play. It proves the server seed was fixed in advance without revealing the actual seed yet."
                  : infoModal === "client"
                  ? "This is your user-controlled seed value. Changing it alters the deterministic path used to generate results."
                  : infoModal === "nonce"
                  ? "This is the incrementing counter used once per roll. It ensures every bet under the same seed session still produces a unique result."
                  : "Once the previous server seed is revealed, you can recompute the roll independently using the revealed server seed, client seed, and nonce."}
              </div>

              <button
                type="button"
                onClick={() => setInfoModal(null)}
                style={modalActionStyle}
              >
                Got it
              </button>
            </div>
          </div>
        ) : null}

        <section style={gridStyle}>
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <h3 style={cardTitleStyle}>Current Seed State</h3>
            </div>

            {loading ? (
              <div style={mutedStyle}>Loading seed state...</div>
            ) : seedState ? (
              <div style={seedRowsWrapStyle}>
                <div style={seedRowStyle}>
                  <div style={seedLeftStyle}>
                    <div style={seedLabelStyle}>Server Hash</div>
                    <button
                      type="button"
                      onClick={() => setInfoModal("hash")}
                      style={infoIconButtonStyle}
                      aria-label="What is Current Server Seed Hash?"
                    >
                      ?
                    </button>
                  </div>
                  <div style={seedValueStyle}>
                    {shortHash(seedState.current_server_seed_hash, 10, 6)}
                  </div>
                  <div style={seedActionsStyle}>
                    <button
                      type="button"
                      onClick={() => copyText(seedState.current_server_seed_hash, "Server seed hash")}
                      style={copyButtonMiniStyle}
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div style={seedRowStyle}>
                  <div style={seedLeftStyle}>
                    <div style={seedLabelStyle}>Client Seed</div>
                    <button
                      type="button"
                      onClick={() => setInfoModal("client")}
                      style={infoIconButtonStyle}
                      aria-label="What is Current Client Seed?"
                    >
                      ?
                    </button>
                  </div>
                  <div style={seedValueStyle}>
                    {shortHash(seedState.current_client_seed, 10, 6)}
                  </div>
                  <div style={seedActionsStyle}>
                    <button
                      type="button"
                      onClick={() => copyText(seedState.current_client_seed, "Client seed")}
                      style={copyButtonMiniStyle}
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div style={seedRowStyle}>
                  <div style={seedLeftStyle}>
                    <div style={seedLabelStyle}>Next Nonce</div>
                    <button
                      type="button"
                      onClick={() => setInfoModal("nonce")}
                      style={infoIconButtonStyle}
                      aria-label="What is Next Nonce?"
                    >
                      ?
                    </button>
                  </div>
                  <div style={seedValueStyle}>
                    {String((seedState.current_nonce ?? 0) + 1 || "—")}
                  </div>
                  <div style={seedActionsStyle}>
                    <button
                      type="button"
                      onClick={() => copyText((seedState.current_nonce ?? 0) + 1, "Nonce")}
                      style={copyButtonMiniStyle}
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div style={seedRowStyle}>
                  <div style={seedLeftStyle}>
                    <div style={seedLabelStyle}>Prev Seed</div>
                    <button
                      type="button"
                      onClick={() => setInfoModal("verification")}
                      style={infoIconButtonStyle}
                      aria-label="What is Revealed Previous Server Seed?"
                    >
                      ?
                    </button>
                  </div>
                  <div style={seedValueStyle}>
                    {seedState.revealed_prev_server_seed
                      ? shortHash(seedState.revealed_prev_server_seed, 10, 6)
                      : "Not revealed"}
                  </div>
                  <div style={seedActionsStyle}>
                    {seedState.revealed_prev_server_seed ? (
                      <button
                        type="button"
                        onClick={() =>
                          copyText(seedState.revealed_prev_server_seed, "Previous server seed")
                        }
                        style={copyButtonMiniStyle}
                      >
                        Copy
                      </button>
                    ) : null}
                  </div>
                </div>

                <div style={seedRowStyleNoBorder}>
                  <div style={seedLeftStyle}>
                    <div style={seedLabelStyle}>Prev Hash</div>
                    <button
                      type="button"
                      onClick={() => setInfoModal("hash")}
                      style={infoIconButtonStyle}
                      aria-label="What is Revealed Previous Server Seed Hash?"
                    >
                      ?
                    </button>
                  </div>
                  <div style={seedValueStyle}>
                    {seedState.revealed_prev_server_seed_hash
                      ? shortHash(seedState.revealed_prev_server_seed_hash, 10, 6)
                      : "Not revealed"}
                  </div>
                  <div style={seedActionsStyle}>
                    {seedState.revealed_prev_server_seed_hash ? (
                      <button
                        type="button"
                        onClick={() =>
                          copyText(seedState.revealed_prev_server_seed_hash, "Previous hash")
                        }
                        style={copyButtonMiniStyle}
                      >
                        Copy
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <div style={mutedStyle}>No seed state available yet.</div>
            )}
          </div>
        </section>

        <section style={gridStyle}>
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <h3 style={cardTitleStyle}>Provably Fair Controls</h3>
              <div style={cardSubStyle}>
                Manage your seed session and verify rolls from revealed seed sessions.
              </div>
            </div>

            <div style={formSectionStyle}>
              <div style={sectionMiniTitleStyle}>Seed Session</div>

              <div>
                <div style={fieldLabelStyle}>Client Seed</div>
                <input
                  value={clientSeedInput}
                  onChange={(e) => setClientSeedInput(e.target.value)}
                  placeholder="Enter custom client seed"
                  style={inputStyle}
                />
              </div>

              <div style={buttonRowStyle}>
                <button
                  onClick={handleUpdateClientSeed}
                  disabled={seedActionLoading}
                  style={primaryButtonStyle}
                >
                  {seedActionLoading ? "Updating..." : "Update Client Seed"}
                </button>

                <button
                  onClick={handleRotateSeed}
                  disabled={seedActionLoading}
                  style={secondaryButtonStyle}
                >
                  {seedActionLoading ? "Rotating..." : "Rotate Server Seed"}
                </button>
              </div>

              {seedActionMessage ? <div style={helperStyle}>{seedActionMessage}</div> : null}
            </div>

            <div style={dividerStyle} />

            <div style={formSectionStyle}>
              <div style={sectionMiniTitleStyle}>Verify a Roll</div>
              <div style={cardSubStyle}>
                Paste the revealed server seed, then verify using client seed and nonce.
              </div>

              <div>
                <div style={fieldLabelStyle}>Revealed Server Seed</div>
                <textarea
                  value={verifyServerSeed}
                  onChange={(e) => setVerifyServerSeed(e.target.value)}
                  placeholder="Paste revealed server seed here"
                  style={textareaStyle}
                />
              </div>

              <div>
                <div style={fieldLabelStyle}>Client Seed</div>
                <input
                  value={verifyClientSeed}
                  onChange={(e) => setVerifyClientSeed(e.target.value)}
                  placeholder="Client seed"
                  style={inputStyle}
                />
              </div>

              <div>
                <div style={fieldLabelStyle}>Nonce</div>
                <input
                  value={verifyNonce}
                  onChange={(e) => setVerifyNonce(e.target.value)}
                  placeholder="Nonce"
                  style={inputStyle}
                />
              </div>

              <div style={verifyInputsGridStyle}>
                <div>
                  <div style={fieldLabelStyle}>Condition</div>
                  <select
                    value={verifyCondition}
                    onChange={(e) => setVerifyCondition(e.target.value === "over" ? "over" : "under")}
                    style={inputStyle}
                  >
                    <option value="under">Under</option>
                    <option value="over">Over</option>
                  </select>
                </div>

                <div>
                  <div style={fieldLabelStyle}>Target</div>
                  <input
                    value={verifyTarget}
                    onChange={(e) => setVerifyTarget(e.target.value)}
                    placeholder="e.g. 52"
                    style={inputStyle}
                  />
                </div>
              </div>

              <button
                onClick={handleVerifyRoll}
                disabled={verifyLoading}
                style={primaryButtonStyle}
              >
                {verifyLoading ? "Verifying..." : "Verify Roll"}
              </button>

              {verifyError ? <div style={errorStyle}>{verifyError}</div> : null}

              {verifyResult ? (
                <div style={verifyResultStyle}>
                  <div style={infoBlockStyle}>
                    <div style={labelStyle}>Verified Dice Result</div>
                    <div style={valueStrongStyle}>{String(verifyResult.roll ?? "—")}</div>
                    <div style={helperMiniStyle}>This is the exact number that landed on the dice.</div>
                  </div>

                  {verifyResult.outcome ? (
                    <div style={infoBlockStyle}>
                      <div style={labelStyle}>Outcome</div>
                      <div
                        style={{
                          ...pillStyle,
                          ...(verifyResult.outcome === "win"
                            ? outcomeTone(true)
                            : outcomeTone(false)),
                          width: "fit-content",
                        }}
                      >
                        {verifyResult.outcome === "win" ? "Win" : "Loss"}
                      </div>
                      <div style={helperMiniStyle}>
                        Based on {String(verifyResult.condition || "—")} {String(verifyResult.target ?? "—")}.
                      </div>
                    </div>
                  ) : null}

                  <div style={infoBlockStyle}>
                    <div style={labelStyle}>Derived Server Seed Hash</div>
                    <div style={monoValueStyle}>
                      {verifyResult.server_seed_hash ? shortHash(verifyResult.server_seed_hash, 12, 8) : "—"}
                    </div>
                    <button
                      type="button"
                      onClick={() => copyText(verifyResult.server_seed_hash, "Derived hash")}
                      style={copyButtonStyle}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section style={cardStyle}>
          <div style={cardHeaderStyle}>
            <h3 style={cardTitleStyle}>Crash Provably Fair</h3>
            <div style={cardSubStyle}>
              Review Crash seed state, verify revealed sessions, and inspect recent rounds.
            </div>
          </div>

          <div style={formSectionStyle}>
            <div style={sectionMiniTitleStyle}>Crash Seed State</div>

            {crashSeedState ? (
              <div style={seedRowsWrapStyle}>
                <div style={seedRowStyle}>
                  <div style={seedLeftStyle}>
                    <div style={seedLabelStyle}>Server Hash</div>
                    <button
                      type="button"
                      onClick={() => setInfoModal("hash")}
                      style={infoIconButtonStyle}
                    >
                      ?
                    </button>
                  </div>
                  <div style={seedValueStyle}>
                    {shortHash(crashSeedState.server_seed_hash, 10, 6)}
                  </div>
                  <div style={seedActionsStyle}>
                    <button
                      type="button"
                      onClick={() => copyText(crashSeedState.server_seed_hash, "Crash server hash")}
                      style={copyButtonMiniStyle}
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div style={seedRowStyle}>
                  <div style={seedLeftStyle}>
                    <div style={seedLabelStyle}>Client Seed</div>
                    <button
                      type="button"
                      onClick={() => setInfoModal("client")}
                      style={infoIconButtonStyle}
                    >
                      ?
                    </button>
                  </div>
                  <div style={seedValueStyle}>
                    {shortHash(crashSeedState.client_seed, 10, 6)}
                  </div>
                  <div style={seedActionsStyle}>
                    <button
                      type="button"
                      onClick={() => copyText(crashSeedState.client_seed, "Crash client seed")}
                      style={copyButtonMiniStyle}
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div style={seedRowStyle}>
                  <div style={seedLeftStyle}>
                    <div style={seedLabelStyle}>Next Nonce</div>
                    <button
                      type="button"
                      onClick={() => setInfoModal("nonce")}
                      style={infoIconButtonStyle}
                    >
                      ?
                    </button>
                  </div>
                  <div style={seedValueStyle}>
                    {String(crashSeedState.nonce_next ?? "—")}
                  </div>
                  <div style={seedActionsStyle}>
                    <button
                      type="button"
                      onClick={() => copyText(crashSeedState.nonce_next, "Crash nonce")}
                      style={copyButtonMiniStyle}
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div style={seedRowStyle}>
                  <div style={seedLeftStyle}>
                    <div style={seedLabelStyle}>Prev Seed</div>
                    <button
                      type="button"
                      onClick={() => setInfoModal("verification")}
                      style={infoIconButtonStyle}
                    >
                      ?
                    </button>
                  </div>
                  <div style={seedValueStyle}>
                    {crashSeedState.revealed_prev_server_seed
                      ? shortHash(crashSeedState.revealed_prev_server_seed, 10, 6)
                      : "Not revealed"}
                  </div>
                  <div style={seedActionsStyle}>
                    {crashSeedState.revealed_prev_server_seed ? (
                      <button
                        type="button"
                        onClick={() =>
                          copyText(crashSeedState.revealed_prev_server_seed, "Crash previous seed")
                        }
                        style={copyButtonMiniStyle}
                      >
                        Copy
                      </button>
                    ) : null}
                  </div>
                </div>

                <div style={seedRowStyleNoBorder}>
                  <div style={seedLeftStyle}>
                    <div style={seedLabelStyle}>Prev Hash</div>
                    <button
                      type="button"
                      onClick={() => setInfoModal("hash")}
                      style={infoIconButtonStyle}
                    >
                      ?
                    </button>
                  </div>
                  <div style={seedValueStyle}>
                    {crashSeedState.revealed_prev_server_seed_hash
                      ? shortHash(crashSeedState.revealed_prev_server_seed_hash, 10, 6)
                      : "Not revealed"}
                  </div>
                  <div style={seedActionsStyle}>
                    {crashSeedState.revealed_prev_server_seed_hash ? (
                      <button
                        type="button"
                        onClick={() =>
                          copyText(crashSeedState.revealed_prev_server_seed_hash, "Crash previous hash")
                        }
                        style={copyButtonMiniStyle}
                      >
                        Copy
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <div style={mutedStyle}>No Crash seed state available yet.</div>
            )}
          </div>

          <div style={dividerStyle} />

          <div style={formSectionStyle}>
            <div style={sectionMiniTitleStyle}>Verify a Crash Round</div>

            <div>
              <div style={fieldLabelStyle}>Revealed Server Seed</div>
              <textarea
                value={crashVerifyServerSeed}
                onChange={(e) => setCrashVerifyServerSeed(e.target.value)}
                placeholder="Paste revealed Crash server seed here"
                style={textareaStyle}
              />
            </div>

            <div>
              <div style={fieldLabelStyle}>Client Seed</div>
              <input
                value={crashVerifyClientSeed}
                onChange={(e) => setCrashVerifyClientSeed(e.target.value)}
                placeholder="Client seed"
                style={inputStyle}
              />
            </div>

            <div>
              <div style={fieldLabelStyle}>Nonce</div>
              <input
                value={crashVerifyNonce}
                onChange={(e) => setCrashVerifyNonce(e.target.value)}
                placeholder="Nonce"
                style={inputStyle}
              />
            </div>

            <div>
              <div style={fieldLabelStyle}>Auto Cashout (optional)</div>
              <input
                value={crashVerifyAutoCashout}
                onChange={(e) => setCrashVerifyAutoCashout(e.target.value)}
                placeholder="e.g. 2.00"
                style={inputStyle}
              />
            </div>

            <button
              onClick={handleCrashVerify}
              disabled={crashVerifyLoading}
              style={primaryButtonStyle}
            >
              {crashVerifyLoading ? "Verifying..." : "Verify Crash Round"}
            </button>

            {crashVerifyError ? <div style={errorStyle}>{crashVerifyError}</div> : null}

            {crashVerifyResult ? (
              <div style={verifyResultStyle}>
                <div style={infoBlockStyle}>
                  <div style={labelStyle}>Verified Crash Point</div>
                  <div style={valueStrongStyle}>
                    {crashVerifyResult.crash_point != null
                      ? `${Number(crashVerifyResult.crash_point).toFixed(2)}x`
                      : "—"}
                  </div>
                </div>

                {crashVerifyResult.outcome ? (
                  <div style={infoBlockStyle}>
                    <div style={labelStyle}>Outcome</div>
                    <div
                      style={{
                        ...pillStyle,
                        ...(crashVerifyResult.outcome === "win"
                          ? outcomeTone(true)
                          : crashVerifyResult.outcome === "loss"
                          ? outcomeTone(false)
                          : {
                              background: "rgba(148,163,184,0.12)",
                              color: "#cbd5e1",
                              border: "1px solid rgba(148,163,184,0.20)",
                            }),
                        width: "fit-content",
                      }}
                    >
                      {crashVerifyResult.outcome === "win"
                        ? "Cashed Out / Win"
                        : crashVerifyResult.outcome === "loss"
                        ? "Lost"
                        : "Manual"}
                    </div>
                    <div style={helperMiniStyle}>
                      {crashVerifyResult.auto_cashout != null
                        ? `Based on auto cashout at ${Number(crashVerifyResult.auto_cashout).toFixed(2)}x.`
                        : "No auto cashout was provided for this verification."}
                    </div>
                  </div>
                ) : null}

                <div style={infoBlockStyle}>
                  <div style={labelStyle}>Derived Server Seed Hash</div>
                  <div style={monoValueStyle}>
                    {crashVerifyResult.server_seed_hash
                      ? shortHash(crashVerifyResult.server_seed_hash, 12, 8)
                      : "—"}
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText(crashVerifyResult.server_seed_hash, "Crash derived hash")}
                    style={copyButtonStyle}
                  >
                    Copy
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div style={dividerStyle} />

          <div style={formSectionStyle}>
            <div style={sectionMiniTitleStyle}>Recent Crash Verification History</div>

            {recentCrashRounds.length ? (
              <div style={betListStyle}>
                {recentCrashRounds.map((round) => {
                  const hasCrashFairnessData =
                    !!round.server_seed_hash && !!round.client_seed && !!round.nonce;

                  const verifyState = hasCrashFairnessData
                    ? getBetVerificationState(
                        round.server_seed_hash,
                        crashSeedState?.server_seed_hash,
                        crashSeedState?.revealed_prev_server_seed_hash
                      )
                    : "unavailable";
                  const canVerify =
                    verifyState === "ready" && !!crashSeedState?.revealed_prev_server_seed;

                  return (
                    <div key={round.id} style={betCardStyle}>
                      <div style={betTopRowStyle}>
                        <div style={{ minWidth: 0 }}>
                          <div style={betTitleStyle}>Crash Bet #{round.id}</div>
                          <div style={betTimeStyle}>{fmtTime(round.created_at || undefined)}</div>
                        </div>

                        <div style={betBadgeStackStyle}>
                          <span style={{ ...pillStyle, ...verificationBadgeStyle(verifyState) }}>
                            {verificationLabel(verifyState)}
                          </span>
                        </div>
                      </div>

                      <div style={betActionRowStyle}>
                        <button
                          type="button"
                          onClick={() => {
                            loadCrashRoundIntoVerifier(round);
                            if (canVerify) {
                              setCrashVerifyServerSeed(String(crashSeedState?.revealed_prev_server_seed || ""));
                            }
                          }}
                          disabled={!canVerify}
                          style={{
                            ...copyButtonStyle,
                            opacity: canVerify ? 1 : 0.55,
                            cursor: canVerify ? "pointer" : "not-allowed",
                          }}
                        >
                          {verificationButtonLabel(verifyState)}
                        </button>
                        <button
                          type="button"
                          onClick={() => copyText(round.client_seed, "Crash round client seed")}
                          style={copyButtonStyle}
                        >
                          Copy Client Seed
                        </button>
                        <button
                          type="button"
                          onClick={() => copyText(round.server_seed_hash, "Crash round hash")}
                          style={copyButtonStyle}
                        >
                          Copy Hash
                        </button>
                      </div>

                      {verifyState === "awaiting" ? (
                        <div style={awaitingNoteStyle}>
                          This round belongs to the current active Crash seed session. It becomes fully verifiable after the next seed rotation reveals that seed.
                        </div>
                      ) : verifyState === "unavailable" ? (
                        <div style={awaitingNoteStyle}>
                          This round belongs to an older Crash seed session whose revealed server seed is not retained in the current fair-state view.
                        </div>
                      ) : null}

                      <div style={betMetricsGridStyle}>
                        <div style={metricStyle}>
                          <div style={metricLabelStyle}>Bet Amount</div>
                          <div style={metricValueStyle}>
                            {typeof round.amount_usd === "number"
                              ? `$${round.amount_usd.toFixed(2)}`
                              : "—"}
                          </div>
                        </div>

                        <div style={metricStyle}>
                          <div style={metricLabelStyle}>Auto Cashout</div>
                          <div style={metricValueStyle}>
                            {typeof round.auto_cashout === "number"
                              ? `${round.auto_cashout.toFixed(2)}x`
                              : "Manual"}
                          </div>
                        </div>

                        <div style={metricStyle}>
                          <div style={metricLabelStyle}>Crash Point</div>
                          <div style={metricValueStyle}>
                            {typeof round.crash_point === "number"
                              ? `${round.crash_point.toFixed(2)}x`
                              : "—"}
                          </div>
                        </div>

                        <div style={metricStyle}>
                          <div style={metricLabelStyle}>Nonce</div>
                          <div style={metricValueStyle}>{String(round.nonce ?? "—")}</div>
                        </div>

                        <div style={metricStyle}>
                          <div style={metricLabelStyle}>Client Seed</div>
                          <div style={monoMetricValueStyle}>
                            {round.client_seed ? shortHash(round.client_seed, 10, 6) : "—"}
                          </div>
                        </div>

                        <div style={{ ...metricStyle, gridColumn: "1 / -1" }}>
                          <div style={metricLabelStyle}>Server Seed Hash</div>
                          <div style={monoMetricValueStyle}>
                            {round.server_seed_hash ? shortHash(round.server_seed_hash, 12, 8) : "—"}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={mutedStyle}>No Crash rounds found yet.</div>
            )}
          </div>
        </section>

        <section style={cardStyle}>
          <div style={cardHeaderStyle}>
            <h3 style={cardTitleStyle}>Recent Dice Verification History</h3>
            <div style={cardSubStyle}>
              Your latest Dice bets with fairness inputs and result data.
            </div>
          </div>

          {pageError ? <div style={errorStyle}>{pageError}</div> : null}

          {loading ? (
            <div style={mutedStyle}>Loading recent Dice bets...</div>
          ) : recentDiceBets.length ? (
            <div style={betListStyle}>
              {recentDiceBets.map((bet) => {
                const verifyState = getBetVerificationState(
                  bet.server_seed_hash,
                  seedState?.current_server_seed_hash,
                  seedState?.revealed_prev_server_seed_hash
                );
                const canVerify =
                  verifyState === "ready" && !!seedState?.revealed_prev_server_seed;

                return (
                <div key={bet.id} style={betCardStyle}>
                  <div style={betTopRowStyle}>
                    <div style={{ minWidth: 0 }}>
                      <div style={betTitleStyle}>Dice Bet #{bet.id}</div>
                      <div style={betTimeStyle}>{fmtTime(bet.created_at)}</div>
                    </div>

                    <div style={betBadgeStackStyle}>
                      <span style={{ ...pillStyle, ...verificationBadgeStyle(verifyState) }}>
                        {verificationLabel(verifyState)}
                      </span>
                      <span style={{ ...pillStyle, ...outcomeTone(!!bet.win) }}>
                        {bet.win ? "Win" : "Loss"}
                      </span>
                    </div>
                  </div>

                  <div style={betActionRowStyle}>
                    <button
                      type="button"
                      onClick={() => {
                        loadBetIntoVerifier(bet);
                        if (canVerify) {
                          setVerifyServerSeed(String(seedState?.revealed_prev_server_seed || ""));
                        }
                      }}
                      disabled={!canVerify}
                      style={{
                        ...copyButtonStyle,
                        opacity: canVerify ? 1 : 0.55,
                        cursor: canVerify ? "pointer" : "not-allowed",
                      }}
                    >
                      {verificationButtonLabel(verifyState)}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyText(bet.client_seed, "Bet client seed")}
                      style={copyButtonStyle}
                    >
                      Copy Client Seed
                    </button>
                    <button
                      type="button"
                      onClick={() => copyText(bet.server_seed_hash, "Bet server hash")}
                      style={copyButtonStyle}
                    >
                      Copy Hash
                    </button>
                  </div>

                  {verifyState === "awaiting" ? (
                    <div style={awaitingNoteStyle}>
                      This bet belongs to the current active seed session. It becomes fully verifiable after the next server seed rotation reveals that seed.
                    </div>
                  ) : verifyState === "unavailable" ? (
                    <div style={awaitingNoteStyle}>
                      This bet belongs to an older seed session whose revealed server seed is not retained in the current fair-state view.
                    </div>
                  ) : null}

                  <div style={betMetricsGridStyle}>
                    <div style={metricStyle}>
                      <div style={metricLabelStyle}>Amount</div>
                      <div style={metricValueStyle}>{fmtMoney(bet.amount_usd)}</div>
                    </div>

                    <div style={metricStyle}>
                      <div style={metricLabelStyle}>Payout</div>
                      <div style={metricValueStyle}>{fmtMoney(bet.payout)}</div>
                    </div>

                    <div style={metricStyle}>
                      <div style={metricLabelStyle}>Condition</div>
                      <div style={metricValueStyle}>
                        {bet.condition} {bet.target}
                      </div>
                    </div>

                    <div style={metricStyle}>
                      <div style={metricLabelStyle}>Roll</div>
                      <div style={metricValueStyle}>{String(bet.roll ?? "—")}</div>
                    </div>

                    <div style={metricStyle}>
                      <div style={metricLabelStyle}>Nonce</div>
                      <div style={metricValueStyle}>{String(bet.nonce ?? "—")}</div>
                    </div>

                    <div style={metricStyle}>
                      <div style={metricLabelStyle}>Client Seed</div>
                      <div style={monoMetricValueStyle}>{bet.client_seed ? shortHash(bet.client_seed, 10, 6) : "—"}</div>
                    </div>

                    <div style={{ ...metricStyle, gridColumn: "1 / -1" }}>
                      <div style={metricLabelStyle}>Server Seed Hash</div>
                      <div style={monoMetricValueStyle}>{bet.server_seed_hash ? shortHash(bet.server_seed_hash, 12, 8) : "—"}</div>
                    </div>

                  </div>
                </div>
                );
              })}
            </div>
          ) : (
            <div style={mutedStyle}>No Dice bets found yet.</div>
          )}
        </section>
      </div>
    </PlayerShell>
  );
}

const wrapStyle: CSSProperties = {
  width: "100%",
  maxWidth: "100%",
  display: "grid",
  gap: 14,
  boxSizing: "border-box",
  overflowX: "hidden",
};

const heroStyle: CSSProperties = {
  background: "linear-gradient(180deg, rgba(26,44,56,0.96) 0%, rgba(15,33,46,0.96) 100%)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 20,
  padding: "clamp(14px, 4vw, 22px)",
  boxShadow: "0 18px 40px rgba(0,0,0,0.20)",
  minWidth: 0,
};

const heroEyebrowStyle: CSSProperties = {
  color: "#86efac",
  fontSize: 12,
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.14em",
  marginBottom: 8,
};

const heroTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(24px, 7vw, 34px)",
  lineHeight: 1,
  fontWeight: 900,
  color: "#fff",
};

const heroTextStyle: CSSProperties = {
  margin: "12px 0 0 0",
  color: "#b9c7d5",
  fontSize: "clamp(14px, 3.5vw, 15px)",
  lineHeight: 1.7,
  maxWidth: 820,
};

const heroButtonRowStyle: CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginTop: 18,
};

const ghostLinkStyle: CSSProperties = {
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 42,
  padding: "0 16px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "#13202a",
  color: "#fff",
  fontWeight: 800,
  maxWidth: "100%",
  width: "100%",
  boxSizing: "border-box",
};

const noticeStyle: CSSProperties = {
  background: "rgba(245,158,11,0.10)",
  border: "1px solid rgba(245,158,11,0.20)",
  borderRadius: 18,
  padding: 16,
  minWidth: 0,
};

const noticeTitleStyle: CSSProperties = {
  color: "#fcd34d",
  fontWeight: 900,
  fontSize: 13,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  marginBottom: 6,
};

const noticeTextStyle: CSSProperties = {
  color: "#fde68a",
  fontSize: 14,
  lineHeight: 1.6,
};

const noticeSummaryStyle: CSSProperties = {
  color: "#fde68a",
  fontSize: 13,
  lineHeight: 1.5,
};

const collapsibleHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  flexWrap: "wrap",
};

const compactInfoStyle: CSSProperties = {
  color: "#b9c7d5",
  fontSize: 13,
  lineHeight: 1.45,
};

const infoRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
};

const infoIconButtonStyle: CSSProperties = {
  width: 28,
  height: 28,
  minWidth: 28,
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
  color: "#ffffff",
  fontSize: 13,
  fontWeight: 900,
  cursor: "pointer",
};

const modalBackdropStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 18,
  zIndex: 80,
};

const modalCardStyle: CSSProperties = {
  width: "100%",
  maxWidth: 420,
  background: "#1a2c38",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 18,
  padding: 18,
  display: "grid",
  gap: 14,
  boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
};

const modalHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};

const modalTitleStyle: CSSProperties = {
  color: "#fff",
  fontSize: 18,
  fontWeight: 900,
};

const modalCloseStyle: CSSProperties = {
  width: 32,
  height: 32,
  minWidth: 32,
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.03)",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
};

const modalTextStyle: CSSProperties = {
  color: "#d7e3ee",
  fontSize: 14,
  lineHeight: 1.65,
};

const modalActionStyle: CSSProperties = {
  border: "none",
  background: "#00e701",
  color: "#071824",
  minHeight: 42,
  borderRadius: 12,
  fontWeight: 900,
  cursor: "pointer",
};

const copyToastStyle: CSSProperties = {
  position: "sticky",
  top: 72,
  zIndex: 10,
  justifySelf: "start",
  background: "#13202a",
  color: "#fff",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 999,
  padding: "7px 10px",
  fontSize: 12,
  fontWeight: 800,
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(0, 1fr))",
  gap: 14,
  minWidth: 0,
};

const cardStyle: CSSProperties = {
  background: "#1a2c38",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 18,
  padding: "clamp(12px, 3.5vw, 18px)",
  display: "grid",
  gap: 14,
  minWidth: 0,
  overflow: "hidden",
};

const cardHeaderStyle: CSSProperties = {
  display: "grid",
  gap: 6,
  minWidth: 0,
};

const cardTitleStyle: CSSProperties = {
  margin: 0,
  color: "#fff",
  fontSize: "clamp(17px, 4.5vw, 20px)",
  fontWeight: 900,
};

const cardSubStyle: CSSProperties = {
  color: "#8ea3b3",
  fontSize: 13,
  lineHeight: 1.5,
};

const miniGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
  gap: 12,
  minWidth: 0,
};

const infoBlockStyle: CSSProperties = {
  background: "#13202a",
  border: "1px solid rgba(255,255,255,0.05)",
  borderRadius: 16,
  padding: 14,
  display: "grid",
  gap: 8,
  minWidth: 0,
  alignContent: "start",
};

const labelStyle: CSSProperties = {
  color: "#7f8fa4",
  fontSize: 11,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
};

const valueStyle: CSSProperties = {
  color: "#d7e3ee",
  fontSize: 14,
  lineHeight: 1.55,
};

const valueStrongStyle: CSSProperties = {
  color: "#fff",
  fontSize: "clamp(17px, 4.5vw, 20px)",
  fontWeight: 900,
  overflowWrap: "anywhere",
};

const monoValueStyle: CSSProperties = {
  color: "#d7e3ee",
  fontSize: 13,
  lineHeight: 1.55,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const formStackStyle: CSSProperties = {
  display: "grid",
  gap: 12,
  minWidth: 0,
};

const fieldLabelStyle: CSSProperties = {
  color: "#9fb2c7",
  fontSize: 12,
  fontWeight: 800,
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "#13202a",
  color: "#fff",
  outline: "none",
  boxSizing: "border-box",
  minWidth: 0,
};

const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: 110,
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "#13202a",
  color: "#fff",
  outline: "none",
  boxSizing: "border-box",
  resize: "vertical",
  minWidth: 0,
  overflowWrap: "anywhere",
};

const buttonRowStyle: CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const primaryButtonStyle: CSSProperties = {
  border: "none",
  background: "#00e701",
  color: "#071824",
  padding: "11px 14px",
  borderRadius: 12,
  fontWeight: 900,
  cursor: "pointer",
};

const secondaryButtonStyle: CSSProperties = {
  border: "1px solid rgba(255,255,255,0.08)",
  background: "#13202a",
  color: "#fff",
  padding: "11px 14px",
  borderRadius: 12,
  fontWeight: 800,
  cursor: "pointer",
};

const copyButtonStyle: CSSProperties = {
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.03)",
  color: "#fff",
  padding: "7px 10px",
  borderRadius: 10,
  fontWeight: 800,
  fontSize: 12,
  cursor: "pointer",
  maxWidth: "100%",
};

const helperStyle: CSSProperties = {
  color: "#93c5fd",
  fontSize: 13,
  lineHeight: 1.5,
  overflowWrap: "anywhere",
};

const helperMiniStyle: CSSProperties = {
  color: "#8ea3b3",
  fontSize: 12,
  lineHeight: 1.45,
};

const formSectionStyle: CSSProperties = {
  display: "grid",
  gap: 12,
};

const sectionMiniTitleStyle: CSSProperties = {
  color: "#ffffff",
  fontSize: 14,
  fontWeight: 900,
  letterSpacing: "0.02em",
};

const dividerStyle: CSSProperties = {
  height: 1,
  background: "rgba(148,163,184,0.14)",
  margin: "4px 0",
};

const verifyResultStyle: CSSProperties = {
  display: "grid",
  gap: 12,
  minWidth: 0,
};

const verifyInputsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 10,
  minWidth: 0,
};

const errorStyle: CSSProperties = {
  background: "rgba(239,68,68,0.10)",
  border: "1px solid rgba(239,68,68,0.22)",
  color: "#fca5a5",
  borderRadius: 14,
  padding: 12,
  fontSize: 14,
  overflowWrap: "anywhere",
};

const mutedStyle: CSSProperties = {
  color: "#8ea3b3",
  fontSize: 14,
};

const betListStyle: CSSProperties = {
  display: "grid",
  gap: 14,
  minWidth: 0,
};

const betCardStyle: CSSProperties = {
  background: "#13202a",
  border: "1px solid rgba(255,255,255,0.05)",
  borderRadius: 18,
  padding: 16,
  display: "grid",
  gap: 14,
  minWidth: 0,
  overflow: "hidden",
};

const betTopRowStyle: CSSProperties = {
  display: "grid",
  gap: 10,
};

const betTitleStyle: CSSProperties = {
  color: "#fff",
  fontSize: "clamp(14px, 4vw, 17px)",
  fontWeight: 900,
  overflowWrap: "anywhere",
};

const betTimeStyle: CSSProperties = {
  color: "#8ea3b3",
  fontSize: 13,
  marginTop: 4,
};

const pillStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 30,
  padding: "4px 12px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
};

const betActionRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 8,
  width: "100%",
};

const betBadgeStackStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "flex-start",
};

const awaitingNoteStyle: CSSProperties = {
  background: "rgba(245,158,11,0.10)",
  border: "1px solid rgba(245,158,11,0.18)",
  color: "#fde68a",
  borderRadius: 12,
  padding: "10px 12px",
  fontSize: 12,
  lineHeight: 1.5,
};

const betMetricsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 10,
  minWidth: 0,
};

const metricStyle: CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.04)",
  borderRadius: 14,
  padding: 12,
  display: "grid",
  gap: 6,
  minWidth: 0,
  alignContent: "start",
};

const metricLabelStyle: CSSProperties = {
  color: "#7f8fa4",
  fontSize: 11,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const metricValueStyle: CSSProperties = {
  color: "#fff",
  fontSize: 14,
  fontWeight: 800,
  overflowWrap: "anywhere",
};












const monoMetricValueStyle: CSSProperties = {
  color: "#d7e3ee",
  fontSize: 13,
  fontWeight: 700,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};


const seedRowsWrapStyle: CSSProperties = {
  display: "grid",
  gap: 0,
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 16,
  overflow: "hidden",
  background: "#13202a",
};

const seedRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr) auto",
  alignItems: "center",
  gap: 10,
  padding: "12px 14px",
  borderBottom: "1px solid rgba(148,163,184,0.12)",
};

const seedRowStyleNoBorder: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr) auto",
  alignItems: "center",
  gap: 10,
  padding: "12px 14px",
};

const seedLeftStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  minWidth: 0,
};

const seedLabelStyle: CSSProperties = {
  fontSize: 13,
  color: "#94a3b8",
  whiteSpace: "nowrap",
  fontWeight: 700,
};

const seedValueStyle: CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: 13,
  color: "#e2e8f0",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  textAlign: "left",
  minWidth: 0,
};

const seedActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 6,
};

const copyButtonMiniStyle: CSSProperties = {
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.03)",
  color: "#fff",
  padding: "7px 10px",
  borderRadius: 10,
  fontWeight: 800,
  fontSize: 12,
  cursor: "pointer",
};
