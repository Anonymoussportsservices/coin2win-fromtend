from pathlib import Path
from datetime import datetime
import shutil

file = Path("/var/www/coin2win-ui/components/DiceGame.tsx")
src = file.read_text()

backup = file.with_suffix(file.suffix + f".bak.{datetime.now().strftime('%Y%m%d-%H%M%S')}")
shutil.copy2(file, backup)

src = src.replace(
    'fetch(`/studio/dice/bets/${user.user_id}`)',
    'fetch(`/api/studio/dice/bets/${user.user_id}`)'
)

file.write_text(src)
print(f"Patched: {file}")
print(f"Backup:  {backup}")
