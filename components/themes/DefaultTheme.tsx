export default function DefaultTheme({ brand, children }: any) {
  return (
    <div style={{ background: brand?.primary_color || "#111", minHeight: "100vh" }}>
      <img src={brand?.logo_url} style={{ height: 50 }} />
      <h1>{brand?.brand_name}</h1>
      {children}
    </div>
  );
}
