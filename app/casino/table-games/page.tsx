"use client"

import { useEffect, useState } from "react"
import { DEFAULT_BRAND, fetchPublicBrand, type PublicBrand } from "@/lib/publicBrand"
import CasinoCategoryPageShell from "@/components/CasinoCategoryPageShell"
import { getGamesByCategory } from "@/lib/casinoData"

export default function TableGamesPage() {
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


  const games = getGamesByCategory("table")

  return (
    <CasinoCategoryPageShell
      title="Casino"
      subtitle={`${brand.brand_name || "Coin2Win"} table games library.`}
      heading="Table Games"
      description="Classic table game shelf with a cleaner product look and room for future provider-driven expansion."
      games={games}
      columns="xl:grid-cols-3"
    />
  )
}
