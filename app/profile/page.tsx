"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { DEFAULT_BRAND, fetchPublicBrand, type PublicBrand } from "@/lib/publicBrand";
import PlayerShell from "@/components/PlayerShell";
import { getStoredUser } from "@/lib/auth";

export default function ProfilePage() {
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


  const user = getStoredUser();

  return (
    <PlayerShell
      title="Profile"
      subtitle={`Your ${brand.brand_name || "Coin2Win"} account details and player information.`}
    >
      <div style={wrapStyle}>
        <div style={gridStyle}>
          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>Account Info</h3>

            <div style={listStyle}>
              <div style={rowStyle}>
                <span style={labelStyle}>Username</span>
                <strong style={valueStyle}>{user?.username || "-"}</strong>
              </div>

              <div style={rowStyle}>
                <span style={labelStyle}>Email</span>
                <strong style={valueStyle}>{user?.email || "-"}</strong>
              </div>

              <div style={rowStyle}>
                <span style={labelStyle}>User ID</span>
                <strong style={valueWrapStyle}>{user?.user_id || "-"}</strong>
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>Security</h3>

            <div style={listStyle}>
              <div style={rowStyle}>
                <span style={labelStyle}>Password</span>
                <strong style={valueStyle}>********</strong>
              </div>

              <div style={rowStyle}>
                <span style={labelStyle}>Status</span>
                <strong style={valueStyle}>Active</strong>
              </div>

              <div style={rowStyle}>
                <span style={labelStyle}>Session</span>
                <strong style={valueStyle}>Authenticated</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PlayerShell>
  );
}

const wrapStyle: CSSProperties = {
  width: "100%",
  maxWidth: "100%",
  margin: 0,
  padding: 0,
  display: "grid",
  gap: 20,
  boxSizing: "border-box",
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 20,
  width: "100%",
};

const cardStyle: CSSProperties = {
  background: "#1a2c38",
  border: "1px solid rgba(255,255,255,0.05)",
  borderRadius: 18,
  padding: 18,
  width: "100%",
  boxSizing: "border-box",
};

const cardTitleStyle: CSSProperties = {
  margin: "0 0 16px 0",
  color: "#fff",
  fontSize: 20,
  fontWeight: 800,
};

const listStyle: CSSProperties = {
  display: "grid",
  gap: 14,
};

const rowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  alignItems: "center",
  paddingBottom: 12,
  borderBottom: "1px solid rgba(255,255,255,0.05)",
};

const labelStyle: CSSProperties = {
  color: "#9fb0bf",
  fontSize: 13,
  fontWeight: 700,
};

const valueStyle: CSSProperties = {
  color: "#fff",
  fontSize: 14,
  fontWeight: 800,
  textAlign: "right",
};

const valueWrapStyle: CSSProperties = {
  color: "#fff",
  fontSize: 14,
  fontWeight: 800,
  textAlign: "right",
  overflowWrap: "anywhere",
};

