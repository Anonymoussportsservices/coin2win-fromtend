"use client"

import { useEffect, useState } from "react"
import { DEFAULT_BRAND, fetchPublicBrand, type PublicBrand } from "@/lib/publicBrand"
import CasinoCategoryPageShell from "@/components/CasinoCategoryPageShell"
import { getGamesByCategory } from "@/lib/casinoData"

export default function SlotsPage() {
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


  const games = getGamesByCategory("slots")

  return (
    <CasinoCategoryPageShell
      title="Casino"
      subtitle={`${brand.brand_name || "Coin2Win"} slots library.`}
      heading="Slots"
      description="Top slot selection now, scalable provider catalogs later. This page is built to expand into hundreds of games."
      games={games}
      columns="xl:grid-cols-4"
    />
  )
}
