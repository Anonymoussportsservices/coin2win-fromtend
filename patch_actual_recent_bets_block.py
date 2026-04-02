from pathlib import Path
from datetime import datetime
import shutil
import re
import sys

file = Path("/var/www/coin2win-ui/components/DiceGame.tsx")
src = file.read_text()

backup = file.with_suffix(file.suffix + f".bak.{datetime.now().strftime('%Y%m%d-%H%M%S')}")
shutil.copy2(file, backup)

if "const [showAllRecentBets, setShowAllRecentBets] = useState(false);" not in src:
    src = src.replace(
        '  const [recentBets, setRecentBets] = useState<any[]>([]);',
        '  const [recentBets, setRecentBets] = useState<any[]>([]);\n'
        '  const [showAllRecentBets, setShowAllRecentBets] = useState(false);',
        1,
    )

if "const visibleRecentBets = showAllRecentBets ? recentBets : recentBets.slice(0, 10);" not in src:
    src = src.replace(
        '  const canRoll = !!user?.user_id && Number(bet) > 0;\n',
        '  const canRoll = !!user?.user_id && Number(bet) > 0;\n'
        '  const visibleRecentBets = showAllRecentBets ? recentBets : recentBets.slice(0, 10);\n',
        1,
    )

if "function formatTime(value: string)" not in src:
    src = src.replace(
        'function formatNum(value: number) {\n  return Number.isFinite(value) ? value.toFixed(2) : "0.00";\n}\n',
        'function formatNum(value: number) {\n  return Number.isFinite(value) ? value.toFixed(2) : "0.00";\n}\n\n'
        'function formatTime(value: string) {\n'
        '  const d = new Date(value);\n'
        '  if (Number.isNaN(d.getTime())) return "--:--";\n'
        '  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });\n'
        '}\n',
        1,
    )

src = src.replace(
    'setRecentBets((prev) => [item, ...prev].slice(0, 12));',
    'setRecentBets((prev) => [item, ...prev].slice(0, 50));'
)

pattern = re.compile(
    r'''<div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">\s*
\s*<div className="mb-3 flex items-center justify-between">\s*
\s*<h3 className="text-sm font-semibold text-white">Recent Bets</h3>\s*
\s*<span className="text-xs text-white/50">\{recentBets\.length\} shown</span>\s*
\s*</div>\s*
\s*\{recentBets\.length === 0 \? \(\s*
\s*<div className="text-sm text-white/50">No recent bets yet\.</div>\s*
\s*\) : \(\s*
\s*<div className="space-y-2">\s*
\s*\{recentBets\.map\(\(bet\) => \(\s*
.*?
\s*\)\)\}\s*
\s*</div>\s*
\s*\)\}\s*
\s*</div>''',
    re.DOTALL
)

replacement = '''<div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Recent Bets</h3>
          <span className="text-xs text-white/50">{visibleRecentBets.length}/{recentBets.length} shown</span>
        </div>

        {recentBets.length === 0 ? (
          <div className="text-sm text-white/50">No recent bets yet.</div>
        ) : (
          <div className="space-y-2">
            {visibleRecentBets.map((bet) => (
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
            ))}
          </div>
        )}

        {recentBets.length > 10 ? (
          <div className="mt-3 flex justify-center">
            <button
              onClick={() => setShowAllRecentBets((prev) => !prev)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10"
            >
              {showAllRecentBets ? "Show Last 10" : `Show ${recentBets.length - 10} Older Bets`}
            </button>
          </div>
        ) : null}
      </div>'''

new_src, count = pattern.subn(replacement, src, count=1)
if count != 1:
    print("Could not replace the actual Recent Bets block.")
    print(f"Backup: {backup}")
    sys.exit(1)

file.write_text(new_src)
print(f"Patched: {file}")
print(f"Backup:  {backup}")
