"use client";

import { useState } from "react";

type Props = { title?: string; bets: any[]; game?: string; limit?: number };

function n(v:any){ return Number(v || 0); }
function money(v:any){ return `$${n(v).toFixed(2)}`; }
function dt(v:any){ return String(v||"").replace("T"," ").slice(0,19) || "-"; }
function amount(b:any){ return b?.amount_usd ?? b?.amount ?? b?.stake ?? b?.bet_amount ?? 0; }
function payout(b:any){ return b?.payout ?? b?.payout_usd ?? b?.cashout_value ?? 0; }
function multi(b:any){ return b?.multiplier ?? b?.cashout_multiplier ?? 1; }
function status(b:any){
  if (typeof b?.win === "boolean") return b.win ? "win" : "lose";
  const s=String(b?.status ?? b?.result ?? "-").toLowerCase();
  if (s==="lost" || s==="loss" || s==="failed") return "lose";
  if (s==="cashed_out" || s==="completed" || s==="paid" || s==="win" || s==="won") return "win";
  return s;
}
function profit(b:any){
  if (b?.profit !== undefined) return n(b.profit);
  return n(payout(b)) - n(amount(b));
}

export default function RecentBetsPanel({ title="Recent Bets", bets, game, limit=10 }: Props){
  const [showAll,setShowAll]=useState(false);
  const [expanded,setExpanded]=useState<string | number | null>(null);
  const rows = Array.isArray(bets) ? (showAll ? bets : bets.slice(0, limit)) : [];

  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <span className="text-xs text-white/50">{rows.length}/{bets?.length||0} shown</span>
      </div>

      {rows.length === 0 ? (
        <div className="text-sm text-white/50">No recent bets yet.</div>
      ) : (
        <div className="space-y-2">
          {rows.map((b:any,idx:number)=>{
            const id=b?.id ?? b?.bet_id ?? idx;
            const st=status(b);
            const win=st==="win";
            const p=profit(b);
            return (
              <div key={`${game||"bet"}-${id}`} className="rounded-lg bg-black/20 px-3 py-3 text-sm">
                <button type="button" onClick={()=>setExpanded(prev=>prev===id?null:id)} className="w-full text-left">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-md px-2 py-1 text-[11px] font-bold ${win ? "bg-green-500/15 text-green-400" : st==="lose" ? "bg-red-500/15 text-red-400" : "bg-sky-500/15 text-sky-300"}`}>
                        {win ? "WIN" : st==="lose" ? "LOSE" : st.toUpperCase()}
                      </span>
                      {p >= 10 ? <span className="rounded-md bg-yellow-500/15 px-2 py-1 text-[11px] font-bold text-yellow-300">BIG WIN</span> : null}
                      <span className="text-white/80">{game || "Game"} #{id}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-white/45">{dt(b?.created_at || b?.updated_at)}</span>
                      <span className="text-xs text-white/45">{expanded===id ? "▲" : "▼"}</span>
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
                    <Box label="Bet" value={money(amount(b))}/>
                    <Box label="Multi" value={`x${n(multi(b)).toFixed(2)}`}/>
                    <Box label="Payout" value={money(payout(b))}/>
                    <div className="rounded-md bg-white/5 px-2 py-2">
                      <div className="text-[11px] text-white/45">Profit</div>
                      <div className={`font-semibold ${p >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {p > 0 ? "+" : ""}{money(p)}
                      </div>
                    </div>
                  </div>
                </button>

                {expanded===id ? (
                  <div className="mt-3 grid gap-2 md:grid-cols-3">
                    <Detail label="Status" value={st}/>
                    <Detail label="Game" value={game || "Game"}/>
                    <Detail label="Raw ID" value={String(id)}/>
                    {b?.choice !== undefined ? <Detail label="Choice" value={String(b.choice)}/> : null}
                    {b?.result !== undefined ? <Detail label="Result" value={String(b.result)}/> : null}
                    {b?.mine_count !== undefined ? <Detail label="Mines" value={String(b.mine_count)}/> : null}
                    {b?.safe_reveals !== undefined ? <Detail label="Safe Reveals" value={String(b.safe_reveals)}/> : null}
                    {b?.current_card !== undefined ? <Detail label="Card" value={String(b.current_card)}/> : null}
                    {b?.streak !== undefined ? <Detail label="Streak" value={String(b.streak)}/> : null}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}

      {(bets?.length || 0) > limit ? (
        <div className="mt-3 flex justify-center">
          <button onClick={()=>setShowAll(v=>!v)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10">
            {showAll ? `Show Last ${limit}` : `Show ${(bets?.length||0)-limit} Older Bets`}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Box({label,value}:{label:string;value:string}){
  return <div className="rounded-md bg-white/5 px-2 py-2"><div className="text-[11px] text-white/45">{label}</div><div className="font-semibold text-white/85">{value}</div></div>
}
function Detail({label,value}:{label:string;value:string}){
  return <div className="rounded-md border border-white/5 bg-white/5 px-2 py-2"><div className="text-[11px] text-white/45">{label}</div><div className="font-mono text-[12px] text-white/80 break-all">{value || "—"}</div></div>
}
