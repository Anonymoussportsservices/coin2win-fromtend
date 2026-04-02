"use client";

import { useEffect, useState } from "react";

export type WalletData = {
  user_id?: string;
  balance_total?: number;
  balance_available?: number;
  balance_pending?: number;
  updated_at?: string;
};

export function useWallet(userId: string, refreshMs = 5000) {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState("");

  async function loadWallet(currentUserId = userId) {
    if (!currentUserId?.trim()) {
      setWallet(null);
      return null;
    }

    setWalletLoading(true);

    try {
      const res = await fetch(`/api/wallet/${encodeURIComponent(currentUserId)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.detail || data?.message || "Failed to load wallet");
      }

      setWallet(data);
      setWalletError("");
      return data;
    } catch (err) {
      setWalletError(err instanceof Error ? err.message : "Failed to load wallet");
      return null;
    } finally {
      setWalletLoading(false);
    }
  }

  useEffect(() => {
    if (!userId?.trim()) {
      setWallet(null);
      return;
    }

    loadWallet(userId);
    const timer = setInterval(() => loadWallet(userId), refreshMs);
    return () => clearInterval(timer);
  }, [userId, refreshMs]);

  return {
    wallet,
    walletLoading,
    walletError,
    refreshWallet: loadWallet,
    setWallet,
  };
}
