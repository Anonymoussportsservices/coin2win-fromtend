"use client"

import { useEffect, useState } from "react"
import { DEFAULT_BRAND, fetchPublicBrand, type PublicBrand } from "@/lib/publicBrand"
import CasinoCategoryPageShell from "@/components/CasinoCategoryPageShell"
import { getGamesByCategory } from "@/lib/casinoData"

export default function LivePage() {
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


  const games = getGamesByCategory("live")

  return (
    <CasinoCategoryPageShell
      title="Casino"
      subtitle={`${brand.brand_name || "Coin2Win"} live casino library.`}
      heading="Live Casino"
      description="Premium live dealer and show-style content. Structured now so it can scale later with real provider libraries."
      games={games}
      columns="xl:grid-cols-3"
    />
  )
}
