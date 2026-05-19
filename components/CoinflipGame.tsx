"use client";

import { useEffect, useState } from "react";
import { getStoredUser } from "../lib/auth";
import { API_ENDPOINTS, apiGet, apiPost, notifyWalletChanged } from "../lib/gameApi";
import RecentBetsPanel from "./RecentBetsPanel";

function money(v:any){ return `$${Number(v||0).toFixed(2)}`; }

export default function CoinflipGame(){
  const user = getStoredUser();
  const userId = user?.user_id || "player_001";

  const [bet,setBet]=useState(1);
  const [choice,setChoice]=useState<"heads"|"tails">("heads");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [result,setResult]=useState<any>(null);
  const [recentBets,setRecentBets]=useState<any[]>([]);
  const [flipping,setFlipping]=useState(false);

  async function loadHistory(){
    try{
      const data=await apiGet(API_ENDPOINTS.coinflipBets(userId));
      setRecentBets(Array.isArray(data?.bets)?data.bets:[]);
    }catch{}
  }

  useEffect(()=>{ if(userId) loadHistory(); },[userId]);

  async function placeBet(){
    if(busy) return;
    setBusy(true); setError(""); setFlipping(true);
    try{
      const data=await apiPost(API_ENDPOINTS.coinflipBet,{user_id:userId,amount_usd:Number(bet),choice});
      setResult(data);
      notifyWalletChanged();
      await loadHistory();
    }catch(e:any){
      setError(e?.message||"Coinflip failed");
    }finally{
      setTimeout(()=>setFlipping(false),650);
      setBusy(false);
    }
  }

  const last = result || recentBets[0] || null;
  const selectedHeads = choice==="heads";
  const payout = Number(last?.payout || 0);
  const win = Boolean(last?.win);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const sync = () => setIsMobile(window.innerWidth < 768);
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  return (
    <div style={{maxWidth:1180,margin:"0 auto",padding:isMobile?6:18,color:"#fff",display:"grid",gap:isMobile?8:18,overflowX:"hidden",boxSizing:"border-box"}}>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"340px minmax(0,1fr)",gap:isMobile?8:18,alignItems:"stretch"}}>
        <aside style={{order:isMobile?2:1,background:"#213743",borderRadius:18,padding:isMobile?10:16,display:"grid",gap:isMobile?8:14,alignContent:"start",boxShadow:"0 12px 35px rgba(0,0,0,.22)"}}>
          <div style={{display:"flex",gap:8,background:"#0f212e",padding:5,borderRadius:999}}>
            <button style={{flex:1,border:0,borderRadius:999,padding:"10px 0",background:"#2f4553",color:"#fff",fontWeight:900}}>Manual</button>
            <button style={{flex:1,border:0,borderRadius:999,padding:"10px 0",background:"transparent",color:"#8ea2b5",fontWeight:900}}>Auto</button>
          </div>

          <label style={{display:"grid",gap:7}}>
            <span style={{fontSize:13,color:"#b1bad3",fontWeight:800}}>Bet Amount</span>
            <div style={{display:"flex",background:"#0f212e",border:"2px solid #2f4553",borderRadius:12,overflow:"hidden"}}>
              <input type="number" min=".1" step=".01" value={bet} onChange={e=>setBet(Number(e.target.value||0))} style={{flex:1,minWidth:0,background:"transparent",color:"#fff",border:0,padding:12,fontWeight:900,fontSize:15,outline:"none"}}/>
              <button onClick={()=>setBet(v=>Math.max(.1,Number((v/2).toFixed(2))))} style={{border:0,background:"#2f4553",color:"#fff",padding:"0 12px",fontWeight:900}}>½</button>
              <button onClick={()=>setBet(v=>Number((v*2).toFixed(2)))} style={{border:0,background:"#2f4553",color:"#fff",padding:"0 12px",fontWeight:900}}>2×</button>
            </div>
          </label>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <button onClick={()=>setChoice("heads")} style={pickBtn(selectedHeads)}>Heads</button>
            <button onClick={()=>setChoice("tails")} style={pickBtn(!selectedHeads)}>Tails</button>
          </div>

          <div style={{background:"#0f212e",borderRadius:14,padding:14,display:"grid",gap:10}}>
            <Row l="Multiplier" r="x1.98"/>
            <Row l="Win Chance" r="50%"/>
            <Row l="Potential Payout" r={money(Number(bet)*1.98)}/>
          </div>

          <button onClick={placeBet} disabled={busy} style={{border:0,borderRadius:12,padding:16,background:"#00e701",color:"#071824",fontWeight:950,fontSize:16,cursor:busy?"not-allowed":"pointer",boxShadow:"0 8px 0 #009b00"}}>
            {busy ? "Flipping..." : "Bet"}
          </button>

          {error ? <div style={{background:"#4c1d24",color:"#fecaca",borderRadius:12,padding:12,fontWeight:800}}>{error}</div> : null}
        </aside>

        <main style={{order:isMobile?1:2,background:"radial-gradient(circle at top,#243f4d,#0f212e 70%)",borderRadius:22,padding:isMobile?10:24,minHeight:isMobile?390:520,display:"grid",alignContent:"center",justifyItems:"center",gap:isMobile?8:24,boxShadow:"inset 0 0 0 1px rgba(255,255,255,.04)"}}>
          <div style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center"}}>
            <Pill label="Choice" value={choice.toUpperCase()} color="#38bdf8"/>
            <Pill label="Last" value={last?.result ? String(last.result).toUpperCase() : "—"} color={win?"#86efac":"#fca5a5"}/>
            <Pill label="Payout" value={money(payout)} color="#fbbf24"/>
          </div>

          <div style={{perspective:900}}>
            <div style={{
              width:isMobile?120:210,height:isMobile?120:210,borderRadius:"50%",
              background:"linear-gradient(145deg,#f8fafc,#94a3b8)",
              color:"#071824",display:"grid",placeItems:"center",
              fontSize:isMobile?32:42,fontWeight:950,
              boxShadow:"0 30px 90px rgba(0,0,0,.48), inset 0 0 0 10px rgba(255,255,255,.65)",
              transform:flipping?"rotateY(900deg) scale(.94)":"rotateY(0) scale(1)",
              transition:"transform .65s ease"
            }}>
              {last?.result ? (String(last.result).toLowerCase()==="heads" ? "H" : "T") : (choice==="heads"?"H":"T")}
            </div>
          </div>

          {last ? (
            <div style={{background:win?"#143827":"#3b1219",color:win?"#86efac":"#fca5a5",borderRadius:999,padding:"12px 18px",fontWeight:950}}>
              {win ? "WIN" : "LOSE"} · {String(last.choice || choice).toUpperCase()} vs {String(last.result || "-").toUpperCase()}
            </div>
          ) : (
            <div style={{color:"#8ea2b5",fontWeight:800}}>Choose heads or tails and flip.</div>
          )}
        </main>
      </div>

      {!isMobile && <RecentBetsPanel game="Coinflip" bets={recentBets} />}
    </div>
  );
}

function Row({l,r}:{l:string;r:string}){return <div style={{display:"flex",justifyContent:"space-between",fontSize:14}}><span style={{color:"#8ea2b5"}}>{l}</span><b>{r}</b></div>}
function Pill({label,value,color}:{label:string;value:string;color:string}){return <div style={{background:"#213743",borderRadius:999,padding:"10px 14px",fontWeight:900}}><span style={{color:"#8ea2b5",marginRight:8}}>{label}</span><span style={{color}}>{value}</span></div>}
function pickBtn(active:boolean){return {border:0,borderRadius:12,padding:14,background:active?"#00e701":"#2f4553",color:active?"#071824":"#fff",fontWeight:950,cursor:"pointer"} as any}
