from pathlib import Path
from datetime import datetime
import shutil
import re
import sys

file = Path("/var/www/coin2win-ui/components/DiceGame.tsx")
src = file.read_text()

backup = file.with_suffix(file.suffix + f".bak.{datetime.now().strftime('%Y%m%d-%H%M%S')}")
shutil.copy2(file, backup)

# 1) Rebuild the bottom of DiceGame render cleanly
render_pattern = re.compile(
    r'''
(?P<prefix>\{\s*error\s*\?\s*\(
.*?
\)\s*:\s*null\}
)
.*?
(?=\n\}\n\nfunction\s+Stat)
''',
    re.DOTALL | re.VERBOSE,
)

render_replacement = r'''\g<prefix>
        </div>

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
      </div>
    </div>
  );
'''

new_src, count = render_pattern.subn(render_replacement, src, count=1)
if count != 1:
    print("Could not safely rebuild DiceGame bottom render block.")
    print(f"Backup saved to: {backup}")
    sys.exit(1)

src = new_src

# 2) Replace broken Stat() function with a clean one
stat_pattern = re.compile(
    r'''
function\s+Stat\s*\(\{\s*label,\s*value\s*\}:\s*\{\s*label:\s*string;\s*value:\s*string\s*\}\)\s*\{
.*?
\}
\s*
const\s+smallButtonStyle
''',
    re.DOTALL | re.VERBOSE,
)

stat_replacement = '''function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        flex: "1 1 92px",
        minWidth: "92px",
        background: "#020617",
        border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: "10px",
        padding: "8px 10px",
      }}
    >
      <div style={{ color: "#94a3b8", fontSize: "10px", marginBottom: "4px" }}>
        {label}
      </div>
      <div style={{ fontSize: "14px", fontWeight: 800 }}>{value}</div>
    </div>
  );
}

const smallButtonStyle'''

new_src, count = stat_pattern.subn(stat_replacement, src, count=1)
if count != 1:
    print("Could not safely rebuild Stat() function.")
    print(f"Backup saved to: {backup}")
    sys.exit(1)

src = new_src

file.write_text(src)

print(f"Fixed DiceGame Recent Bets + Stat() in: {file}")
print(f"Backup saved to: {backup}")
