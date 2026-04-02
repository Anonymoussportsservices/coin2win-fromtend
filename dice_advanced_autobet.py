from pathlib import Path
from datetime import datetime
import shutil
import sys
import re

file = Path("/var/www/coin2win-ui/components/DiceGame.tsx")
src = file.read_text()

backup = file.with_suffix(file.suffix + f".bak.{datetime.now().strftime('%Y%m%d-%H%M%S')}")
shutil.copy2(file, backup)

# 1) states
old = '''  const [autoRollCurrent, setAutoRollCurrent] = useState(0);
  const [autoRollSessionProfit, setAutoRollSessionProfit] = useState(0);'''
new = '''  const [autoRollCurrent, setAutoRollCurrent] = useState(0);
  const [autoRollSessionProfit, setAutoRollSessionProfit] = useState(0);
  const [increaseOnLossPct, setIncreaseOnLossPct] = useState("0");
  const [resetOnWin, setResetOnWin] = useState(true);
  const autoBaseBetRef = useRef(0);'''
if old not in src:
    print("Could not find auto state block.")
    print(f"Backup: {backup}")
    sys.exit(1)
src = src.replace(old, new, 1)

# 2) auto-bet ui
old = '''                <div
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
                </div>'''
new = '''                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                    gap: "8px",
                  }}
                >
                  <div>
                    <div style={{ color: "#94a3b8", fontSize: "11px", marginBottom: "4px" }}>
                      Increase on Loss %
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={increaseOnLossPct}
                      onChange={(e) => setIncreaseOnLossPct(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "10px",
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "#0f172a",
                        color: "#fff",
                        fontSize: "13px",
                      }}
                    />
                  </div>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "end",
                      gap: "8px",
                      color: "#cbd5e1",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={resetOnWin}
                      onChange={(e) => setResetOnWin(e.target.checked)}
                    />
                    Reset to base bet on win
                  </label>
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
                </div>'''
if old not in src:
    print("Could not find auto status UI block.")
    print(f"Backup: {backup}")
    sys.exit(1)
src = src.replace(old, new, 1)

# 3) autobet logic
pattern = re.compile(r'''const handleAutoRoll = async \(\) => \{.*?\n  \};''', re.DOTALL)
replacement = '''const handleAutoRoll = async () => {
    if (autoRolling) {
      autoRollStopRef.current = true;
      setAutoRolling(false);
      return;
    }

    autoRollStopRef.current = false;
    setAutoRolling(true);
    setAutoRollCurrent(0);
    setAutoRollSessionProfit(0);
    autoBaseBetRef.current = Number(bet);

    let totalProfit = 0;
    let workingBet = Number(bet);
    const maxRolls = Math.max(1, Number(autoRollCount || 0));
    const profitStop = stopOnProfit === "" ? null : Number(stopOnProfit);
    const lossStop = stopOnLoss === "" ? null : Number(stopOnLoss);
    const lossIncrease = Math.max(0, Number(increaseOnLossPct || 0));

    try {
      for (let i = 0; i < maxRolls; i++) {
        if (autoRollStopRef.current) break;

        setAutoRollCurrent(i + 1);
        if (workingBet > 0) setBet(round2(workingBet));

        const rollData = await executeRoll();
        if (!rollData) break;

        const profit = Number(rollData?.profit ?? 0);
        totalProfit += profit;
        setAutoRollSessionProfit(round2(totalProfit));

        if (profitStop !== null and False):
          pass

        if (profitStop !== null && totalProfit >= profitStop) break;
        if (lossStop !== null && totalProfit <= -Math.abs(lossStop)) break;

        if (profit > 0) {
          if (resetOnWin) {
            workingBet = Number(autoBaseBetRef.current || bet);
          }
        } else if (profit < 0 && lossIncrease > 0) {
          workingBet = round2(workingBet * (1 + lossIncrease / 100));
        }

        await sleep(650);
      }
    } finally {
      setAutoRolling(false);
      autoRollStopRef.current = false;
      if (autoBaseBetRef.current > 0) {
        setBet(round2(autoBaseBetRef.current));
      }
    }
  };'''
replacement = replacement.replace("if (profitStop !== null and False):\n          pass\n\n        ", "")
new_src, count = pattern.subn(replacement, src, count=1)
if count != 1:
    print("Could not replace handleAutoRoll block.")
    print(f"Backup: {backup}")
    sys.exit(1)

src = new_src
file.write_text(src)
print(f"Patched: {file}")
print(f"Backup:  {backup}")
