"use client";

import { useEffect, useState } from "react";
import { getStoredUser } from "../lib/auth";
import { API_ENDPOINTS, apiGet, apiPost, notifyWalletChanged } from "../lib/gameApi";
import RecentBetsPanel from "./RecentBetsPanel";

function money(v:any){ return `$${Number(v||0).toFixed(2)}` }
function pct(v:number){ return `${Math.max(0, Math.min(100, v)).toFixed(0)}%`; }

export default function HiloGame(){
  const user = getStoredUser();
  const userId = user?.user_id || "player_001";

  const [bet,setBet]=useState(1);
  const [game,setGame]=useState<any>(null);
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  const [recentBets,setRecentBets]=useState<any[]>([]);
  const [flip,setFlip]=useState(false);
  const [isMobile,setIsMobile]=useState(false);

  useEffect(()=>{
    const sync=()=>setIsMobile(window.innerWidth<768);
    sync();
    window.addEventListener("resize",sync);
    return()=>window.removeEventListener("resize",sync);
  },[]);

  useEffect(()=>{
    async function load(){
      try{
        const data = await apiGet(API_ENDPOINTS.hiloBets(userId));
        const bets = Array.isArray(data?.bets) ? data.bets : [];
        setRecentBets(bets);
        const active = bets.find((b:any)=>b.status==="active");
        if(active) setGame(active);
      }catch{}
    }
    load();
  },[userId]);

  useEffect(()=>{
    if(!game) return;
    setFlip(true);
    const t=setTimeout(()=>setFlip(false),420);
    return()=>clearTimeout(t);
  },[game?.current_card, game?.result_card]);

  async function start(){
    setBusy(true); setError("");
    try{
      const data = await apiPost(API_ENDPOINTS.hiloStart,{user_id:userId,amount_usd:bet});
      setGame(data); notifyWalletChanged();
      try { const r=await apiGet(API_ENDPOINTS.hiloBets(userId)); setRecentBets(Array.isArray(r?.bets)?r.bets:[]); } catch {}
    }catch(e:any){ setError(e?.message||"Start failed"); }
    finally{ setBusy(false); }
  }

  async function play(choice:"high"|"low"){
    if(!game || busy || game.status!=="active") return;
    setBusy(true); setError("");
    try{
      const data = await apiPost(API_ENDPOINTS.hiloNext,{user_id:userId,bet_id:game?.bet_id||game?.id,choice});
      setGame((p:any)=>({...p,...data,current_card:data?.result_card??p?.current_card}));
    }catch(e:any){ setError(e?.message||"Play failed"); }
    finally{ setBusy(false); }
  }

  async function cashout(){
    if(!game || busy) return;
    setBusy(true); setError("");
    try{
      const data = await apiPost(API_ENDPOINTS.hiloCashout,{user_id:userId,bet_id:game?.bet_id||game?.id});
      setGame((p:any)=>({...p,...data}));
      notifyWalletChanged();
      try { const r=await apiGet(API_ENDPOINTS.hiloBets(userId)); setRecentBets(Array.isArray(r?.bets)?r.bets:[]); } catch {}
    }catch(e:any){ setError(e?.message||"Cashout failed"); }
    finally{ setBusy(false); }
  }

  const status=String(game?.status||"");
  const canPlay=status==="active";
  const allowed=Array.isArray(game?.allowed_choices)?game.allowed_choices:["high","low"];
  const card=Number(game?.current_card ?? game?.result_card ?? 0);
  const highChance=card?((13-card)/12)*100:50;
  const lowChance=card?((card-1)/12)*100:50;
  const cash=Number(game?.cashout_value??game?.payout??0);

  return(
    <div style={{maxWidth:1180,margin:"0 auto",padding:isMobile?6:18,color:"#fff",overflowX:"hidden",boxSizing:"border-box"}}>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"340px minmax(0,1fr)",gap:isMobile?8:18,alignItems:"stretch"}}>
        <aside style={{order:isMobile?2:1,background:"#213743",borderRadius:18,padding:isMobile?10:16,display:"grid",gap:isMobile?8:14,alignContent:"start",boxShadow:"0 12px 35px rgba(0,0,0,.22)"}}>
          <div style={{display:"flex",gap:8,background:"#0f212e",padding:5,borderRadius:999}}>
            <button style={{flex:1,border:0,borderRadius:999,padding:"10px 0",background:"#2f4553",color:"#fff",fontWeight:900}}>Manual</button>
            <button style={{flex:1,border:0,borderRadius:999,padding:"10px 0",background:"transparent",color:"#8ea2b5",fontWeight:900}}>Auto</button>
          </div>

          {!game && <>
            <label style={{display:"grid",gap:7}}>
              <span style={{fontSize:13,color:"#b1bad3",fontWeight:800}}>Bet Amount</span>
              <div style={{display:"flex",background:"#0f212e",border:"2px solid #2f4553",borderRadius:12,overflow:"hidden"}}>
                <input type="number" value={bet} onChange={e=>setBet(Number(e.target.value||0))} style={{flex:1,minWidth:0,background:"transparent",color:"#fff",border:0,padding:12,fontWeight:900,fontSize:15,outline:"none"}}/>
                <button onClick={()=>setBet(v=>Math.max(.1,Number((v/2).toFixed(2))))} style={{border:0,background:"#2f4553",color:"#fff",padding:"0 12px",fontWeight:900}}>½</button>
                <button onClick={()=>setBet(v=>Number((v*2).toFixed(2)))} style={{border:0,background:"#2f4553",color:"#fff",padding:"0 12px",fontWeight:900}}>2×</button>
              </div>
            </label>
            <button onClick={start} disabled={busy} style={{border:0,borderRadius:12,padding:16,background:"#00e701",color:"#071824",fontWeight:950,fontSize:16,cursor:"pointer",boxShadow:"0 8px 0 #009b00"}}>
              {busy?"Starting...":"Bet"}
            </button>
          </>}

          {game && <>
            <div style={{background:"#0f212e",borderRadius:14,padding:14,display:"grid",gap:10}}>
              <Row l="Bet" r={money(game?.amount_usd??bet)} />
              <Row l="Multiplier" r={`x${Number(game?.multiplier||1).toFixed(2)}`} />
              <Row l="Streak" r={String(game?.streak||0)} />
              <Row l="Cashout" r={money(cash)} />
            </div>

            {canPlay && <>
              <button disabled={!allowed.includes("high")||busy} onClick={()=>play("high")} style={btn(allowed.includes("high"),"#2f7df6")}>
                Higher <span style={{opacity:.8}}>· {pct(highChance)}</span>
              </button>
              <button disabled={!allowed.includes("low")||busy} onClick={()=>play("low")} style={btn(allowed.includes("low"),"#7c3aed")}>
                Lower <span style={{opacity:.8}}>· {pct(lowChance)}</span>
              </button>
              <button onClick={cashout} disabled={busy} style={{border:0,borderRadius:12,padding:16,background:"#00e701",color:"#071824",fontWeight:950,fontSize:16,cursor:"pointer",boxShadow:"0 8px 0 #009b00"}}>
                Cashout {money(cash)}
              </button>
            </>}

            {!canPlay && <button onClick={()=>setGame(null)} style={{border:0,borderRadius:12,padding:16,background:"#2f4553",color:"#fff",fontWeight:950,cursor:"pointer"}}>New Game</button>}
          </>}


          {error && <div style={{background:"#4c1d24",color:"#fecaca",borderRadius:12,padding:12,fontWeight:800}}>{error}</div>}
        </aside>

        <main style={{order:isMobile?1:2,background:"radial-gradient(circle at top,#243f4d,#0f212e 70%)",borderRadius:22,padding:isMobile?10:24,minHeight:isMobile?300:560,display:"grid",alignContent:"center",justifyItems:"center",gap:isMobile?8:24,boxShadow:"inset 0 0 0 1px rgba(255,255,255,.04)"}}>
          <div style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center"}}>
            <Pill label="Higher" value={pct(highChance)} color="#38bdf8"/>
            <Pill label="Lower" value={pct(lowChance)} color="#c084fc"/>
            <Pill label="Status" value={status||"Ready"} color={canPlay?"#86efac":"#fbbf24"}/>
          </div>

          <div style={{perspective:900}}>
            <div style={{width:isMobile?110:190,height:isMobile?155:260,borderRadius:22,background:"linear-gradient(145deg,#f8fafc,#cbd5e1)",color:"#071824",display:"grid",placeItems:"center",fontSize:isMobile?52:70,fontWeight:950,boxShadow:"0 30px 80px rgba(0,0,0,.45)",border:"8px solid #fff",transform:flip?"rotateY(180deg) scale(.96)":"rotateY(0) scale(1)",transition:"transform .42s ease"}}>
              {card||"?"}
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(5,32px)":"repeat(5,46px)",gap:isMobile?6:8}}>
            {[1,2,3,4,5,6,7,8,9,10,11,12,13].map(n=>(
              <div key={n} style={{height:isMobile?28:38,borderRadius:10,display:"grid",placeItems:"center",background:n===card?"#00e701":"#213743",color:n===card?"#071824":"#b1bad3",fontWeight:900}}>
                {n}
              </div>
            ))}
          </div>
        </main>
      </div>

      <div style={{marginTop:18}}>
        {!isMobile && <RecentBetsPanel game="Hi-Lo" bets={recentBets} />}
      </div>
    </div>
  );
}

function Row({l,r}:{l:string;r:string}){return <div style={{display:"flex",justifyContent:"space-between",fontSize:14}}><span style={{color:"#8ea2b5"}}>{l}</span><b>{r}</b></div>}
function Pill({label,value,color}:{label:string;value:string;color:string}){return <div style={{background:"#213743",borderRadius:999,padding:"10px 14px",fontWeight:900}}><span style={{color:"#8ea2b5",marginRight:8}}>{label}</span><span style={{color}}>{value}</span></div>}
function btn(active:boolean,color:string){return {border:0,borderRadius:12,padding:16,background:active?color:"#334155",color:"#fff",fontWeight:950,fontSize:16,cursor:active?"pointer":"not-allowed",boxShadow:active?"0 8px 0 rgba(0,0,0,.22)":"none"} as any}
