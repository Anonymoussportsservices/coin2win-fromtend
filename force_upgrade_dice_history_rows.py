from pathlib import Path
from datetime import datetime
import shutil
import re
import sys

file = Path("/var/www/coin2win-ui/components/DiceGame.tsx")
src = file.read_text()

backup = file.with_suffix(file.suffix + f".bak.{datetime.now().strftime('%Y%m%d-%H%M%S')}")
shutil.copy2(file, backup)

# 1) add formatTime helper if missing
if "function formatTime(value: string)" not in src:
    pattern = r'function formatNum\(value: number\) \{\s*return Number\.isFinite\(value\) \? value\.toFixed\(2\) : "0\.00";\s*\}'
    repl = '''function formatNum(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
}

function formatTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "--:--";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}'''
    src, count = re.subn(pattern, repl, src, count=1)
    if count != 1:
        print("Could not insert formatTime helper.")
        print(f"Backup: {backup}")
        sys.exit(1)

# 2) replace visibleRecentBets block
pattern = re.compile(
    r'\{visibleRecentBets\.map\(\(bet\)\s*=>\s*\(\s*<div.*?<\/div>\s*\)\)\}',
    re.DOTALL
)

replacement = '''{visibleRecentBets.map((bet) => (
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

src, count = pattern.subn(replacement, src, count=1)
if count != 1:
    print("Could not replace visibleRecentBets map block.")
    print(f"Backup: {backup}")
    sys.exit(1)

file.write_text(src)
print(f"Patched: {file}")
print(f"Backup:  {backup}")
