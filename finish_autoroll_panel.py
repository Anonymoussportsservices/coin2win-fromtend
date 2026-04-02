from pathlib import Path
from datetime import datetime
import shutil
import sys

file = Path("/var/www/coin2win-ui/components/DiceGame.tsx")
src = file.read_text()

backup = file.with_suffix(file.suffix + f".bak.{datetime.now().strftime('%Y%m%d-%H%M%S')}")
shutil.copy2(file, backup)

old = """            {autoMode && (
              <div style={{ color: "#94a3b8", fontSize: "12px" }}>
                Auto-roll controls come next.
              </div>
            )}"""

new = """            {autoMode && (
              <div
                style={{
                  display: "grid",
                  gap: "8px",
                  marginTop: "4px",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
                    gap: "8px",
                  }}
                >
                  <div>
                    <div style={{ color: "#94a3b8", fontSize: "11px", marginBottom: "4px" }}>
                      Rolls
                    </div>
                    <input
                      type="number"
                      min="1"
                      value={autoRollCount}
                      onChange={(e) => setAutoRollCount(Number(e.target.value))}
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

                  <div>
                    <div style={{ color: "#94a3b8", fontSize: "11px", marginBottom: "4px" }}>
                      Stop on Profit
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={stopOnProfit}
                      onChange={(e) => setStopOnProfit(e.target.value)}
                      placeholder="optional"
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

                  <div>
                    <div style={{ color: "#94a3b8", fontSize: "11px", marginBottom: "4px" }}>
                      Stop on Loss
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={stopOnLoss}
                      onChange={(e) => setStopOnLoss(e.target.value)}
                      placeholder="optional"
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
                </div>

                <button
                  onClick={handleAutoRoll}
                  disabled={rolling && !autoRolling}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: autoRolling ? "#ef4444" : "#0ea5e9",
                    border: "none",
                    borderRadius: "12px",
                    fontWeight: 700,
                    fontSize: "14px",
                    color: "#fff",
                    cursor: rolling && !autoRolling ? "not-allowed" : "pointer",
                    opacity: rolling && !autoRolling ? 0.7 : 1,
                  }}
                >
                  {autoRolling ? "Stop Auto Roll" : "Start Auto Roll"}
                </button>

                <div style={{ color: "#94a3b8", fontSize: "11px" }}>
                  Runs up to {autoRollCount || 0} rolls and stops early if profit/loss target is hit.
                </div>
              </div>
            )}"""

if old not in src:
    print("Could not find the placeholder auto-roll block.")
    print(f"Backup saved to: {backup}")
    sys.exit(1)

src = src.replace(old, new, 1)

file.write_text(src)

print(f"Finished auto-roll panel in: {file}")
print(f"Backup saved to: {backup}")
