from pathlib import Path
from datetime import datetime
import shutil
import sys

file = Path("/var/www/coin2win-ui/components/CrashGame.tsx")
src = file.read_text()

backup = file.with_suffix(file.suffix + f".bak.{datetime.now().strftime('%Y%m%d-%H%M%S')}")
shutil.copy2(file, backup)

old_import = 'import { getStoredUser } from "@/lib/auth";'
new_import = 'import { getStoredUser } from "@/lib/auth";\nimport { API_ENDPOINTS, apiGet, apiPost, notifyWalletChanged } from "@/lib/gameApi";'
if old_import in src and 'from "@/lib/gameApi"' not in src:
    src = src.replace(old_import, new_import, 1)

old_fetch_current = '''  async function fetchCurrentRound() {
    const res = await fetch("/api/studio/crash-global/current", {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        typeof data?.detail === "string" ? data.detail : "Failed to load round"
      );
    }
    return data?.round as CrashRound;
  }'''
new_fetch_current = '''  async function fetchCurrentRound() {
    const data = await apiGet(API_ENDPOINTS.crashGlobalCurrent);
    return data?.round as CrashRound;
  }'''
if old_fetch_current not in src:
    print("Could not find fetchCurrentRound block.")
    print(f"Backup: {backup}")
    sys.exit(1)
src = src.replace(old_fetch_current, new_fetch_current, 1)

old_fetch_round_bets = '''  async function fetchRoundBets(roundId: number) {
    const res = await fetch(`/api/studio/crash-global/round-bets/${roundId}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        typeof data?.detail === "string" ? data.detail : "Failed to load round bets"
      );
    }
    return Array.isArray(data?.bets) ? (data.bets as RoundBet[]) : [];
  }'''
new_fetch_round_bets = '''  async function fetchRoundBets(roundId: number) {
    const data = await apiGet(API_ENDPOINTS.crashGlobalRoundBets(roundId));
    return Array.isArray(data?.bets) ? (data.bets as RoundBet[]) : [];
  }'''
if old_fetch_round_bets not in src:
    print("Could not find fetchRoundBets block.")
    print(f"Backup: {backup}")
    sys.exit(1)
src = src.replace(old_fetch_round_bets, new_fetch_round_bets, 1)

old_fetch_my_bets = '''  async function fetchMyBets(userId: string) {
    const res = await fetch(`/api/studio/crash-global/my-bets/${encodeURIComponent(userId)}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        typeof data?.detail === "string" ? data.detail : "Failed to load your bets"
      );
    }
    return Array.isArray(data?.bets) ? (data.bets as CrashBet[]) : [];
  }'''
new_fetch_my_bets = '''  async function fetchMyBets(userId: string) {
    const data = await apiGet(API_ENDPOINTS.crashGlobalMyBets(userId));
    return Array.isArray(data?.bets) ? (data.bets as CrashBet[]) : [];
  }'''
if old_fetch_my_bets not in src:
    print("Could not find fetchMyBets block.")
    print(f"Backup: {backup}")
    sys.exit(1)
src = src.replace(old_fetch_my_bets, new_fetch_my_bets, 1)

old_place_bet = '''      const res = await fetch("/api/studio/crash-global/bet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data?.detail === "string" ? data.detail : "Request failed"
        );
      }

      setMessage("Bet placed successfully.");
      await refreshAll();'''
new_place_bet = '''      await apiPost(API_ENDPOINTS.crashGlobalBet, payload);

      notifyWalletChanged();
      setMessage("Bet placed successfully.");
      await refreshAll();'''
if old_place_bet not in src:
    print("Could not find handlePlaceBet request block.")
    print(f"Backup: {backup}")
    sys.exit(1)
src = src.replace(old_place_bet, new_place_bet, 1)

old_cashout = '''      const res = await fetch(`/api/studio/crash-global/cashout/${activeBet.id}`, {
        method: "POST",
        headers: { Accept: "application/json" },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data?.detail === "string" ? data.detail : "Cashout failed"
        );
      }

      setJustCashedOut(true);'''
new_cashout = '''      await apiPost(API_ENDPOINTS.crashGlobalCashout(activeBet.id), {});

      notifyWalletChanged();
      setJustCashedOut(true);'''
if old_cashout not in src:
    print("Could not find handleCashout request block.")
    print(f"Backup: {backup}")
    sys.exit(1)
src = src.replace(old_cashout, new_cashout, 1)

file.write_text(src)
print(f"Patched: {file}")
print(f"Backup:  {backup}")
