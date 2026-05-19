"use client";
import Link from "next/link";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setStoredSession } from "@/lib/auth";
import { DEFAULT_BRAND, fetchPublicBrand, type PublicBrand } from "@/lib/publicBrand";
import { useBrandMeta } from "@/lib/useBrandMeta";

const API_BASE = "/api/auth";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [brand, setBrand] = useState<PublicBrand>(DEFAULT_BRAND);
  useBrandMeta(brand);

  useEffect(() => {
    let mounted = true;
    fetchPublicBrand().then((data) => {
      if (mounted) setBrand(data || DEFAULT_BRAND);
    });
    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const raw = await res.text();
      let data: any = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = { raw };
      }

      if (!res.ok) {
        throw new Error(`status=${res.status} detail=${typeof data?.detail === "string" ? data.detail : typeof data?.raw === "string" ? data.raw : raw || "Login failed"}`);
      }

      const u = data?.user || {};
      const normalized = {
        user_id: u.user_id || u.id || u.username || "",
        email: u.email || "",
        username: u.username || u.user_id || "",
      };

      if (!data?.token || !normalized.user_id) {
        throw new Error(`bad-session token=${!!data?.token} user_id=${normalized.user_id || "missing"} raw=${raw}`);
      }

      setStoredSession(data.token, normalized);
      window.location.href = "/casino";
    } catch (err: any) {
      console.error("PLAYER_LOGIN_ERROR", err);
      setError(String(err?.message || err || "Login failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={pageStyle}>
      <div style={shellStyle}>
        <div style={heroStyle}>
          <div style={{ ...brandBadgeStyle, background: `linear-gradient(135deg, ${brand.primary_color || "#00e701"}, ${brand.secondary_color || "#00c853"})` }}>{(brand.brand_name || "Coin2Win").slice(0, 3).toUpperCase()}</div>
          <h1 style={titleStyle}>Welcome back</h1>
          <p style={subtitleStyle}>
            Login to access your {brand.brand_name || "Coin2Win"} wallet, crash, dice and account.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={cardStyle}>
          <h2 style={cardTitleStyle}>{brand.brand_name ? `${brand.brand_name} Login` : "Login"}</h2>

          <label style={labelStyle}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={inputStyle}
          />

          <label style={labelStyle}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={inputStyle}
          />

          {error ? <div style={errorStyle}>{error}</div> : null}

          <button
            type="submit"
            style={{
              ...buttonStyle,
              background: brand.primary_color || "#00e701",
              color: "#071824",
            }}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
          <div className="mt-4 text-center text-sm">
            <Link href="/forgot-password" className="text-white/70 underline underline-offset-4 hover:text-white">
              Forgot Password?
            </Link>
          </div>

          {brand.support_email || brand.support_telegram ? (
            <div style={{ marginTop: 4, color: "#9fb0bf", fontSize: 12, lineHeight: 1.5 }}>
              {brand.support_email ? <div>Support: {brand.support_email}</div> : null}
              {brand.support_telegram ? <div>Telegram: {brand.support_telegram}</div> : null}
            </div>
          ) : null}
        </form>
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#0f212e",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  boxSizing: "border-box",
};

const shellStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 520,
  display: "grid",
  gap: 18,
};

const heroStyle: React.CSSProperties = {
  textAlign: "center",
};

const brandBadgeStyle: React.CSSProperties = {
  width: 56,
  height: 56,
  margin: "0 auto 14px auto",
  borderRadius: 16,
  background: "linear-gradient(135deg, #00e701, #00c853)",
  color: "#071824",
  fontWeight: 900,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: "#fff",
  fontSize: 32,
  fontWeight: 900,
};

const subtitleStyle: React.CSSProperties = {
  margin: "10px 0 0 0",
  color: "#9fb0bf",
  fontSize: 14,
  lineHeight: 1.5,
};

const cardStyle: React.CSSProperties = {
  width: "100%",
  background: "#1a2c38",
  border: "1px solid rgba(255,255,255,0.05)",
  borderRadius: 20,
  padding: 22,
  display: "grid",
  gap: 12,
  boxSizing: "border-box",
};

const cardTitleStyle: React.CSSProperties = {
  margin: "0 0 6px 0",
  color: "#fff",
  fontSize: 22,
  fontWeight: 800,
};

const labelStyle: React.CSSProperties = {
  color: "#b1bad3",
  fontSize: 13,
  fontWeight: 700,
};

const inputStyle: React.CSSProperties = {
  background: "#13202a",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 12,
  padding: "13px 14px",
  color: "#fff",
  fontSize: 14,
};

const buttonStyle: React.CSSProperties = {
  marginTop: 6,
  background: "#00e701",
  color: "#071824",
  border: "none",
  borderRadius: 12,
  padding: "14px 16px",
  fontWeight: 900,
  fontSize: 14,
  cursor: "pointer",
};

const errorStyle: React.CSSProperties = {
  background: "rgba(239,68,68,0.12)",
  color: "#fecaca",
  border: "1px solid rgba(239,68,68,0.22)",
  borderRadius: 12,
  padding: "10px 12px",
  fontWeight: 700,
};
