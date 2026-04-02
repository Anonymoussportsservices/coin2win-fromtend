"use client";

import { useEffect, useState } from "react"
import { DEFAULT_BRAND, fetchPublicBrand, type PublicBrand } from "@/lib/publicBrand";
import { useRouter } from "next/navigation";
import { getStoredUser } from "../../lib/auth";
import PlayerShell from "@/components/PlayerShell";
import DiceGame from "@/components/DiceGame";

const centerWrap: React.CSSProperties = {
  width: "100%",
  maxWidth: "100%",
  margin: "0 auto",
  boxSizing: "border-box",
};

export default function DicePage() {
  const [brand, setBrand] = useState<PublicBrand>(DEFAULT_BRAND);

  useEffect(() => {
    let mounted = true;
    fetchPublicBrand().then((data) => {
      if (mounted) setBrand(data || DEFAULT_BRAND);
    });
    return () => {
      mounted = false;
    };
  }, []);


  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) return null;

  return (
    <PlayerShell
      title="Dice"
      subtitle={`${brand.brand_name || "Coin2Win"} Originals – Provably Fair Dice`}
    >
      <div style={centerWrap}>
        <DiceGame />
      </div>
    </PlayerShell>
  );
}
