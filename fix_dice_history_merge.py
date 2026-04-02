from pathlib import Path
from datetime import datetime
import shutil
import sys

file = Path("/var/www/coin2win-ui/components/DiceGame.tsx")
src = file.read_text()

backup = file.with_suffix(file.suffix + f".bak.{datetime.now().strftime('%Y%m%d-%H%M%S')}")
shutil.copy2(file, backup)

old = "setRecentBets(mapped);"

new = """setRecentBets((prev) => {
          const combined = [...mapped, ...prev];

          const seen = new Set();
          const deduped = [];

          for (const bet of combined) {
            if (!bet?.id || seen.has(bet.id)) continue;
            seen.add(bet.id);
            deduped.push(bet);
          }

          return deduped.slice(0, 50);
        });"""

if old not in src:
    print("Could not find setRecentBets(mapped)")
    print(f"Backup: {backup}")
    sys.exit(1)

src = src.replace(old, new, 1)

file.write_text(src)
print(f"Patched: {file}")
print(f"Backup:  {backup}")
