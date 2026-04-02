"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { DEFAULT_BRAND, fetchPublicBrand, getReferralCodeFromUrl, type PublicBrand } from "@/lib/publicBrand"
import { useBrandMeta } from "@/lib/useBrandMeta"
import PlayerShell from "@/components/PlayerShell";
import type { CSSProperties } from "react";

export default function HomePage() {
  const [brand, setBrand] = useState<PublicBrand>(DEFAULT_BRAND);
  const [referralCode, setReferralCode] = useState("");
  useBrandMeta(brand);

  useEffect(() => {
    let mounted = true;
    fetchPublicBrand().then((data) => {
      if (mounted) setBrand(data || DEFAULT_BRAND);
    });
    setReferralCode(getReferralCodeFromUrl());
    return () => {
      mounted = false;
    };
  }, []);

  const registerHref = useMemo(
    () => referralCode ? `/register?ref=${encodeURIComponent(referralCode)}` : "/register",
    [referralCode]
  );

  return (
    <PlayerShell
      title={brand.brand_name || "Coin2Win"}
      subtitle="Provably fair originals and premium casino games."
    >
      <div style={wrap}>

        <div style={hero}>

          <div>
            <h1 style={title}>
              Welcome to <span style={{color:"#00e701"}}>{brand.brand_name || "Coin2Win"}</span>
            </h1>

            <p style={subtitle}>
              Premium casino experience with provably fair originals,
              fast gameplay and transparent results.
            </p>

            <div style={buttons}>
              <Link href="/casino" style={primaryBtn}>
                Enter Casino
              </Link>

              <Link href="/cashier" style={secondaryBtn}>
                Deposit
              </Link>
            </div>
          </div>

        </div>

        <div style={grid}>

          <Link href="/crash" style={card}>
            <div style={gameTitle}>Crash</div>
            <div style={gameDesc}>Cash out before it crashes.</div>
          </Link>

          <Link href="/dice" style={card}>
            <div style={gameTitle}>Dice</div>
            <div style={gameDesc}>Roll over or under instantly.</div>
          </Link>

        </div>

      
      {(brand.support_email || brand.support_telegram) ? (
        <div style={{ marginTop: 12, color: "#9fb0bf", fontSize: 12, lineHeight: 1.5 }}>
          {brand.support_email ? <div>Support: {brand.support_email}</div> : null}
          {brand.support_telegram ? <div>Telegram: {brand.support_telegram}</div> : null}
        </div>
      ) : null}
</div>
    </PlayerShell>
  );
}

const wrap:CSSProperties={
maxWidth:1200,
margin:"0 auto",
padding:"40px 20px",
display:"grid",
gap:40
}

const hero:CSSProperties={
background:"#1a2c38",
borderRadius:20,
padding:40,
border:"1px solid rgba(255,255,255,0.05)"
}

const title:CSSProperties={
fontSize:40,
marginBottom:10,
color:"#fff"
}

const subtitle:CSSProperties={
color:"#9fb0bf",
fontSize:16,
maxWidth:500
}

const buttons:CSSProperties={
marginTop:20,
display:"flex",
gap:12
}

const primaryBtn:CSSProperties={
background:"#00e701",
color:"#071824",
padding:"12px 18px",
borderRadius:10,
textDecoration:"none",
fontWeight:700
}

const secondaryBtn:CSSProperties={
background:"#213743",
color:"#fff",
padding:"12px 18px",
borderRadius:10,
textDecoration:"none",
fontWeight:700
}

const grid:CSSProperties={
display:"grid",
gridTemplateColumns:"repeat(2,1fr)",
gap:20
}

const card:CSSProperties={
background:"#1a2c38",
borderRadius:16,
padding:24,
textDecoration:"none",
border:"1px solid rgba(255,255,255,0.05)",
display:"grid",
gap:8
}

const gameTitle:CSSProperties={
fontSize:22,
fontWeight:700,
color:"#fff"
}

const gameDesc:CSSProperties={
color:"#9fb0bf"
}
