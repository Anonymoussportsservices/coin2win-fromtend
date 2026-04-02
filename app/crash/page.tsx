"use client";

import { useEffect, useState } from "react"
import { DEFAULT_BRAND, fetchPublicBrand, type PublicBrand } from "@/lib/publicBrand";
import { useRouter } from "next/navigation";
import PlayerShell from "@/components/PlayerShell";
import { getStoredUser } from "@/lib/auth";
import CrashGame from "@/components/CrashGame";

const centerWrap: React.CSSProperties = {
  width: "100%",
  maxWidth: "1100px",
  margin: "0 auto",
  boxSizing: "border-box",
};

export default function CrashPage() {
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
      title="Crash"
      subtitle={`${brand.brand_name || "Coin2Win"} Originals – Multiplayer Crash`}
    >
      <div style={centerWrap}>
        <CrashGame />
      </div>
    </PlayerShell>
  );
}
