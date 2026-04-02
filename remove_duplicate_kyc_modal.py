from pathlib import Path
import re

path = Path("/var/www/coin2win-ui/app/cashier/page.tsx")
text = path.read_text()

matches = list(re.finditer(r'        \{showKycModal && \([\s\S]*?\n        \)\}', text))
if len(matches) <= 1:
    print("No duplicate modal found.")
    raise SystemExit(0)

# keep first, remove the rest
first = matches[0]
new_text = text[:first.end()]
last_end = first.end()
for m in matches[1:]:
    new_text += text[last_end:m.start()]
    last_end = m.end()
new_text += text[last_end:]

path.write_text(new_text)
print(f"Removed {len(matches)-1} duplicate modal block(s).")
