export async function getBrand(host: string) {
  const base = `http://${host}`;
  const res = await fetch(
    `${base}/ui-api/public/brand-by-host?host=${encodeURIComponent(host)}`,
    { cache: "no-store" }
  );
  if (!res.ok) return null;
  return res.json();
}
