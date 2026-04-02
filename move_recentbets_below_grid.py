from pathlib import Path
from datetime import datetime
import shutil
import sys

file = Path("/var/www/coin2win-ui/components/DiceGame.tsx")
src = file.read_text()

backup = file.with_suffix(file.suffix + f".bak.{datetime.now().strftime('%Y%m%d-%H%M%S')}")
shutil.copy2(file, backup)

old = """        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">"""
new = """        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">"""

if old not in src:
    print("Could not find the exact opening spot for Recent Bets.")
    print(f"Backup saved to: {backup}")
    sys.exit(1)

src = src.replace(old, new, 1)

old2 = """        </div>
      </div>
    </div>
  );"""
new2 = """        </div>
    </div>
  );"""

if old2 not in src:
    print("Could not find the exact closing spot for Recent Bets.")
    print(f"Backup saved to: {backup}")
    sys.exit(1)

src = src.replace(old2, new2, 1)

file.write_text(src)

print(f"Moved Recent Bets below grid in: {file}")
print(f"Backup saved to: {backup}")
