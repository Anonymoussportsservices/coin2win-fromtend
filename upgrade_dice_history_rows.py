from pathlib import Path
from datetime import datetime
import shutil
import sys

file = Path("/var/www/coin2win-ui/components/DiceGame.tsx")
src = file.read_text()

backup = file.with_suffix(file.suffix + f".bak.{datetime.now().strftime('%Y%m%d-%H%M%S')}")
shutil.copy2(file, backup)

# 1) add time formatter helper
old = '''function formatNum(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
}
'''
new = '''function formatNum(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
}

function formatTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "--:--";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
'''
if old not in src:
    print("Could not find formatNum helper.")
    print(f"Backup: {backup}")
    sys.exit(1)
src = src.replace(old, new, 1)

# 2) replace recent bets row UI
old = '''              {visibleRecentBets.map((bet) => (
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
              ))}'''

new = '''              {visibleRecentBets.map((bet) => (
                <div
                  key={bet.id}
                  className="rounded-lg bg-black/20 px-3 py-3 text-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-md px-2 py-1 text-[11px] font-bold ${
                          bet.win
                            ? "bg-green-500/15 text-green-400"
                            : "bg-red-500/15 text-red-400"
                        }`}
                      >
                        {bet.win ? "WIN" : "LOSE"}
                      </span>
                      <span className="text-white/80">
                        {bet.condition === "over" ? "Over" : "Under"} {bet.target}
                      </span>
                    </div>

                    <span className="text-xs text-white/45">
                      {formatTime(bet.createdAt)}
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
                    <div className="rounded-md bg-white/5 px-2 py-2">
                      <div className="text-[11px] text-white/45">Bet</div>
                      <div className="font-semibold text-white/85">
                        ${formatNum(Number(bet.amount))}
                      </div>
                    </div>

                    <div className="rounded-md bg-white/5 px-2 py-2">
                      <div className="text-[11px] text-white/45">Roll</div>
                      <div className="font-semibold text-white/85">
                        {formatNum(Number(bet.roll))}
                      </div>
                    </div>

                    <div className="rounded-md bg-white/5 px-2 py-2">
                      <div className="text-[11px] text-white/45">Payout</div>
                      <div className="font-semibold text-white/85">
                        ${formatNum(Number(bet.payout ?? 0))}
                      </div>
                    </div>

                    <div className="rounded-md bg-white/5 px-2 py-2">
                      <div className="text-[11px] text-white/45">Profit</div>
                      <div
                        className={`font-semibold ${
                          Number(bet.profit) >= 0 ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {Number(bet.profit) > 0 ? "+" : ""}
                        ${formatNum(Number(bet.profit))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}'''

if old not in src:
    print("Could not find visibleRecentBets row block.")
    print(f"Backup: {backup}")
    sys.exit(1)

src = src.replace(old, new, 1)

file.write_text(src)
print(f"Patched: {file}")
print(f"Backup:  {backup}")
