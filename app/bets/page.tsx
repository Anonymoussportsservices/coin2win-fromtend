"use client";

import { useEffect, useMemo, useState } from "react";
import PlayerShell from "@/components/PlayerShell";
import FilterPills from "@/components/FilterPills";
import { getStoredUser } from "@/lib/auth";
import { API_ENDPOINTS, apiGet } from "@/lib/gameApi";

type Game = "dice" | "crash" | "coinflip" | "mines" | "hilo";
type GameFilter = "all" | Game;

type UnifiedBet = {
  key: string;
  game: Game;
  id: number;
  createdAt: string;
  amount: number;
  payout: number;
  profit: number;
  statusLabel: string;
  tone: "win" | "loss" | "neutral";
  details: Record<string, string>;
};

function money(v:any){ return `$${Number(v||0).toFixed(2)}`; }
function short(v:any){ const s=String(v||"").trim(); return s.length>22 ? `${s.slice(0,10)}...${s.slice(-10)}` : s || "—"; }
function time(v:any){ if(!v)return "—"; const d=new Date(String(v).replace(" ","T")); return Number.isNaN(d.getTime()) ? String(v).slice(0,19) : d.toLocaleString(); }
function profit(p:any,a:any){ return Number(p||0)-Number(a||0); }
function tone(status:string,payout:number,amount:number){
  const s=status.toLowerCase();
  if(["win","won","cashed_out","paid"].includes(s) || payout>amount) return "win";
  if(["loss","lose","lost","crashed","failed"].includes(s) || payout===0) return "loss";
  return "neutral";
}

export default function BetsPage(){
  const user=getStoredUser();
  const userId=user?.user_id || "player_001";

  const [filter,setFilter]=useState<GameFilter>("all");
  const [bets,setBets]=useState<UnifiedBet[]>([]);
  const [expanded,setExpanded]=useState<string|null>(null);
  const [error,setError]=useState("");

  useEffect(()=>{
    async function load(){
      try{
        const [dice,crash,coinflip,mines,hilo]=await Promise.all([
          apiGet(API_ENDPOINTS.diceBets(userId)).catch(()=>({bets:[]})),
          apiGet(API_ENDPOINTS.crashGlobalMyBets(userId)).catch(()=>({bets:[]})),
          apiGet(API_ENDPOINTS.coinflipBets(userId)).catch(()=>({bets:[]})),
          apiGet(API_ENDPOINTS.minesBets(userId)).catch(()=>({bets:[]})),
          apiGet(API_ENDPOINTS.hiloBets(userId)).catch(()=>({bets:[]})),
        ]);

        const out:UnifiedBet[]=[];

        for(const b of (dice?.bets||[])){
          const a=Number(b.amount_usd||0), p=Number(b.payout||0);
          out.push({key:`dice-${b.id}`,game:"dice",id:b.id,createdAt:b.created_at||"",amount:a,payout:p,profit:profit(p,a),statusLabel:b.win?"Win":"Loss",tone:b.win?"win":"loss",details:{Condition:`${b.condition} ${b.target}`,Roll:String(b.roll??"—"),Nonce:String(b.nonce??"—"),"Client Seed":short(b.client_seed),"Server Seed Hash":short(b.server_seed_hash)}});
        }

        for(const b of (crash?.bets||[])){
          const a=Number(b.amount_usd||0), p=Number(b.payout||0), st=String(b.status||"Pending");
          out.push({key:`crash-${b.id}`,game:"crash",id:b.id,createdAt:b.created_at||"",amount:a,payout:p,profit:profit(p,a),statusLabel:st,tone:tone(st,p,a),details:{"Round ID":String(b.round_id??"—"),"Auto Cashout":b.auto_cashout?`${Number(b.auto_cashout).toFixed(2)}x`:"—"}});
        }

        for(const b of (coinflip?.bets||[])){
          const a=Number(b.amount_usd||0), p=Number(b.payout||0), st=b.win?"Win":"Loss";
          out.push({key:`coinflip-${b.id}`,game:"coinflip",id:b.id,createdAt:b.created_at||"",amount:a,payout:p,profit:profit(p,a),statusLabel:st,tone:b.win?"win":"loss",details:{Choice:String(b.choice||"—"),Result:String(b.result||"—")}});
        }

        for(const b of (mines?.bets||[])){
          const a=Number(b.amount_usd||0), p=Number(b.payout||0), st=String(b.status||"Pending");
          out.push({key:`mines-${b.id}`,game:"mines",id:b.id,createdAt:b.created_at||b.updated_at||"",amount:a,payout:p,profit:profit(p,a),statusLabel:st,tone:tone(st,p,a),details:{Mines:String(b.mine_count??"—"),"Safe Reveals":String(b.safe_reveals??"—"),Multiplier:`x${Number(b.multiplier||1).toFixed(2)}`,"Hit Mine":String(!!b.hit_mine)}});
        }

        for(const b of (hilo?.bets||[])){
          const a=Number(b.amount_usd||0), p=Number(b.payout||0), st=String(b.status||"Pending");
          out.push({key:`hilo-${b.id}`,game:"hilo",id:b.id,createdAt:b.created_at||b.updated_at||"",amount:a,payout:p,profit:profit(p,a),statusLabel:st,tone:tone(st,p,a),details:{Choice:String(b.choice||"—"),"Start Card":String(b.start_card??"—"),"Result Card":String(b.result_card??"—"),Streak:String(b.streak??0),Multiplier:`x${Number(b.multiplier||1).toFixed(2)}`}});
        }

        out.sort((a,b)=>new Date(b.createdAt||0).getTime()-new Date(a.createdAt||0).getTime());
        setBets(out);
      }catch(e:any){ setError(e?.message||"Failed to load bets"); }
    }
    load();
  },[userId]);

  const shown=useMemo(()=>filter==="all"?bets:bets.filter(b=>b.game===filter),[bets,filter]);

  return (
    <PlayerShell title="My Bets" subtitle="Review all Coin2Win Originals activity.">
      <div style={{display:"grid",gap:16}}>
        {error?<div style={{background:"#3b1219",color:"#fecaca",padding:12,borderRadius:12}}>{error}</div>:null}

        <div style={{background:"#1a2c38",border:"1px solid rgba(255,255,255,.06)",borderRadius:18,padding:16,display:"grid",gap:12}}>
          <div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
            <div>
              <div style={{fontSize:22,fontWeight:950,color:"#fff"}}>Bet History</div>
              <div style={{color:"#8ea2b5",fontSize:13}}>{shown.length} bets shown</div>
            </div>
            <FilterPills options={[
              {value:"all",label:"All"},
              {value:"dice",label:"Dice"},
              {value:"crash",label:"Crash"},
              {value:"coinflip",label:"Coinflip"},
              {value:"mines",label:"Mines"},
              {value:"hilo",label:"Hi-Lo"},
            ]} value={filter} onChange={(v)=>setFilter(v as GameFilter)} />
          </div>
        </div>

        <div style={{display:"grid",gap:10}}>
          {shown.map(b=>(
            <div key={b.key} style={{background:"#1a2c38",border:"1px solid rgba(255,255,255,.06)",borderRadius:16,padding:14}}>
              <button onClick={()=>setExpanded(expanded===b.key?null:b.key)} style={{width:"100%",background:"transparent",border:0,color:"#fff",textAlign:"left",cursor:"pointer"}}>
                <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center"}}>
                  <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                    <span style={{background:b.tone==="win"?"#143827":b.tone==="loss"?"#3b1219":"#213743",color:b.tone==="win"?"#86efac":b.tone==="loss"?"#fca5a5":"#cbd5e1",borderRadius:8,padding:"6px 9px",fontSize:11,fontWeight:950,textTransform:"uppercase"}}>{b.statusLabel}</span>
                    <b style={{textTransform:"capitalize"}}>{b.game} #{b.id}</b>
                    <span style={{color:"#8ea2b5",fontSize:12}}>{time(b.createdAt)}</span>
                  </div>
                  <span style={{color:"#8ea2b5"}}>{expanded===b.key?"▲":"▼"}</span>
                </div>

                <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:8,marginTop:12}}>
                  <Box l="Bet" v={money(b.amount)} />
                  <Box l="Payout" v={money(b.payout)} />
                  <Box l="Profit" v={`${b.profit>0?"+":""}${money(b.profit)}`} color={b.profit>=0?"#86efac":"#fca5a5"} />
                  <Box l="Game" v={b.game.toUpperCase()} />
                </div>
              </button>

              {expanded===b.key?(
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:8,marginTop:10}}>
                  {Object.entries(b.details).map(([k,v])=><Box key={k} l={k} v={v}/>)}
                </div>
              ):null}
            </div>
          ))}
          {!shown.length?<div style={{color:"#8ea2b5",padding:16}}>No bets found.</div>:null}
        </div>
      </div>
    </PlayerShell>
  );
}

function Box({l,v,color}:{l:string;v:string;color?:string}){
  return <div style={{background:"#0f212e",borderRadius:10,padding:"9px 10px"}}><div style={{fontSize:11,color:"#8ea2b5"}}>{l}</div><div style={{fontWeight:900,color:color||"#fff",overflowWrap:"anywhere"}}>{v}</div></div>
}
