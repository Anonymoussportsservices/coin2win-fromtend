"use client";

import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";

export default function AgentLoginPage() {
  const router = useRouter();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!emailOrUsername.trim() || !password.trim()) {
      setError("Enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/ui-api/agent/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailOrUsername.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.detail || "Invalid credentials");
        return;
      }

      localStorage.setItem("agent_session_data", JSON.stringify(data?.agent || {}));
      localStorage.setItem("agent_viewer_id", data?.agent?.id || "");
      localStorage.removeItem("agent_session");
      localStorage.removeItem("admin_key");
      localStorage.removeItem("coin2win_admin_key");

      router.replace("/agent/dashboard");
    } catch (err) {
      setError("Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={page}>
      <div style={card}>
        <div style={badge}>AGT</div>
        <h1 style={title}>Agent Login</h1>
        <div style={subtitle}>Sign in to access the operations portal.</div>

        {error ? <div style={errorBox}>{error}</div> : null}

        <form onSubmit={handleLogin} style={form}>
          <input
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            placeholder="Email"
            style={input}
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            style={input}
          />

          <button type="submit" style={btn} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

const page: CSSProperties = {
  minHeight: "100vh",
  background: "#0f212e",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
};

const card: CSSProperties = {
  width: "100%",
  maxWidth: 420,
  background: "#1a2c38",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 18,
  padding: 28,
  display: "grid",
  gap: 14,
};

const badge: CSSProperties = {
  width: 52,
  height: 52,
  borderRadius: 14,
  background: "linear-gradient(135deg, #00e701, #00c853)",
  color: "#071824",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 900,
};

const title: CSSProperties = {
  margin: 0,
  color: "#fff",
  fontSize: 28,
  fontWeight: 900,
};

const subtitle: CSSProperties = {
  color: "#9fb0bf",
  fontSize: 14,
};

const form: CSSProperties = {
  display: "grid",
  gap: 12,
  marginTop: 8,
};

const input: CSSProperties = {
  minHeight: 46,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "#13202a",
  color: "#fff",
  padding: "0 14px",
};

const btn: CSSProperties = {
  minHeight: 48,
  borderRadius: 12,
  border: "none",
  background: "#00e701",
  color: "#071824",
  fontWeight: 900,
  cursor: "pointer",
};

const errorBox: CSSProperties = {
  background: "rgba(239,68,68,0.12)",
  color: "#fecaca",
  border: "1px solid rgba(239,68,68,0.22)",
  borderRadius: 12,
  padding: "10px 12px",
  fontWeight: 700,
};
