"use client";

import { useEffect } from "react";
import type { PublicBrand } from "@/lib/publicBrand";

export function useBrandMeta(brand: PublicBrand) {
  useEffect(() => {
    if (!brand) return;

    // Title
    document.title = brand.brand_name
      ? `${brand.brand_name}`
      : "Coin2Win";

    // Favicon
    if (brand.logo_url) {
      let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;

      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }

      link.href = brand.logo_url;
    }
  }, [brand]);
}
