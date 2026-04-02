from pathlib import Path
from datetime import datetime
import shutil
import sys

file = Path("/var/www/coin2win-ui/components/DiceGame.tsx")
src = file.read_text()

backup = file.with_suffix(file.suffix + f".bak.{datetime.now().strftime('%Y%m%d-%H%M%S')}")
shutil.copy2(file, backup)

# 1) helper
old = '''function shortHash(value: string | undefined | null, size: number = 10) {
  const v = String(value || "").trim();
  if (!v) return "—";
  if (v.length <= size * 2) return v;
  return `${v.slice(0, size)}...${v.slice(-size)}`;
}
'''
new = '''function shortHash(value: string | undefined | null, size: number = 10) {
  const v = String(value || "").trim();
  if (!v) return "—";
  if (v.length <= size * 2) return v;
  return `${v.slice(0, size)}...${v.slice(-size)}`;
}

function buildProfitPath(items: any[]) {
  if (!items.length) return "";

  const points = [];
  let running = 0;
  for (let i = items.length - 1; i >= 0; i--) {
    running += Number(items[i]?.profit || 0);
    points.push(running);
  }

  const min = Math.min(...points, 0);
  const max = Math.max(...points, 0);
  const range = max - min || 1;

  return points
    .map((value, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}
'''
if old not in src:
    print("Could not find shortHash helper.")
    print(f"Backup: {backup}")
    sys.exit(1)
src = src.replace(old, new, 1)

# 2) derived constants
anchor = '  const visibleRecentBets = showAllRecentBets ? recentBets : recentBets.slice(0, 10);'
insert = '''  const bigWinThreshold = 5;
  const profitChartPath = buildProfitPath(recentBets.slice(0, 20));
'''
if anchor in src and "const bigWinThreshold = 5;" not in src:
    src = src.replace(anchor, anchor + "\n" + insert, 1)

# 3) chart panel before recent bets
old = '''      <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Recent Bets</h3>'''
new = '''      <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Session Profit Chart</h3>
          <span className="text-xs text-white/50">Last {Math.min(recentBets.length, 20)} bets</span>
        </div>

        {recentBets.length === 0 ? (
          <div className="text-sm text-white/50">No chart data yet.</div>
        ) : (
          <div className="rounded-lg bg-black/20 p-3">
            <svg viewBox="0 0 100 100" className="h-32 w-full">
              <path
                d={profitChartPath}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-green-400"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <div className="mt-2 flex items-center justify-between text-xs text-white/45">
              <span>Start</span>
              <span>Current P/L: {sessionProfit > 0 ? "+" : ""}${formatNum(sessionProfit)}</span>
              <span>Now</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Recent Bets</h3>'''
if old not in src:
    print("Could not find Recent Bets panel start.")
    print(f"Backup: {backup}")
    sys.exit(1)
src = src.replace(old, new, 1)

# 4) add big win badge
old = '''                      <span
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
                      </span>'''
new = '''                      <span
                        className={`rounded-md px-2 py-1 text-[11px] font-bold ${
                          bet.win
                            ? "bg-green-500/15 text-green-400"
                            : "bg-red-500/15 text-red-400"
                        }`}
                      >
                        {bet.win ? "WIN" : "LOSE"}
                      </span>
                      {Number(bet.profit) >= bigWinThreshold ? (
                        <span className="rounded-md bg-yellow-500/15 px-2 py-1 text-[11px] font-bold text-yellow-300">
                          BIG WIN
                        </span>
                      ) : null}
                      <span className="text-white/80">
                        {bet.condition === "over" ? "Over" : "Under"} {bet.target}
                      </span>'''
if old not in src:
    print("Could not find bet badge block.")
    print(f"Backup: {backup}")
    sys.exit(1)
src = src.replace(old, new, 1)

file.write_text(src)
print(f"Patched: {file}")
print(f"Backup:  {backup}")
