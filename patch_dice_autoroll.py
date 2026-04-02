from pathlib import Path
import re
import shutil
from datetime import datetime

FILE = Path("/var/www/coin2win-ui/components/DiceGame.tsx")

if not FILE.exists():
    raise SystemExit(f"File not found: {FILE}")

src = FILE.read_text()
backup = FILE.with_suffix(FILE.suffix + f".bak.{datetime.now().strftime('%Y%m%d-%H%M%S')}")
shutil.copy2(FILE, backup)

# --------------------------------------------------
# 1) Fix React import
# --------------------------------------------------
src = re.sub(
    r'import\s*\{\s*([^}]*)\s*\}\s*from\s*["\']react["\'];?',
    lambda m: (
        'import { ' +
        ', '.join(sorted(set(
            [x.strip() for x in m.group(1).split(",") if x.strip()] +
            ["useEffect", "useRef", "useState"]
        ))) +
        ' } from "react";'
    ),
    src,
    count=1
)

# If no react named import exists, add one
if 'from "react"' not in src and "from 'react'" not in src:
    src = 'import { useEffect, useRef, useState } from "react";\n' + src

# --------------------------------------------------
# 2) Remove duplicate showAutoPanel state
# --------------------------------------------------
matches = list(re.finditer(
    r'const\s*\[\s*showAutoPanel\s*,\s*setShowAutoPanel\s*\]\s*=\s*useState\s*\(\s*false\s*\)\s*;?',
    src
))
if len(matches) > 1:
    first = matches[0]
    kept = first.group(0)
    src = re.sub(
        r'const\s*\[\s*showAutoPanel\s*,\s*setShowAutoPanel\s*\]\s*=\s*useState\s*\(\s*false\s*\)\s*;?\n?',
        '',
        src
    )
    # insert once near top of component
    component_match = re.search(r'(export\s+default\s+function\s+\w+\s*\([^)]*\)\s*\{)', src)
    if component_match:
        insert_at = component_match.end()
        src = src[:insert_at] + "\n  " + kept + "\n" + src[insert_at:]
    else:
        src = kept + "\n" + src
elif len(matches) == 0:
    component_match = re.search(r'(export\s+default\s+function\s+\w+\s*\([^)]*\)\s*\{)', src)
    if component_match:
        insert_at = component_match.end()
        src = src[:insert_at] + '\n  const [showAutoPanel, setShowAutoPanel] = useState(false);\n' + src[insert_at:]

# --------------------------------------------------
# 3) Add missing state block after showAutoPanel
# --------------------------------------------------
state_block = """
  const [autoRollEnabled, setAutoRollEnabled] = useState(false);
  const [autoRolling, setAutoRolling] = useState(false);
  const [autoRollCount, setAutoRollCount] = useState(10);
  const [stopOnProfit, setStopOnProfit] = useState("");
  const [stopOnLoss, setStopOnLoss] = useState("");
  const [recentBets, setRecentBets] = useState<any[]>([]);
  const autoRollStopRef = useRef(false);
""".strip("\n")

if "const [autoRolling, setAutoRolling]" not in src:
    src = re.sub(
        r'(const\s*\[\s*showAutoPanel\s*,\s*setShowAutoPanel\s*\]\s*=\s*useState\s*\(\s*false\s*\)\s*;?)',
        r'\1\n' + state_block,
        src,
        count=1
    )

# --------------------------------------------------
# 4) Add helpers before first return(
# --------------------------------------------------
helpers_block = """
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  useEffect(() => {
    return () => {
      autoRollStopRef.current = true;
    };
  }, []);

  const appendRecentBet = (rollResult: any) => {
    const item = {
      id: rollResult?.id || `${Date.now()}-${Math.random()}`,
      createdAt: rollResult?.createdAt || new Date().toISOString(),
      amount: Number(rollResult?.amount ?? betAmount ?? 0),
      payout: Number(rollResult?.payout ?? 0),
      profit: Number(
        rollResult?.profit ??
          (Number(rollResult?.payout ?? 0) - Number(rollResult?.amount ?? betAmount ?? 0))
      ),
      roll: Number(rollResult?.roll ?? rollResult?.result ?? 0),
      target: Number(rollResult?.target ?? targetNumber ?? 0),
      condition: rollResult?.condition || (isOver ? "over" : "under"),
      win: Boolean(
        rollResult?.win ??
          rollResult?.isWin ??
          Number(rollResult?.payout ?? 0) > 0
      ),
    };

    setRecentBets((prev) => [item, ...prev].slice(0, 12));
  };

  const executeRoll = async () => {
    if (isRolling) return null;

    setIsRolling(true);
    try {
      const res = await fetch("/api/dice/roll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number(betAmount),
          target: Number(targetNumber),
          condition: isOver ? "over" : "under",
        }),
      });

      if (!res.ok) {
        throw new Error("Roll failed");
      }

      const data = await res.json();

      if (typeof setRollResult === "function") setRollResult(data);
      if (typeof setSessionProfit === "function") {
        const p = Number(
          data?.profit ??
            (Number(data?.payout ?? 0) - Number(data?.amount ?? betAmount ?? 0))
        );
        setSessionProfit((prev: number) => prev + p);
      }

      appendRecentBet(data);
      return data;
    } catch (err) {
      console.error("Dice roll error:", err);
      return null;
    } finally {
      setIsRolling(false);
    }
  };

  const handleAutoRoll = async () => {
    if (autoRolling) {
      autoRollStopRef.current = true;
      setAutoRolling(false);
      return;
    }

    autoRollStopRef.current = false;
    setAutoRolling(true);

    let totalProfit = 0;
    const maxRolls = Math.max(1, Number(autoRollCount || 0));
    const profitStop = stopOnProfit === "" ? null : Number(stopOnProfit);
    const lossStop = stopOnLoss === "" ? null : Number(stopOnLoss);

    try {
      for (let i = 0; i < maxRolls; i++) {
        if (autoRollStopRef.current) break;

        const result = await executeRoll();
        if (!result) break;

        const profit = Number(
          result?.profit ??
            (Number(result?.payout ?? 0) - Number(result?.amount ?? betAmount ?? 0))
        );

        totalProfit += profit;

        if (profitStop is not None and totalProfit >= profitStop):
            break
        if (lossStop is not None and totalProfit <= -abs(lossStop)):
            break

        await sleep(650);
      }
    } finally {
      setAutoRolling(false);
      autoRollStopRef.current = false;
    }
  };

  const handleRoll = async () => {
    await executeRoll();
  };
""".strip("\n")

# Fix accidental Python syntax in embedded TSX
helpers_block = helpers_block.replace(
    'if (profitStop is not None and totalProfit >= profitStop):\n            break',
    'if (profitStop !== null && totalProfit >= profitStop) break;'
).replace(
    'if (lossStop is not None and totalProfit <= -abs(lossStop)):\n            break',
    'if (lossStop !== null && totalProfit <= -Math.abs(lossStop)) break;'
)

if "const executeRoll = async () =>" not in src:
    src = re.sub(r'\n(\s*return\s*\()', '\n' + helpers_block + '\n\n\\1', src, count=1)

# --------------------------------------------------
# 5) Replace old roll button handlers
# --------------------------------------------------
src = re.sub(r'onClick=\{\s*handleRoll\s*\}', 'onClick={executeRoll}', src)
src = re.sub(r'onClick=\{\s*rollDice\s*\}', 'onClick={executeRoll}', src)

# --------------------------------------------------
# 6) Replace/start auto roll button labels/handler
# --------------------------------------------------
src = re.sub(r'onClick=\{\s*startAutoRoll\s*\}', 'onClick={handleAutoRoll}', src)
src = re.sub(r'onClick=\{\s*toggleAutoRoll\s*\}', 'onClick={handleAutoRoll}', src)
src = re.sub(r'onClick=\{\s*handleAutoRoll\s*\}', 'onClick={handleAutoRoll}', src)

src = re.sub(
    r'\{[^{}]*autoRolling[^{}]*\}',
    '{autoRolling ? "Stop Auto Roll" : "Start Auto Roll"}',
    src,
    count=1
)

# --------------------------------------------------
# 7) Fix input bindings if present
# --------------------------------------------------
src = re.sub(
    r'value=\{autoRollCount\}(\s*)onChange=\{\(e\)\s*=>\s*[^}]+\}',
    r'value={autoRollCount}\1onChange={(e) => setAutoRollCount(Number(e.target.value))}',
    src
)
src = re.sub(
    r'value=\{stopOnProfit\}(\s*)onChange=\{\(e\)\s*=>\s*[^}]+\}',
    r'value={stopOnProfit}\1onChange={(e) => setStopOnProfit(e.target.value)}',
    src
)
src = re.sub(
    r'value=\{stopOnLoss\}(\s*)onChange=\{\(e\)\s*=>\s*[^}]+\}',
    r'value={stopOnLoss}\1onChange={(e) => setStopOnLoss(e.target.value)}',
    src
)

# --------------------------------------------------
# 8) Add Recent Bets UI if none exists
# --------------------------------------------------
recent_bets_ui = """
      <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Recent Bets</h3>
          <span className="text-xs text-white/50">{recentBets.length} shown</span>
        </div>

        {recentBets.length === 0 ? (
          <div className="text-sm text-white/50">No recent bets yet.</div>
        ) : (
          <div className="space-y-2">
            {recentBets.map((bet) => (
              <div
                key={bet.id}
                className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="text-white/80">
                    {bet.condition === "over" ? "Over" : "Under"} {bet.target}
                  </span>
                  <span className="text-white/50">Roll: {bet.roll}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-white/70">{bet.amount}</span>
                  <span className={bet.win ? "text-green-400" : "text-red-400"}>
                    {bet.win ? "+" : ""}
                    {Number(bet.profit).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
""".strip("\n")

if "Recent Bets" not in src:
    src = re.sub(r'(\n\s*</div>\s*\n\s*</div>\s*\n\s*\)\s*;)', '\n' + recent_bets_ui + '\n\\1', src, count=1)

FILE.write_text(src)

print("Patched:", FILE)
print("Backup:", backup)
