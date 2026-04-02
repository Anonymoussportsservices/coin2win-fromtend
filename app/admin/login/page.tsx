"use client";

import { useRouter } from "next/navigation";
import { useState, type CSSProperties } from "react";
import { setAdminKey } from "../../../lib/admin";

export default function AdminLoginPage() {
  const router = useRouter();
  const [adminKey, setAdminKeyInput] = useState("");
  const [error, setError] = useState("");

  function handleLogin() {
    setError("");

    if (!adminKey.trim()) {
      setError("Enter your admin key.");
      return;
    }

    setAdminKey(adminKey.trim());
    router.push("/admin");
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Admin Login</h1>
        <p style={subStyle}>Enter the existing backend admin key.</p>

        {error ? <div style={errorStyle}>{error}</div> : null}

        <div style={fieldStyle}>
          <label>Admin Key</label>
          <input
            style={inputStyle}
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKeyInput(e.target.value)}
          />
        </div>

        <button style={buttonStyle} onClick={handleLogin}>
          Open Admin Panel
        </button>
      </div>
    </div>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(180deg, #08111f 0%, #0f172a 100%)",
  padding: "24px",
};

const cardStyle: CSSProperties = {
  width: "100%",
  maxWidth: "480px",
  background: "rgba(15,23,42,0.95)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "20px",
  padding: "28px",
  color: "#e5e7eb",
};

const titleStyle: CSSProperties = { margin: "0 0 8px", color: "#f8fafc" };
const subStyle: CSSProperties = { margin: "0 0 20px", color: "#94a3b8" };
const fieldStyle: CSSProperties = { display: "grid", gap: "8px", marginBottom: "16px" };
const inputStyle: CSSProperties = {
  padding: "14px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.05)",
  color: "#fff",
};
const buttonStyle: CSSProperties = {
  width: "100%",
  padding: "14px",
  borderRadius: "12px",
  border: "none",
  fontWeight: 900,
  background: "linear-gradient(135deg, #3b82f6, #2563eb)",
  color: "#fff",
  cursor: "pointer",
};
const errorStyle: CSSProperties = {
  marginBottom: "16px",
  padding: "12px",
  borderRadius: "12px",
  background: "rgba(239,68,68,0.14)",
  color: "#fecaca",
};
