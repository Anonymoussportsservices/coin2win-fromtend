"use client";

import { useEffect, useState } from "react";
import { fetchPublicBrand, DEFAULT_BRAND, type PublicBrand } from "@/lib/publicBrand";

export default function FloatingSupport() {
  const [open, setOpen] = useState(false);
  const [brand, setBrand] = useState<PublicBrand>(DEFAULT_BRAND);

  useEffect(() => {
    fetchPublicBrand().then((b) => setBrand(b || DEFAULT_BRAND));
  }, []);

  const email = brand.support_email || "";
  const telegram = (brand as any).support_telegram || (brand as any).telegram || (brand as any).telegram_url || "";
  const hasContacts = Boolean(email || telegram);

  return (
    <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
      {open && (
        <div className="mb-3 w-60 overflow-hidden rounded-3xl border border-white/10 bg-[#13202a]/95 p-2 shadow-[0_22px_70px_rgba(0,0,0,0.55)] backdrop-blur">
          <div className="px-3 py-2">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-emerald-300">Support</div>
            <div className="mt-1 text-sm font-bold text-white">How can we help?</div>
          </div>

          {email ? (
            <a
              href={`mailto:${email}`}
              className="mt-1 flex items-center gap-3 rounded-2xl border border-white/5 bg-black/20 px-3 py-3 text-sm font-black text-white transition hover:bg-[#213743]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-lg">✉️</span>
              <span>Email Support</span>
            </a>
          ) : null}

          {telegram ? (
            <a
              href={telegram.startsWith("http") ? telegram : `https://t.me/${telegram.replace("@", "")}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 flex items-center gap-3 rounded-2xl border border-white/5 bg-black/20 px-3 py-3 text-sm font-black text-white transition hover:bg-[#213743]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-lg">💬</span>
              <span>Telegram</span>
            </a>
          ) : null}

          {!hasContacts ? (
            <div className="rounded-2xl border border-white/5 bg-black/20 px-3 py-3 text-sm font-bold text-slate-400">
              Support contact coming soon.
            </div>
          ) : null}
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        aria-label="Open support"
        className="group relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-[#213743] text-white shadow-[0_18px_45px_rgba(0,0,0,0.45)] transition hover:-translate-y-0.5 hover:border-emerald-400/40 hover:bg-[#2f4553] sm:h-16 sm:w-16 sm:rounded-3xl"
      >
        <span className="absolute inset-0 rounded-2xl bg-emerald-400/10 opacity-0 blur-xl transition group-hover:opacity-100 sm:rounded-3xl" />
        <span className="relative text-2xl sm:text-3xl">?</span>
      </button>
    </div>
  );
}
