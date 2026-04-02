from pathlib import Path
from datetime import datetime
import shutil
import re

file = Path("/var/www/coin2win-ui/components/DiceGame.tsx")
src = file.read_text()

backup = file.with_suffix(file.suffix + f".bak.{datetime.now().strftime('%Y%m%d-%H%M%S')}")
shutil.copy2(file, backup)

pattern = re.compile(
    r'export default function DiceGame\(\) \{.*?const chance = useMemo\(\(\) => \{',
    re.DOTALL
)

replacement = '''export default function DiceGame() {
  const [bet, setBet] = useState(1);
  const [target, setTarget] = useState(50);
  const [condition, setCondition] = useState<RollCondition>("under");

  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [win, setWin] = useState<boolean | null>(null);
  const [sessionProfit, setSessionProfit] = useState(0);
  const [error, setError] = useState("");
  const [autoMode, setAutoMode] = useState(false);
  const [showAutoPanel, setShowAutoPanel] = useState(false);
  const [autoRollEnabled, setAutoRollEnabled] = useState(false);
  const [autoRolling, setAutoRolling] = useState(false);
  const [autoRollCount, setAutoRollCount] = useState(10);
  const [stopOnProfit, setStopOnProfit] = useState("");
  const [stopOnLoss, setStopOnLoss] = useState("");
  const [recentBets, setRecentBets] = useState<any[]>([]);
  const autoRollStopRef = useRef(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    return () => {
      autoRollStopRef.current = true;
    };
  }, []);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const appendRecentBet = (rollResult: any) => {
    const amount = Number(rollResult?.amount ?? bet ?? 0);
    const payout = Number(rollResult?.payout ?? 0);
    const profit = Number(rollResult?.profit ?? (payout - amount));
    const roll = Number(rollResult?.roll ?? rollResult?.result ?? 0);
    const betTarget = Number(rollResult?.target ?? target ?? 0);
    const betCondition = (rollResult?.condition ?? condition) as RollCondition;
    const didWin = Boolean(
      rollResult?.win ??
      rollResult?.isWin ??
      (profit > 0)
    );

    const item = {
      id: rollResult?.id || `${Date.now()}-${Math.random()}`,
      createdAt: rollResult?.createdAt || new Date().toISOString(),
      amount,
      payout,
      profit,
      roll,
      target: betTarget,
      condition: betCondition,
      win: didWin,
    };

    setRecentBets((prev) => [item, ...prev].slice(0, 12));
  };

  const executeRoll = async () => {
    if (rolling) return null;

    setRolling(true);
    setError("");

    try {
      const res = await fetch("/api/dice/roll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number(bet),
          target: Number(target),
          condition,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.detail || data?.error || "Roll failed");
      }

      const rollValue = Number(data?.roll ?? data?.result ?? 0);
      const payout = Number(data?.payout ?? 0);
      const amount = Number(data?.amount ?? bet ?? 0);
      const profit = Number(data?.profit ?? (payout - amount));
      const didWin = Boolean(
        data?.win ??
        data?.isWin ??
        (profit > 0)
      );

      setResult(rollValue);
      setWin(didWin);
      setSessionProfit((prev) => round2(prev + profit));
      appendRecentBet({
        ...data,
        amount,
        profit,
        roll: rollValue,
        target,
        condition,
        win: didWin,
      });

      return {
        ...data,
        amount,
        profit,
        roll: rollValue,
        target,
        condition,
        win: didWin,
      };
    } catch (err: any) {
      setError(err?.message || "Roll failed");
      console.error("Dice roll error:", err);
      return null;
    } finally {
      setRolling(false);
    }
  };

  const handleRoll = async () => {
    await executeRoll();
  };

  const handleAutoRoll = async () => {
    if (autoRolling) {
      autoRollStopRef.current = true;
      setAutoRolling(false);
      return;
    }

    autoRollStopRef.current = false;
    setAutoRolling(true);

    let totalProfit = 0;
    const maxRolls = Math.max(1, Number(autoRollCount || 0));
    const profitStop = stopOnProfit === "" ? null : Number(stopOnProfit);
    const lossStop = stopOnLoss === "" ? null : Number(stopOnLoss);

    try {
      for (let i = 0; i < maxRolls; i++) {
        if (autoRollStopRef.current) break;

        const rollData = await executeRoll();
        if (!rollData) break;

        const profit = Number(rollData?.profit ?? 0);
        totalProfit += profit;

        if (profitStop !== null && totalProfit >= profitStop) break;
        if (lossStop !== null && totalProfit <= -Math.abs(lossStop)) break;

        await sleep(650);
      }
    } finally {
      setAutoRolling(false);
      autoRollStopRef.current = false;
    }
  };

  const chance = useMemo(() => {'''

new_src, count = pattern.subn(replacement, src, count=1)

if count != 1:
    raise SystemExit("Could not find the broken top block to replace cleanly.")

file.write_text(new_src)

print(f"Repaired: {file}")
print(f"Backup:   {backup}")
