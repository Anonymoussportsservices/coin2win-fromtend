"use client"

import { useEffect, useState } from "react"
import { DEFAULT_BRAND, fetchPublicBrand, type PublicBrand } from "@/lib/publicBrand"
import CasinoCategoryPageShell from "@/components/CasinoCategoryPageShell"
import { getGamesByCategory } from "@/lib/casinoData"

export default function OriginalsPage() {
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


  const games = getGamesByCategory("originals")

  return (
    <CasinoCategoryPageShell
      title="Casino"
      subtitle={`${brand.brand_name || "Coin2Win"} originals library.`}
      heading={`${brand.brand_name || "Coin2Win"} Originals`}
      description="In-house crypto-first games built around speed, simplicity, and wallet-connected play."
      games={games}
      columns="xl:grid-cols-4"
    />
  )
}
