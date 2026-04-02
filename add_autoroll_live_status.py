from pathlib import Path
from datetime import datetime
import shutil
import sys

file = Path("/var/www/coin2win-ui/components/DiceGame.tsx")
src = file.read_text()

backup = file.with_suffix(file.suffix + f".bak.{datetime.now().strftime('%Y%m%d-%H%M%S')}")
shutil.copy2(file, backup)

# 1) Add live autoroll state
old_state = """  const [autoRollCount, setAutoRollCount] = useState(10);
  const [stopOnProfit, setStopOnProfit] = useState("");
  const [stopOnLoss, setStopOnLoss] = useState("");
  const [recentBets, setRecentBets] = useState<any[]>([]);
"""
new_state = """  const [autoRollCount, setAutoRollCount] = useState(10);
  const [stopOnProfit, setStopOnProfit] = useState("");
  const [stopOnLoss, setStopOnLoss] = useState("");
  const [autoRollCurrent, setAutoRollCurrent] = useState(0);
  const [autoRollSessionProfit, setAutoRollSessionProfit] = useState(0);
  const [recentBets, setRecentBets] = useState<any[]>([]);
"""
if old_state not in src:
    print("Could not find autoroll state block.")
    print(f"Backup saved to: {backup}")
    sys.exit(1)
src = src.replace(old_state, new_state, 1)

# 2) Update handleAutoRoll to track live progress
old_loop = """  const handleAutoRoll = async () => {
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

        const rollData = await executeRoll();
        if (!rollData) break;

        const profit = Number(rollData?.profit ?? 0);
        totalProfit += profit;

        if (profitStop !== null && totalProfit >= profitStop) break;
        if (lossStop !== null && totalProfit <= -Math.abs(lossStop)) break;

        await sleep(650);
      }
    } finally {
      setAutoRolling(false);
      autoRollStopRef.current = false;
    }
  };
"""

new_loop = """  const handleAutoRoll = async () => {
    if (autoRolling) {
      autoRollStopRef.current = true;
      setAutoRolling(false);
      return;
    }

    autoRollStopRef.current = false;
    setAutoRolling(true);
    setAutoRollCurrent(0);
    setAutoRollSessionProfit(0);

    let totalProfit = 0;
    const maxRolls = Math.max(1, Number(autoRollCount || 0));
    const profitStop = stopOnProfit === "" ? null : Number(stopOnProfit);
    const lossStop = stopOnLoss === "" ? null : Number(stopOnLoss);

    try {
      for (let i = 0; i < maxRolls; i++) {
        if (autoRollStopRef.current) break;

        setAutoRollCurrent(i + 1);

        const rollData = await executeRoll();
        if (!rollData) break;

        const profit = Number(rollData?.profit ?? 0);
        totalProfit += profit;
        setAutoRollSessionProfit(round2(totalProfit));

        if (profitStop !== null && totalProfit >= profitStop) break;
        if (lossStop !== null && totalProfit <= -Math.abs(lossStop)) break;

        await sleep(650);
      }
    } finally {
      setAutoRolling(false);
      autoRollStopRef.current = false;
    }
  };
"""

if old_loop not in src:
    print("Could not find handleAutoRoll block.")
    print(f"Backup saved to: {backup}")
    sys.exit(1)
src = src.replace(old_loop, new_loop, 1)

# 3) Add live status UI under the auto button helper text
old_ui = """                <div style={{ color: "#94a3b8", fontSize: "11px" }}>
                  Runs up to {autoRollCount || 0} rolls and stops early if profit/loss target is hit.
                </div>
"""
new_ui = """                <div style={{ color: "#94a3b8", fontSize: "11px" }}>
                  Runs up to {autoRollCount || 0} rolls and stops early if profit/loss target is hit.
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "10px",
                    fontSize: "11px",
                    color: "#cbd5e1",
                    background: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "10px",
                    padding: "8px 10px",
                  }}
                >
                  <span>
                    Roll: {autoRolling ? autoRollCurrent : 0}/{autoRollCount || 0}
                  </span>
                  <span
                    style={{
                      color:
                        autoRollSessionProfit > 0
                          ? "#22c55e"
                          : autoRollSessionProfit < 0
                          ? "#ef4444"
                          : "#cbd5e1",
                      fontWeight: 700,
                    }}
                  >
                    Session P/L: {autoRollSessionProfit > 0 ? "+" : ""}
                    {formatNum(autoRollSessionProfit)}
                  </span>
                </div>
"""
if old_ui not in src:
    print("Could not find autoroll helper UI block.")
    print(f"Backup saved to: {backup}")
    sys.exit(1)
src = src.replace(old_ui, new_ui, 1)

file.write_text(src)

print(f"Added live autoroll status in: {file}")
print(f"Backup saved to: {backup}")
