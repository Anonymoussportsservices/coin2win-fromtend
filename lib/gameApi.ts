import { getStoredToken } from "./auth";

export const API_ENDPOINTS = {
  crashBet: "/api/studio/crash/bet",
  crashBets: (userId: string) => `/api/studio/crash/bets/${encodeURIComponent(userId)}`,
  crashRounds: (userId: string) => `/api/studio/crash/rounds/${encodeURIComponent(userId)}`,
  crashCashout: (betId: string | number) => `/api/studio/crash/cashout/${betId}`,
  crashSeed: (userId: string) => `/api/studio/crash/seed/${encodeURIComponent(userId)}`,
  crashSetClientSeed: (userId: string) => `/api/studio/crash/seed/${encodeURIComponent(userId)}/client`,
  crashRotateSeed: (userId: string) => `/api/studio/crash/seed/${encodeURIComponent(userId)}/rotate`,
  crashVerify: "/api/studio/crash/verify",

  crashGlobalCurrent: "/api/studio/crash-global/current",
  crashGlobalFair: "/api/studio/crash-global/fair",
  crashGlobalBet: "/api/studio/crash-global/bet",
  crashGlobalCashout: (betId: string | number) => `/api/studio/crash-global/cashout/${betId}`,
  crashGlobalHistory: "/api/studio/crash-global/history",
  crashGlobalMyBets: (userId: string) => `/api/studio/crash-global/my-bets/${encodeURIComponent(userId)}`,
  crashGlobalRoundBets: (roundId: string | number) => `/api/studio/crash-global/round-bets/${roundId}`,

  diceBet: "/api/studio/dice/bet",
  diceBets: (userId: string) => `/api/studio/dice/bets/${encodeURIComponent(userId)}`,
  diceFair: (userId: string) => `/api/studio/dice/fair/${encodeURIComponent(userId)}`,
  diceVerify: "/api/studio/dice/verify",
  diceSeed: (userId: string) => `/api/studio/dice/seed/${encodeURIComponent(userId)}`,
  diceSetClientSeed: (userId: string) => `/api/studio/dice/seed/${encodeURIComponent(userId)}/client`,
  diceRotateSeed: (userId: string) => `/api/studio/dice/seed/${encodeURIComponent(userId)}/rotate`,
};

function buildHeaders(extra?: Record<string, string>) {
  const token = getStoredToken();
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extra || {}),
  };
}

async function parseResponse(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof data?.detail === "string"
        ? data.detail
        : typeof data?.message === "string"
        ? data.message
        : "Request failed";
    throw new Error(message);
  }
  return data;
}

export async function apiGet(path: string) {
  const res = await fetch(path, {
    method: "GET",
    headers: buildHeaders(),
    cache: "no-store",
  });
  return parseResponse(res);
}

export async function apiPost(path: string, body: Record<string, unknown>) {
  const res = await fetch(path, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });
  return parseResponse(res);
}

export function notifyWalletChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("coin2win-auth-changed"));
    window.dispatchEvent(new Event("coin2win-wallet-changed"));
  }
}
