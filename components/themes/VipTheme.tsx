export default function VipTheme({ brand, children }: any) {
  return (
    <div style={{ background: "#000", color: "gold", minHeight: "100vh" }}>
      <h1>VIP - {brand?.brand_name}</h1>
      {children}
    </div>
  );
}
