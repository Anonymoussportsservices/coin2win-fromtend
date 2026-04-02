from pathlib import Path
from datetime import datetime
import shutil
import sys

file = Path("/var/www/coin2win-ui/components/DiceGame.tsx")
src = file.read_text()

backup = file.with_suffix(file.suffix + f".bak.{datetime.now().strftime('%Y%m%d-%H%M%S')}")
shutil.copy2(file, backup)

old = '''    const item = {
      id: rollResult?.id || `${Date.now()}-${Math.random()}`,
      createdAt: rollResult?.createdAt || new Date().toISOString(),
      amount,
      payout,
      profit,
      roll,
      target: betTarget,
      condition: betCondition,
      win: didWin,
    };'''

new = '''    const item = {
      id: rollResult?.id || rollResult?.bet_id || `${Date.now()}-${Math.random()}`,
      createdAt: rollResult?.createdAt || new Date().toISOString(),
      amount,
      payout,
      profit,
      roll,
      target: betTarget,
      condition: betCondition,
      win: didWin,
      nonce: rollResult?.nonce ?? null,
      server_seed_hash: rollResult?.server_seed_hash ?? null,
      client_seed: rollResult?.client_seed ?? null,
    };'''

if old not in src:
    print("Could not find appendRecentBet item block.")
    print(f"Backup: {backup}")
    sys.exit(1)

src = src.replace(old, new, 1)

file.write_text(src)
print(f"Patched: {file}")
print(f"Backup:  {backup}")
