from pathlib import Path
import shutil
from datetime import datetime

file = Path("/var/www/coin2win-ui/components/DiceGame.tsx")
src = file.read_text()

backup = file.with_suffix(file.suffix + f".bak.{datetime.now().strftime('%Y%m%d-%H%M%S')}")
shutil.copy2(file, backup)

# Remove invalid fallback refs to betAmount in recent bet / profit logic
src = src.replace(
    "amount: Number(rollResult?.amount ?? betAmount ?? 0),",
    "amount: Number(rollResult?.amount ?? 0),"
)

src = src.replace(
    "(Number(rollResult?.payout ?? 0) - Number(rollResult?.amount ?? betAmount ?? 0))",
    "(Number(rollResult?.payout ?? 0) - Number(rollResult?.amount ?? 0))"
)

src = src.replace(
    "(Number(data?.payout ?? 0) - Number(data?.amount ?? betAmount ?? 0))",
    "(Number(data?.payout ?? 0) - Number(data?.amount ?? 0))"
)

src = src.replace(
    "(Number(result?.payout ?? 0) - Number(result?.amount ?? betAmount ?? 0))",
    "(Number(result?.payout ?? 0) - Number(result?.amount ?? 0))"
)

file.write_text(src)

print(f"Fixed betAmount references in: {file}")
print(f"Backup saved to: {backup}")
