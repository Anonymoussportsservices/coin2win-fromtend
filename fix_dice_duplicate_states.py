from pathlib import Path
import re
import shutil
from datetime import datetime

file = Path("/var/www/coin2win-ui/components/DiceGame.tsx")
src = file.read_text()

backup = file.with_suffix(file.suffix + f".bak.{datetime.now().strftime('%Y%m%d-%H%M%S')}")
shutil.copy2(file, backup)

patterns = [
    r'^\s*const\s*\[\s*showAutoPanel\s*,\s*setShowAutoPanel\s*\]\s*=\s*useState\([^\n]*\)\s*;?\s*$',
    r'^\s*const\s*\[\s*autoRollEnabled\s*,\s*setAutoRollEnabled\s*\]\s*=\s*useState\([^\n]*\)\s*;?\s*$',
    r'^\s*const\s*\[\s*autoRolling\s*,\s*setAutoRolling\s*\]\s*=\s*useState\([^\n]*\)\s*;?\s*$',
    r'^\s*const\s*\[\s*autoRollCount\s*,\s*setAutoRollCount\s*\]\s*=\s*useState\([^\n]*\)\s*;?\s*$',
    r'^\s*const\s*\[\s*stopOnProfit\s*,\s*setStopOnProfit\s*\]\s*=\s*useState\([^\n]*\)\s*;?\s*$',
    r'^\s*const\s*\[\s*stopOnLoss\s*,\s*setStopOnLoss\s*\]\s*=\s*useState\([^\n]*\)\s*;?\s*$',
    r'^\s*const\s*\[\s*recentBets\s*,\s*setRecentBets\s*\]\s*=\s*useState<any\[\]>\([^\n]*\)\s*;?\s*$',
    r'^\s*const\s+autoRollStopRef\s*=\s*useRef\([^\n]*\)\s*;?\s*$',
]

lines = src.splitlines()
seen = {p: False for p in patterns}
out = []

for line in lines:
    matched = False
    for p in patterns:
        if re.match(p, line):
            matched = True
            if not seen[p]:
                seen[p] = True
                out.append(line)
            # else skip duplicate
            break
    if not matched:
        out.append(line)

src = "\n".join(out) + "\n"

file.write_text(src)

print(f"Fixed duplicate state definitions in: {file}")
print(f"Backup saved to: {backup}")
