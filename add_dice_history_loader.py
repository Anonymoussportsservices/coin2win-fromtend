from pathlib import Path
from datetime import datetime
import shutil
import sys

file = Path("/var/www/coin2win-ui/components/DiceGame.tsx")
src = file.read_text()

backup = file.with_suffix(file.suffix + f".bak.{datetime.now().strftime('%Y%m%d-%H%M%S')}")
shutil.copy2(file, backup)

insert_after = "const visibleRecentBets = showAllRecentBets ? recentBets : recentBets.slice(0, 10);"

if insert_after not in src:
    print("Could not find insertion point.")
    print(f"Backup: {backup}")
    sys.exit(1)

new_code = insert_after + '''

  useEffect(() => {
    async function loadHistory() {
      try {
        if (!user?.user_id) return;

        const res = await fetch(`/studio/dice/bets/${user.user_id}`);
        const data = await res.json().catch(() => ({}));

        if (!res.ok) return;

        const mapped = (data?.bets || []).map((b: any) => ({
          id: b.id,
          createdAt: b.created_at || new Date().toISOString(),
          amount: b.amount_usd,
          payout: b.payout,
          profit: (b.payout || 0) - (b.amount_usd || 0),
          roll: b.roll,
          target: b.target,
          condition: b.condition,
          win: b.win,
          nonce: b.nonce,
          server_seed_hash: b.server_seed_hash,
          client_seed: b.client_seed,
        }));

        setRecentBets(mapped);
      } catch {}
    }

    loadHistory();
  }, [user?.user_id]);
'''

src = src.replace(insert_after, new_code, 1)

file.write_text(src)
print(f"Patched: {file}")
print(f"Backup:  {backup}")

