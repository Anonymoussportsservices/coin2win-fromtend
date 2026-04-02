from pathlib import Path
from datetime import datetime
import shutil
import sys

file = Path("/var/www/coin2win-ui/components/DiceGame.tsx")
src = file.read_text()

backup = file.with_suffix(file.suffix + f".bak.{datetime.now().strftime('%Y%m%d-%H%M%S')}")
shutil.copy2(file, backup)

# 1) add collapse state + visible bets helper
old = '  const [recentBets, setRecentBets] = useState<any[]>([]);\n  const autoRollStopRef = useRef(false);'
new = '''  const [recentBets, setRecentBets] = useState<any[]>([]);
  const [showAllRecentBets, setShowAllRecentBets] = useState(false);
  const autoRollStopRef = useRef(false);
  const visibleRecentBets = showAllRecentBets ? recentBets : recentBets.slice(0, 10);'''
if old not in src:
    print("Could not find recentBets state block.")
    print(f"Backup: {backup}")
    sys.exit(1)
src = src.replace(old, new, 1)

# 2) keep more history in memory
old = '    setRecentBets((prev) => [item, ...prev].slice(0, 12));'
new = '    setRecentBets((prev) => [item, ...prev].slice(0, 50));'
if old not in src:
    print("Could not find recent bet slice line.")
    print(f"Backup: {backup}")
    sys.exit(1)
src = src.replace(old, new, 1)

# 3) update count text
old = '<span className="text-xs text-white/50">{recentBets.length} shown</span>'
new = '<span className="text-xs text-white/50">{visibleRecentBets.length}/{recentBets.length} shown</span>'
if old not in src:
    print("Could not find recent bets count text.")
    print(f"Backup: {backup}")
    sys.exit(1)
src = src.replace(old, new, 1)

# 4) render visibleRecentBets instead of all
old = '{recentBets.map((bet) => ('
new = '{visibleRecentBets.map((bet) => ('
if old not in src:
    print("Could not find recentBets map block.")
    print(f"Backup: {backup}")
    sys.exit(1)
src = src.replace(old, new, 1)

# 5) add collapse button under the list
old = '''          </div>
        )}
      </div>'''
new = '''          </div>
        )}

        {recentBets.length > 10 ? (
          <div className="mt-3 flex justify-center">
            <button
              onClick={() => setShowAllRecentBets((prev) => !prev)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10"
            >
              {showAllRecentBets
                ? "Show Last 10"
                : `Show ${recentBets.length - 10} Older Bets`}
            </button>
          </div>
        ) : null}
      </div>'''
if old not in src:
    print("Could not find Recent Bets closing block.")
    print(f"Backup: {backup}")
    sys.exit(1)
src = src.replace(old, new, 1)

file.write_text(src)
print(f"Patched: {file}")
print(f"Backup:  {backup}")
