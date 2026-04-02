from pathlib import Path
from datetime import datetime
import shutil
import re
import sys

file = Path("/var/www/coin2win-ui/components/DiceGame.tsx")
src = file.read_text()

backup = file.with_suffix(file.suffix + f".bak.{datetime.now().strftime('%Y%m%d-%H%M%S')}")
shutil.copy2(file, backup)

# 1) add auth import
old_import = 'import { useEffect, useMemo, useRef, useState } from "react";'
new_import = 'import { useEffect, useMemo, useRef, useState } from "react";\nimport { getStoredUser } from "../lib/auth";'

if old_import in src and 'getStoredUser' not in src:
    src = src.replace(old_import, new_import, 1)

# 2) add user constant near top of component
old_component_start = 'export default function DiceGame() {\n  const [bet, setBet] = useState(1);'
new_component_start = 'export default function DiceGame() {\n  const user = getStoredUser();\n  const [bet, setBet] = useState(1);'

if old_component_start in src and 'const user = getStoredUser();' not in src:
    src = src.replace(old_component_start, new_component_start, 1)

# 3) replace executeRoll completely
pattern = re.compile(
    r'const executeRoll = async \(\) => \{.*?\n  \};',
    re.DOTALL
)

replacement = '''const executeRoll = async () => {
    if (rolling) return null;

    if (!user?.user_id) {
      setError("User not found. Please log in again.");
      return null;
    }

    if (!bet || bet <= 0) {
      setError("Enter a valid bet amount.");
      return null;
    }

    setRolling(true);
    setError("");

    try {
      const res = await fetch("/api/studio/dice/bet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          user_id: user.user_id,
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

      setResult(Number(rollValue.toFixed(2)));
      setWin(didWin);
      setSessionProfit((prev) => round2(prev + profit));

      appendRecentBet({
        ...data,
        amount,
        payout,
        profit,
        roll: rollValue,
        target: Number(data?.target ?? target),
        condition: data?.condition ?? condition,
        win: didWin,
      });

      return {
        ...data,
        amount,
        payout,
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
  };'''

new_src, count = pattern.subn(replacement, src, count=1)
if count != 1:
    print("Could not replace executeRoll block safely.")
    print(f"Backup saved to: {backup}")
    sys.exit(1)

src = new_src
file.write_text(src)

print(f"Fixed DiceGame route + user payload in: {file}")
print(f"Backup saved to: {backup}")
