from pathlib import Path
from datetime import datetime
import shutil
import sys

file = Path("/var/www/coin2win-ui/components/DiceGame.tsx")
src = file.read_text()

backup = file.with_suffix(file.suffix + f".bak.{datetime.now().strftime('%Y%m%d-%H%M%S')}")
shutil.copy2(file, backup)

# 1) add copy helper
old = '''function shortHash(value: string | undefined | null, size: number = 10) {
  const v = String(value || "").trim();
  if (!v) return "—";
  if (v.length <= size * 2) return v;
  return `${v.slice(0, size)}...${v.slice(-size)}`;
}
'''
new = '''function shortHash(value: string | undefined | null, size: number = 10) {
  const v = String(value || "").trim();
  if (!v) return "—";
  if (v.length <= size * 2) return v;
  return `${v.slice(0, size)}...${v.slice(-size)}`;
}

async function copyText(value: string | number | undefined | null) {
  const text = String(value ?? "").trim();
  if (!text || text == "—") return;
  try {
    await navigator.clipboard.writeText(text);
  } catch {}
}
'''
if old not in src:
    print("Could not find shortHash helper.")
    print(f"Backup: {backup}")
    sys.exit(1)
src = src.replace(old, new, 1)

# 2) nonce block
old = '''                      <div className="rounded-md border border-white/5 bg-white/5 px-2 py-2">
                        <div className="text-[11px] text-white/45">Nonce</div>
                        <div className="font-mono text-[12px] text-white/80">
                          {bet.nonce ?? "—"}
                        </div>
                      </div>'''
new = '''                      <div className="rounded-md border border-white/5 bg-white/5 px-2 py-2">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <div className="text-[11px] text-white/45">Nonce</div>
                          <button
                            type="button"
                            onClick={() => copyText(bet.nonce)}
                            className="rounded bg-white/10 px-2 py-1 text-[10px] font-semibold text-white/70 hover:bg-white/15"
                          >
                            Copy
                          </button>
                        </div>
                        <div className="font-mono text-[12px] text-white/80">
                          {bet.nonce ?? "—"}
                        </div>
                      </div>'''
if old not in src:
    print("Could not find Nonce block.")
    print(f"Backup: {backup}")
    sys.exit(1)
src = src.replace(old, new, 1)

# 3) server seed block
old = '''                      <div className="rounded-md border border-white/5 bg-white/5 px-2 py-2 md:col-span-2">
                        <div className="text-[11px] text-white/45">Server Seed Hash</div>
                        <div className="font-mono text-[12px] text-white/80 break-all">
                          {shortHash(bet.server_seed_hash)}
                        </div>
                      </div>'''
new = '''                      <div className="rounded-md border border-white/5 bg-white/5 px-2 py-2 md:col-span-2">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <div className="text-[11px] text-white/45">Server Seed Hash</div>
                          <button
                            type="button"
                            onClick={() => copyText(bet.server_seed_hash)}
                            className="rounded bg-white/10 px-2 py-1 text-[10px] font-semibold text-white/70 hover:bg-white/15"
                          >
                            Copy
                          </button>
                        </div>
                        <div className="font-mono text-[12px] text-white/80 break-all">
                          {shortHash(bet.server_seed_hash)}
                        </div>
                      </div>'''
if old not in src:
    print("Could not find Server Seed Hash block.")
    print(f"Backup: {backup}")
    sys.exit(1)
src = src.replace(old, new, 1)

# 4) client seed block
old = '''                    <div className="mt-2 rounded-md border border-white/5 bg-white/5 px-2 py-2">
                      <div className="text-[11px] text-white/45">Client Seed</div>
                      <div className="font-mono text-[12px] text-white/80 break-all">
                        {bet.client_seed || "—"}
                      </div>
                    </div>'''
new = '''                    <div className="mt-2 rounded-md border border-white/5 bg-white/5 px-2 py-2">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <div className="text-[11px] text-white/45">Client Seed</div>
                        <button
                          type="button"
                          onClick={() => copyText(bet.client_seed)}
                          className="rounded bg-white/10 px-2 py-1 text-[10px] font-semibold text-white/70 hover:bg-white/15"
                        >
                          Copy
                        </button>
                      </div>
                      <div className="font-mono text-[12px] text-white/80 break-all">
                        {bet.client_seed || "—"}
                      </div>
                    </div>'''
if old not in src:
    print("Could not find Client Seed block.")
    print(f"Backup: {backup}")
    sys.exit(1)
src = src.replace(old, new, 1)

file.write_text(src)
print(f"Patched: {file}")
print(f"Backup:  {backup}")
