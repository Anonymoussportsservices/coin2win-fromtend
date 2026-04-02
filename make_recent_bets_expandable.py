from pathlib import Path
from datetime import datetime
import shutil
import sys

file = Path("/var/www/coin2win-ui/components/DiceGame.tsx")
src = file.read_text()

backup = file.with_suffix(file.suffix + f".bak.{datetime.now().strftime('%Y%m%d-%H%M%S')}")
shutil.copy2(file, backup)

# 1) add expanded state
old = '  const [showAllRecentBets, setShowAllRecentBets] = useState(false);'
new = '''  const [showAllRecentBets, setShowAllRecentBets] = useState(false);
  const [expandedRecentBetId, setExpandedRecentBetId] = useState<string | number | null>(null);'''
if old not in src:
    print("Could not find showAllRecentBets state.")
    print(f"Backup: {backup}")
    sys.exit(1)
src = src.replace(old, new, 1)

# 2) replace card block with expandable version
old = '''              <div
                key={bet.id}
                className="rounded-lg bg-black/20 px-3 py-3 text-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-md px-2 py-1 text-[11px] font-bold ${
                        bet.win
                          ? "bg-green-500/15 text-green-400"
                          : "bg-red-500/15 text-red-400"
                      }`}
                    >
                      {bet.win ? "WIN" : "LOSE"}
                    </span>
                    <span className="text-white/85 font-semibold">
                      {bet.condition === "over" ? "Over" : "Under"} {bet.target}
                    </span>
                  </div>

                  <span className="text-xs text-white/45">
                    {formatTime(bet.createdAt)}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                  <div className="rounded-md bg-white/5 px-2 py-2">
                    <div className="text-[11px] text-white/45">Bet</div>
                    <div className="font-semibold text-white/85">
                      ${formatNum(Number(bet.amount))}
                    </div>
                  </div>

                  <div className="rounded-md bg-white/5 px-2 py-2">
                    <div className="text-[11px] text-white/45">Roll</div>
                    <div className="font-semibold text-white/85">
                      {formatNum(Number(bet.roll))}
                    </div>
                  </div>

                  <div className="rounded-md bg-white/5 px-2 py-2">
                    <div className="text-[11px] text-white/45">Payout</div>
                    <div className="font-semibold text-white/85">
                      ${formatNum(Number(bet.payout ?? 0))}
                    </div>
                  </div>

                  <div className="rounded-md bg-white/5 px-2 py-2">
                    <div className="text-[11px] text-white/45">Profit</div>
                    <div
                      className={`font-semibold ${
                        Number(bet.profit) >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {Number(bet.profit) > 0 ? "+" : ""}
                      ${formatNum(Number(bet.profit))}
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  <div className="rounded-md border border-white/5 bg-white/5 px-2 py-2">
                    <div className="text-[11px] text-white/45">Nonce</div>
                    <div className="font-mono text-[12px] text-white/80">
                      {bet.nonce ?? "—"}
                    </div>
                  </div>

                  <div className="rounded-md border border-white/5 bg-white/5 px-2 py-2 md:col-span-2">
                    <div className="text-[11px] text-white/45">Server Seed Hash</div>
                    <div className="font-mono text-[12px] text-white/80 break-all">
                      {shortHash(bet.server_seed_hash)}
                    </div>
                  </div>
                </div>

                <div className="mt-2 rounded-md border border-white/5 bg-white/5 px-2 py-2">
                  <div className="text-[11px] text-white/45">Client Seed</div>
                  <div className="font-mono text-[12px] text-white/80 break-all">
                    {bet.client_seed || "—"}
                  </div>
                </div>
              </div>'''

new = '''              <div
                key={bet.id}
                className="rounded-lg bg-black/20 px-3 py-3 text-sm"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedRecentBetId((prev) => (prev === bet.id ? null : bet.id))
                  }
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-md px-2 py-1 text-[11px] font-bold ${
                          bet.win
                            ? "bg-green-500/15 text-green-400"
                            : "bg-red-500/15 text-red-400"
                        }`}
                      >
                        {bet.win ? "WIN" : "LOSE"}
                      </span>
                      <span className="text-white/85 font-semibold">
                        {bet.condition === "over" ? "Over" : "Under"} {bet.target}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-white/45">
                        {formatTime(bet.createdAt)}
                      </span>
                      <span className="text-xs text-white/45">
                        {expandedRecentBetId === bet.id ? "▲" : "▼"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                    <div className="rounded-md bg-white/5 px-2 py-2">
                      <div className="text-[11px] text-white/45">Bet</div>
                      <div className="font-semibold text-white/85">
                        ${formatNum(Number(bet.amount))}
                      </div>
                    </div>

                    <div className="rounded-md bg-white/5 px-2 py-2">
                      <div className="text-[11px] text-white/45">Roll</div>
                      <div className="font-semibold text-white/85">
                        {formatNum(Number(bet.roll))}
                      </div>
                    </div>

                    <div className="rounded-md bg-white/5 px-2 py-2">
                      <div className="text-[11px] text-white/45">Payout</div>
                      <div className="font-semibold text-white/85">
                        ${formatNum(Number(bet.payout ?? 0))}
                      </div>
                    </div>

                    <div className="rounded-md bg-white/5 px-2 py-2">
                      <div className="text-[11px] text-white/45">Profit</div>
                      <div
                        className={`font-semibold ${
                          Number(bet.profit) >= 0 ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {Number(bet.profit) > 0 ? "+" : ""}
                        ${formatNum(Number(bet.profit))}
                      </div>
                    </div>
                  </div>
                </button>

                {expandedRecentBetId === bet.id ? (
                  <>
                    <div className="mt-3 grid gap-2 md:grid-cols-3">
                      <div className="rounded-md border border-white/5 bg-white/5 px-2 py-2">
                        <div className="text-[11px] text-white/45">Nonce</div>
                        <div className="font-mono text-[12px] text-white/80">
                          {bet.nonce ?? "—"}
                        </div>
                      </div>

                      <div className="rounded-md border border-white/5 bg-white/5 px-2 py-2 md:col-span-2">
                        <div className="text-[11px] text-white/45">Server Seed Hash</div>
                        <div className="font-mono text-[12px] text-white/80 break-all">
                          {shortHash(bet.server_seed_hash)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 rounded-md border border-white/5 bg-white/5 px-2 py-2">
                      <div className="text-[11px] text-white/45">Client Seed</div>
                      <div className="font-mono text-[12px] text-white/80 break-all">
                        {bet.client_seed || "—"}
                      </div>
                    </div>
                  </>
                ) : null}
              </div>'''
if old not in src:
    print("Could not find bet card block.")
    print(f"Backup: {backup}")
    sys.exit(1)
src = src.replace(old, new, 1)

file.write_text(src)
print(f"Patched: {file}")
print(f"Backup:  {backup}")
