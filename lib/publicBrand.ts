export type PublicBrand = {
  owner_user_id?: string | null;
  brand_name?: string | null;
  domain?: string | null;
  logo_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  support_email?: string | null;
  support_telegram?: string | null;
  is_active?: boolean;
};

export const DEFAULT_BRAND: PublicBrand = {
  brand_name: "Coin2Win",
  primary_color: "#00e701",
  secondary_color: "#00c853",
};

function allowHostOverride(): boolean {
  return String(process.env.NEXT_PUBLIC_ALLOW_HOST_OVERRIDE || "").toLowerCase() === "true";
}

export function getHostForBrand(): string {
  if (typeof window === "undefined") return "";

  const realHost = (window.location.host || "").trim().toLowerCase();
  if (!allowHostOverride()) return realHost;

  const url = new URL(window.location.href);
  const forced = (url.searchParams.get("host") || "").trim().toLowerCase();

  return forced || realHost;
}

export async function fetchPublicBrand(host?: string): Promise<PublicBrand> {
  const resolvedHost = (
    host ||
    (typeof window !== "undefined" ? getHostForBrand() : "") ||
    ""
  )
    .toString()
    .trim()
    .toLowerCase();

  if (!resolvedHost) return DEFAULT_BRAND;

  try {
    const res = await fetch(`/ui-api/public/brand-by-host?host=${encodeURIComponent(resolvedHost)}`, {
      cache: "no-store",
    });

    if (!res.ok) return DEFAULT_BRAND;

    const data = await res.json().catch(() => ({}));
    if (!data?.brand) return DEFAULT_BRAND;

    return {
      ...DEFAULT_BRAND,
      ...data.brand,
    };
  } catch {
    return DEFAULT_BRAND;
  }
}

export function getReferralCodeFromUrl(): string {
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.href);
  return (url.searchParams.get("ref") || "").trim();
}
