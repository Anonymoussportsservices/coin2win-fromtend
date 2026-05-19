"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PlayerShell from "@/components/PlayerShell";
import HiloGame from "@/components/HiloGame";
import { getStoredUser } from "@/lib/auth";
import { DEFAULT_BRAND, fetchPublicBrand, type PublicBrand } from "@/lib/publicBrand";

export default function HiloPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [brand, setBrand] = useState<PublicBrand>(DEFAULT_BRAND);

  useEffect(() => {
    let mounted = true;
    fetchPublicBrand().then((data) => mounted && setBrand(data || DEFAULT_BRAND));
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) return router.replace("/login");
    setReady(true);
  }, [router]);

  if (!ready) return null;

  return (
    <PlayerShell title="Hi-Lo" subtitle={`${brand.brand_name || "Coin2Win"} Originals – Hi-Lo`}>
      <HiloGame />
    </PlayerShell>
  );
}
