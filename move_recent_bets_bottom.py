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
idx = src.find(anchor)
if idx == -1:
    print("Recent Bets block not found.")
    print(f"Backup: {backup}")
    sys.exit(1)

# find opening <div ...> that wraps the Recent Bets section
start = src.rfind("<div", 0, idx)
if start == -1:
    print("Could not find opening <div for Recent Bets block.")
    print(f"Backup: {backup}")
    sys.exit(1)

# walk forward and capture the whole balanced <div>...</div> block
pos = start
depth = 0
end = None

tag_re = re.compile(r"</?div\b[^>]*>")

for m in tag_re.finditer(src, start):
    tag = m.group(0)
    if tag.startswith("</div"):
        depth -= 1
        if depth == 0:
            end = m.end()
            break
    else:
        depth += 1

if end is None:
    print("Could not determine end of Recent Bets block.")
    print(f"Backup: {backup}")
    sys.exit(1)

block = src[start:end]

# remove the block from current location
src_wo = src[:start] + src[end:]

# insert before the final main return closing block: the last line that starts with </div>
matches = list(re.finditer(r'^\s*</div>\s*$', src_wo, re.MULTILINE))
if not matches:
    print("Could not find a safe insertion point near bottom.")
    print(f"Backup: {backup}")
    sys.exit(1)

insert_at = matches[-1].start()
src_new = src_wo[:insert_at].rstrip() + "\n\n" + block + "\n" + src_wo[insert_at:]

file.write_text(src_new)

print(f"Moved Recent Bets block to bottom in: {file}")
print(f"Backup saved to: {backup}")
