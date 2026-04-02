from pathlib import Path
from datetime import datetime
import shutil
import re
import sys

file = Path("/var/www/coin2win-ui/components/DiceGame.tsx")
src = file.read_text()

backup = file.with_suffix(file.suffix + f".bak.{datetime.now().strftime('%Y%m%d-%H%M%S')}")
shutil.copy2(file, backup)

anchor = '<h3 className="text-sm font-semibold text-white">Recent Bets</h3>'

def remove_recent_bets_blocks(text: str) -> str:
    while True:
        idx = text.find(anchor)
        if idx == -1:
            break

        start = text.rfind("<div", 0, idx)
        if start == -1:
            break

        depth = 0
        end = None
        for m in re.finditer(r"</?div\b[^>]*>", text[start:]):
            tag = m.group(0)
            abs_start = start + m.start()
            abs_end = start + m.end()

            if tag.startswith("</div"):
                depth -= 1
                if depth == 0:
                    end = abs_end
                    break
            else:
                depth += 1

        if end is None:
            break

        text = text[:start] + text[end:]

    return text

src = remove_recent_bets_blocks(src)

recent_bets_block = """
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

# Find the component's final return block ending
ret_idx = src.rfind("return (")
end_idx = src.rfind("\n  );")

if ret_idx == -1 or end_idx == -1 or end_idx < ret_idx:
    print("Could not find safe component return boundaries.")
    print(f"Backup: {backup}")
    sys.exit(1)

# Insert before the last closing </div> inside the main return
return_chunk = src[ret_idx:end_idx]
matches = list(re.finditer(r'^\s*</div>\s*$', return_chunk, re.MULTILINE))

if not matches:
    print("Could not find insertion point inside return block.")
    print(f"Backup: {backup}")
    sys.exit(1)

insert_at = ret_idx + matches[-1].start()

src = src[:insert_at].rstrip() + "\n\n" + recent_bets_block + "\n" + src[insert_at:]

file.write_text(src)

print(f"Fixed Recent Bets position in: {file}")
print(f"Backup saved to: {backup}")
