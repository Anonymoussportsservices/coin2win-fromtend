"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PlayerShell from "@/components/PlayerShell";
import MinesGame from "@/components/MinesGame";
import { getStoredUser } from "@/lib/auth";
import { DEFAULT_BRAND, fetchPublicBrand, type PublicBrand } from "@/lib/publicBrand";

export default function MinesPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
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
      title="Mines"
      subtitle={`${brand.brand_name || "Coin2Win"} Originals – Mines`}
    >
      <MinesGame />
    </PlayerShell>
  );
}
