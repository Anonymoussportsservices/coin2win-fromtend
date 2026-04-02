"use client";

import { useEffect, useState, type CSSProperties } from "react";
import PlayerShell from "@/components/PlayerShell";
import { apiAuth } from "@/lib/auth";

type KycUser = {
  id: string;
  kyc_status?: string;
  kyc_verified_at?: string | null;
  kyc_rejected_reason?: string | null;
  created_at?: string | null;
};

type KycFile = {
  name: string;
  label: string;
  url: string;
};

function badgeStyle(status?: string): CSSProperties {
  const v = String(status || "").toLowerCase();

  if (v === "verified") {
    return {
      ...badgeBase,
      background: "rgba(16,185,129,0.14)",
      color: "#86efac",
      border: "1px solid rgba(16,185,129,0.22)",
    };
  }

  if (v === "pending") {
    return {
      ...badgeBase,
      background: "rgba(245,158,11,0.14)",
      color: "#fcd34d",
      border: "1px solid rgba(245,158,11,0.22)",
    };
  }

  if (v === "rejected") {
    return {
      ...badgeBase,
      background: "rgba(239,68,68,0.14)",
      color: "#fca5a5",
      border: "1px solid rgba(239,68,68,0.22)",
    };
  }

  return {
    ...badgeBase,
    background: "rgba(148,163,184,0.12)",
    color: "#cbd5e1",
    border: "1px solid rgba(148,163,184,0.20)",
  };
}

function fmtDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminKycPage() {
  const [rows, setRows] = useState<KycUser[]>([]);
  const [filesByUser, setFilesByUser] = useState<Record<string, KycFile[]>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadRows() {
    try {
      setLoading(true);
      setError("");

      const data = await apiAuth("/admin/kyc/users", "GET");
      const users = Array.isArray(data?.users) ? data.users : [];
      setRows(users);

      const fileMap: Record<string, KycFile[]> = {};
      await Promise.all(
        users.map(async (u: KycUser) => {
          try {
            const f = await apiAuth(`/admin/kyc/files/${encodeURIComponent(u.id)}`, "GET");
            fileMap[u.id] = Array.isArray(f?.files) ? f.files : [];
          } catch {
            fileMap[u.id] = [];
          }
        })
      );
      setFilesByUser(fileMap);
    } catch (e: any) {
      setError(e?.message || "Failed to load KYC users.");
      setRows([]);
      setFilesByUser({});
    } finally {
      setLoading(false);
    }
  }

  async function approveUser(userId: string) {
    try {
      setBusyId(userId);
      setError("");
      setMessage("");
      await apiAuth(`/admin/kyc/users/${encodeURIComponent(userId)}/approve`, "POST", {});
      setMessage(`Approved ${userId}`);
      await loadRows();
    } catch (e: any) {
      setError(e?.message || "Failed to approve user.");
    } finally {
      setBusyId("");
    }
  }

  async function rejectUser(userId: string) {
    const reason = window.prompt("Reason for rejection:", "Document was blurry");
    if (reason === null) return;

    try {
      setBusyId(userId);
      setError("");
      setMessage("");
      await apiAuth(`/admin/kyc/users/${encodeURIComponent(userId)}/reject`, "POST", { reason });
      setMessage(`Rejected ${userId}`);
      await loadRows();
    } catch (e: any) {
      setError(e?.message || "Failed to reject user.");
    } finally {
      setBusyId("");
    }
  }

  function fileLink(userId: string, label: string) {
    const files = filesByUser[userId] || [];
    const hit =
      files.find((f) => f.label === label) ||
      files.find((f) => f.name.toLowerCase().includes(label));
    if (!hit) return null;
    return hit.url;
  }

  useEffect(() => {
    loadRows();
  }, []);

  return (
    <PlayerShell
      title="Admin KYC"
      subtitle="Review user verification status and KYC documents."
      fullWidth
    >
      <div style={container}>
        {error ? <div style={errorStyle}>{error}</div> : null}
        {message ? <div style={successStyle}>{message}</div> : null}

        <div style={toolbar}>
          <div>
            <div style={toolbarTitle}>KYC Users</div>
            <div style={toolbarSub}>{rows.length} users loaded</div>
          </div>
          <button type="button" style={refreshBtn} onClick={loadRows}>
            Refresh
          </button>
        </div>

        <div style={tableWrap}>
          <div style={tableHeader}>
            <div>User ID</div>
            <div>Status</div>
            <div>Docs</div>
            <div>Verified At</div>
            <div>Reason</div>
            <div>Actions</div>
          </div>

          {loading ? (
            <div style={emptyRow}>Loading KYC users...</div>
          ) : rows.length === 0 ? (
            <div style={emptyRow}>No users found.</div>
          ) : (
            rows.map((row) => {
              const front = fileLink(row.id, "front");
              const back = fileLink(row.id, "back");
              const selfie = fileLink(row.id, "selfie");
              const anyFiles = filesByUser[row.id]?.length;

              return (
                <div key={row.id} style={tableRow}>
                  <div style={mono}>{row.id}</div>

                  <div>
                    <span style={badgeStyle(row.kyc_status)}>
                      {String(row.kyc_status || "unverified")}
                    </span>
                  </div>

                  <div style={docLinks}>
                    {front ? (
                      <a href={front} target="_blank" rel="noreferrer" style={docBtn}>
                        View Front
                      </a>
                    ) : null}
                    {back ? (
                      <a href={back} target="_blank" rel="noreferrer" style={docBtn}>
                        View Back
                      </a>
                    ) : null}
                    {selfie ? (
                      <a href={selfie} target="_blank" rel="noreferrer" style={docBtn}>
                        View Selfie
                      </a>
                    ) : null}
                    {!anyFiles ? <span style={docMissing}>No files</span> : null}
                  </div>

                  <div>{fmtDate(row.kyc_verified_at)}</div>
                  <div style={reasonCell}>{row.kyc_rejected_reason || "-"}</div>

                  <div style={actions}>
                    <button
                      type="button"
                      style={approveBtn}
                      disabled={busyId === row.id}
                      onClick={() => approveUser(row.id)}
                    >
                      {busyId === row.id ? "..." : "Approve"}
                    </button>

                    <button
                      type="button"
                      style={rejectBtn}
                      disabled={busyId === row.id}
                      onClick={() => rejectUser(row.id)}
                    >
                      {busyId === row.id ? "..." : "Reject"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </PlayerShell>
  );
}

const container: CSSProperties = {
  width: "100%",
  maxWidth: 1400,
  margin: "0 auto",
  display: "grid",
  gap: 16,
};

const toolbar: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const toolbarTitle: CSSProperties = {
  color: "#fff",
  fontSize: 20,
  fontWeight: 900,
};

const toolbarSub: CSSProperties = {
  color: "#9fb0bf",
  fontSize: 13,
  marginTop: 4,
};

const refreshBtn: CSSProperties = {
  minHeight: 42,
  padding: "0 14px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "#213743",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
};

const tableWrap: CSSProperties = {
  background: "#1a2c38",
  border: "1px solid rgba(255,255,255,0.05)",
  borderRadius: 16,
  overflow: "hidden",
};

const tableHeader: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.4fr 0.8fr 1.4fr 1fr 1.2fr 1fr",
  gap: 10,
  padding: "14px 16px",
  background: "#13202a",
  color: "#9fb0bf",
  fontSize: 12,
  fontWeight: 900,
  textTransform: "uppercase",
};

const tableRow: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.4fr 0.8fr 1.4fr 1fr 1.2fr 1fr",
  gap: 10,
  padding: "14px 16px",
  borderTop: "1px solid rgba(255,255,255,0.05)",
  color: "#fff",
  alignItems: "center",
  fontSize: 13,
};

const emptyRow: CSSProperties = {
  padding: 18,
  color: "#9fb0bf",
};

const mono: CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  color: "#dbe7ee",
  overflowWrap: "anywhere",
};

const reasonCell: CSSProperties = {
  color: "#cbd5e1",
  overflowWrap: "anywhere",
};

const actions: CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const docLinks: CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const docBtn: CSSProperties = {
  textDecoration: "none",
  minHeight: 34,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 10px",
  borderRadius: 10,
  background: "#213743",
  color: "#fff",
  border: "1px solid rgba(255,255,255,0.08)",
  fontWeight: 800,
  fontSize: 12,
};

const docMissing: CSSProperties = {
  color: "#9fb0bf",
  fontSize: 12,
};

const approveBtn: CSSProperties = {
  minHeight: 38,
  padding: "0 12px",
  borderRadius: 10,
  border: "none",
  background: "#00e701",
  color: "#071824",
  fontWeight: 900,
  cursor: "pointer",
};

const rejectBtn: CSSProperties = {
  minHeight: 38,
  padding: "0 12px",
  borderRadius: 10,
  border: "1px solid rgba(239,68,68,0.22)",
  background: "rgba(239,68,68,0.14)",
  color: "#fecaca",
  fontWeight: 900,
  cursor: "pointer",
};

const badgeBase: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 30,
  padding: "5px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
  whiteSpace: "nowrap",
};

const errorStyle: CSSProperties = {
  background: "rgba(239,68,68,0.12)",
  color: "#fecaca",
  border: "1px solid rgba(239,68,68,0.22)",
  borderRadius: 12,
  padding: "10px 12px",
  fontWeight: 700,
};

const successStyle: CSSProperties = {
  background: "rgba(0,231,1,0.12)",
  color: "#86efac",
  border: "1px solid rgba(0,231,1,0.22)",
  borderRadius: 12,
  padding: "10px 12px",
  fontWeight: 700,
};
