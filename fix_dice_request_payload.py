from pathlib import Path
from datetime import datetime
import shutil
import sys

file = Path("/var/www/coin2win-ui/components/DiceGame.tsx")
src = file.read_text()

backup = file.with_suffix(file.suffix + f".bak.{datetime.now().strftime('%Y%m%d-%H%M%S')}")
shutil.copy2(file, backup)

old = """  const executeRoll = async () => {
    if (rolling) return null;

    setRolling(true);
    setError("");

    try {
      const res = await fetch("/api/studio/dice/bet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number(bet),
          target: Number(target),
          condition,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.detail || data?.error || "Roll failed");
      }

      const rollValue = Number(data?.roll ?? data?.result ?? 0);
      const payout = Number(data?.payout ?? 0);
      const amount = Number(data?.amount ?? bet ?? 0);
      const profit = Number(data?.profit ?? (payout - amount));
      const didWin = Boolean(
        data?.win ??
        data?.isWin ??
        (profit > 0)
      );

      setResult(rollValue);
      setWin(didWin);
      setSessionProfit((prev) => round2(prev + profit));
      appendRecentBet({
        ...data,
        amount,
        profit,
        roll: rollValue,
        target,
        condition,
        win: didWin,
      });

      return {
        ...data,
        amount,
        profit,
        roll: rollValue,
        target,
        condition,
        win: didWin,
      };
    } catch (err: any) {
      setError(err?.message || "Roll failed");
      console.error("Dice roll error:", err);
      return null;
    } finally {
      setRolling(false);
    }
  };"""

new = """  const executeRoll = async () => {
    if (rolling) return null;

    setRolling(true);
    setError("");

    try {
      const rawUser =
        typeof window !== "undefined" ? localStorage.getItem("user") : null;
      const parsedUser = rawUser ? JSON.parse(rawUser) : null;
      const userId =
        parsedUser?.user_id ||
        parsedUser?.id ||
        (typeof window !== "undefined" ? localStorage.getItem("user_id") : null);

      if (!userId) {
        throw new Error("User not found. Please log in again.");
      }

      const res = await fetch("/api/studio/dice/bet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: String(userId),
          amount_usd: Number(bet),
          target: Number(target),
          condition,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.detail || data?.error || "Roll failed");
      }

      const rollValue = Number(data?.roll ?? 0);
      const payout = Number(data?.payout ?? 0);
      const amount = Number(data?.amount_usd ?? bet ?? 0);
      const profit = round2(payout - amount);
      const didWin = Boolean(data?.win);

      setResult(rollValue);
      setWin(didWin);
      setSessionProfit((prev) => round2(prev + profit));

      appendRecentBet({
        ...data,
        amount,
        profit,
        roll: rollValue,
        target: Number(data?.target ?? target),
        condition: data?.condition ?? condition,
        win: didWin,
      });

      return {
        ...data,
        amount,
        profit,
        roll: rollValue,
        target: Number(data?.target ?? target),
        condition: data?.condition ?? condition,
        win: didWin,
      };
    } catch (err: any) {
      setError(err?.message || "Roll failed");
      console.error("Dice roll error:", err);
      return null;
    } finally {
      setRolling(false);
    }
  };"""

if old not in src:
    print("Could not find executeRoll block exactly.")
    print(f"Backup saved to: {backup}")
    sys.exit(1)

src = src.replace(old, new, 1)
file.write_text(src)

print(f"Fixed dice request payload in: {file}")
print(f"Backup saved to: {backup}")
