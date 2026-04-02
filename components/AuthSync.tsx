"use client";

import { useEffect } from "react";

export default function AuthSync() {
  useEffect(() => {
    function broadcast() {
      window.dispatchEvent(new Event("coin2win-auth-changed"));
    }

    broadcast();

    window.addEventListener("focus", broadcast);
    window.addEventListener("storage", broadcast);

    return () => {
      window.removeEventListener("focus", broadcast);
      window.removeEventListener("storage", broadcast);
    };
  }, []);

  return null;
}
