"use client";

import { useEffect, useState } from "react";

type BrandRow = {
  id: number;
  owner_user_id: string;
  brand_name: string;
  domain: string;
  logo_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  support_email?: string | null;
  support_telegram?: string | null;
  is_active: boolean;
  created_at?: string | null;
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "#0f172a",
  color: "#fff",
  padding: "10px 12px",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "#94a3b8",
  marginBottom: 6,
  display: "block",
};

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [ownerUserId, setOwnerUserId] = useState("");
  const [brandName, setBrandName] = useState("");
  const [domain, setDomain] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#16a34a");
  const [secondaryColor, setSecondaryColor] = useState("#0f172a");
  const [supportEmail, setSupportEmail] = useState("");
  const [supportTelegram, setSupportTelegram] = useState("");
  const [isActive, setIsActive] = useState(true);

  async function loadBrands() {
    try {
      setLoading(true);
      const res = await fetch("/ui-api/admin/brands", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      setBrands(Array.isArray(json?.brands) ? json.brands : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBrands();
  }, []);

  async function createBrand() {
    try {
      setMessage("");
      const res = await fetch("/ui-api/admin/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_user_id: ownerUserId.trim(),
          brand_name: brandName.trim(),
          domain: domain.trim().toLowerCase(),
          logo_url: logoUrl.trim(),
          primary_color: primaryColor.trim(),
          secondary_color: secondaryColor.trim(),
          support_email: supportEmail.trim(),
          support_telegram: supportTelegram.trim(),
          is_active: isActive,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) throw new Error(json?.detail || "Failed to create brand");

      setOwnerUserId("");
      setBrandName("");
      setDomain("");
      setLogoUrl("");
      setPrimaryColor("#16a34a");
      setSecondaryColor("#0f172a");
      setSupportEmail("");
      setSupportTelegram("");
      setIsActive(true);
      setMessage("Brand created ✅");
      await loadBrands();
    } catch (e: any) {
      setMessage(e?.message || "Failed to create brand");
    }
  }

  async function toggleBrand(row: BrandRow) {
    try {
      setMessage("");
      const res = await fetch(`/ui-api/admin/brands/update/${row.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !row.is_active }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) throw new Error(json?.detail || "Failed to update brand");
      setMessage("Brand updated ✅");
      await loadBrands();
    } catch (e: any) {
      setMessage(e?.message || "Failed to update brand");
    }
  }

  return (
    <div style={{ padding: 20, color: "#fff", background: "#0f172a", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gap: 20 }}>
        <div style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 20, background: "#1e293b" }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900 }}>Brands</h1>
          <p style={{ marginTop: 8, color: "#94a3b8" }}>Create and manage white-label brand mappings.</p>
        </div>

        <div style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 20, background: "#1e293b" }}>
          <h2 style={{ marginTop: 0 }}>Create Brand</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 14 }}>
            <div><label style={labelStyle}>Owner User ID</label><input style={inputStyle} value={ownerUserId} onChange={(e) => setOwnerUserId(e.target.value)} /></div>
            <div><label style={labelStyle}>Brand Name</label><input style={inputStyle} value={brandName} onChange={(e) => setBrandName(e.target.value)} /></div>
            <div><label style={labelStyle}>Domain</label><input style={inputStyle} value={domain} onChange={(e) => setDomain(e.target.value)} /></div>
            <div><label style={labelStyle}>Logo URL</label><input style={inputStyle} value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} /></div>
            <div><label style={labelStyle}>Primary Color</label><input style={inputStyle} value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} /></div>
            <div><label style={labelStyle}>Secondary Color</label><input style={inputStyle} value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} /></div>
            <div><label style={labelStyle}>Support Email</label><input style={inputStyle} value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} /></div>
            <div><label style={labelStyle}>Support Telegram</label><input style={inputStyle} value={supportTelegram} onChange={(e) => setSupportTelegram(e.target.value)} /></div>
          </div>

          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, color: "#cbd5e1" }}>
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Active
            </label>
            <button onClick={createBrand} style={{ border: 0, borderRadius: 12, padding: "10px 16px", fontWeight: 800, cursor: "pointer" }}>
              Create Brand
            </button>
          </div>

          {message ? <div style={{ marginTop: 12, color: "#cbd5e1" }}>{message}</div> : null}
        </div>

        <div style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 20, background: "#1e293b" }}>
          <h2 style={{ marginTop: 0 }}>Brand List</h2>
          {loading ? (
            <div style={{ color: "#94a3b8" }}>Loading...</div>
          ) : brands.length ? (
            <div style={{ display: "grid", gap: 12 }}>
              {brands.map((row) => (
                <div key={row.id} style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 16, background: "#0f172a" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: 18 }}>{row.brand_name}</div>
                      <div style={{ color: "#94a3b8", marginTop: 4 }}>{row.domain}</div>
                      <div style={{ color: "#94a3b8", marginTop: 4 }}>Owner: {row.owner_user_id}</div>
                      <div style={{ color: "#94a3b8", marginTop: 4 }}>
                        Colors: {row.primary_color || "-"} / {row.secondary_color || "-"}
                      </div>
                      <div style={{ color: "#94a3b8", marginTop: 4 }}>
                        Support: {row.support_email || "-"} {row.support_telegram ? `• ${row.support_telegram}` : ""}
                      </div>
                    </div>
                    <div style={{ display: "grid", gap: 8, alignContent: "start" }}>
                      <div style={{
                        borderRadius: 999,
                        padding: "6px 10px",
                        fontSize: 12,
                        fontWeight: 800,
                        background: row.is_active ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                        color: row.is_active ? "#86efac" : "#fca5a5"
                      }}>
                        {row.is_active ? "Active" : "Inactive"}
                      </div>
                      <button onClick={() => toggleBrand(row)} style={{ border: 0, borderRadius: 10, padding: "8px 12px", fontWeight: 800, cursor: "pointer" }}>
                        {row.is_active ? "Disable" : "Enable"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: "#94a3b8" }}>No brands yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
