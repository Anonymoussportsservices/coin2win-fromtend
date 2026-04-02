from pathlib import Path
from datetime import datetime
import shutil
import re
import sys

file = Path("/var/www/coin2win-ui/components/DiceGame.tsx")
src = file.read_text()

backup = file.with_suffix(file.suffix + f".bak.{datetime.now().strftime('%Y%m%d-%H%M%S')}")
shutil.copy2(file, backup)

# 1) add canRoll helper after state block
anchor = '  const [isMobile, setIsMobile] = useState(false);'
insert = '''  const canRoll = !!user?.user_id && Number(bet) > 0;
  const rollDisabledReason = !user?.user_id
    ? "Please log in to play."
    : Number(bet) <= 0
    ? "Enter a valid bet amount."
    : "";
'''
if anchor in src and "const canRoll =" not in src:
    src = src.replace(anchor, anchor + "\n" + insert, 1)

# 2) improve executeRoll guards
src = src.replace(
'''    if (!user?.user_id) {
      setError("User not found. Please log in again.");
      return null;
    }''',
'''    if (!user?.user_id) {
      setError("Please log in to play.");
      return null;
    }'''
)

src = src.replace(
'''    if (!bet || bet <= 0) {
      setError("Enter a valid bet amount.");
      return null;
    }''',
'''    if (!bet || bet <= 0) {
      setError("Enter a valid bet amount.");
      return null;
    }'''
)

# 3) dispatch wallet refresh after successful roll
old = '''      setResult(Number(rollValue.toFixed(2)));
      setWin(didWin);
      setSessionProfit((prev) => round2(prev + profit));

      appendRecentBet({'''
new = '''      setResult(Number(rollValue.toFixed(2)));
      setWin(didWin);
      setSessionProfit((prev) => round2(prev + profit));
      window.dispatchEvent(new Event("coin2win-auth-changed"));

      appendRecentBet({'''
if old in src and 'window.dispatchEvent(new Event("coin2win-auth-changed"));' not in src:
    src = src.replace(old, new, 1)

# 4) disable manual roll button correctly
src = src.replace(
'''              onClick={executeRoll}
              disabled={rolling}''',
'''              onClick={executeRoll}
              disabled={!canRoll || rolling || autoRolling}'''
)

src = src.replace(
'''                cursor: rolling ? "not-allowed" : "pointer",
                opacity: rolling ? 0.7 : 1,''',
'''                cursor: !canRoll || rolling || autoRolling ? "not-allowed" : "pointer",
                opacity: !canRoll || rolling || autoRolling ? 0.7 : 1,''',
)

src = src.replace(
'''              {rolling ? "Rolling..." : "Roll Dice"}''',
'''              {!user?.user_id ? "Login to Roll" : rolling ? "Rolling..." : "Roll Dice"}''',
)

# 5) disable auto-roll start when invalid
src = src.replace(
'''                  onClick={handleAutoRoll}
                  disabled={rolling && !autoRolling}''',
'''                  onClick={handleAutoRoll}
                  disabled={(!canRoll && !autoRolling) || (rolling && !autoRolling)}'''
)

src = src.replace(
'''                    cursor: rolling && !autoRolling ? "not-allowed" : "pointer",
                    opacity: rolling && !autoRolling ? 0.7 : 1,''',
'''                    cursor: ((!canRoll && !autoRolling) || (rolling && !autoRolling)) ? "not-allowed" : "pointer",
                    opacity: ((!canRoll && !autoRolling) || (rolling && !autoRolling)) ? 0.7 : 1,''',
)

# 6) show helper message under controls if invalid
old_block = '''          {error ? (
            <div
              style={{
                padding: "10px 12px",
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.35)",
                color: "#fecaca",
                borderRadius: "10px",
                fontSize: "13px",
              }}
            >
              {error}
            </div>
          ) : null}'''
new_block = '''          {!error && rollDisabledReason ? (
            <div
              style={{
                padding: "10px 12px",
                background: "rgba(148,163,184,0.10)",
                border: "1px solid rgba(148,163,184,0.20)",
                color: "#cbd5e1",
                borderRadius: "10px",
                fontSize: "13px",
              }}
            >
              {rollDisabledReason}
            </div>
          ) : null}

          {error ? (
            <div
              style={{
                padding: "10px 12px",
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.35)",
                color: "#fecaca",
                borderRadius: "10px",
                fontSize: "13px",
              }}
            >
              {error}
            </div>
          ) : null}'''
if old_block in src:
    src = src.replace(old_block, new_block, 1)

file.write_text(src)
print(f"Patched: {file}")
print(f"Backup:  {backup}")
