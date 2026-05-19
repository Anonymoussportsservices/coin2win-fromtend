"use client";

import { useEffect, useState } from "react";
import AgentShell from "@/components/AgentShell";

type Banner = {
  badge?: string;
  title?: string;
  subtitle?: string;
  cta_label?: string;
  cta_href?: string;
  image_url?: string;
  mobile_image_url?: string;
};

type FaqItem = {
  question?: string;
  answer?: string;
};

type PromoCard = {
  title?: string;
  image_url?: string;
  description?: string;
  terms?: string;
  cta_label?: string;
  cta_href?: string;
};

type Brand = {
  id: number;
  brand_name: string;
  domain: string;
  logo_url?: string | null;
  favicon_url?: string | null;
  support_email?: string | null;
  support_telegram?: string | null;
  home_banners_json?: Banner[];
  casino_banners_json?: Banner[];
  promotion_faq_json?: FaqItem[];
  promotion_cards_json?: PromoCard[];
};

const CTA_HREF_OPTIONS = [
  { label: "Casino Lobby", value: "/casino" },
  { label: "Slots", value: "/casino/slots" },
  { label: "Live Casino", value: "/casino/live" },
  { label: "Originals", value: "/casino/originals" },
  { label: "Table Games", value: "/casino/table-games" },
  { label: "Promotions", value: "/promotions" },
  { label: "Cashier", value: "/cashier" },
  { label: "Register", value: "/register" },
  { label: "Login", value: "/login" },
];

const emptyBanner: Banner = {
  badge: "",
  title: "",
  subtitle: "",
  cta_label: "",
  cta_href: "/casino",
  image_url: "",
  mobile_image_url: "",
};

function CtaHrefPicker({
  value,
  onChange,
  inputClassName,
}: {
  value?: string;
  onChange: (value: string) => void;
  inputClassName: string;
}) {
  return (
    <select
      className={inputClassName}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Select CTA destination</option>
      {CTA_HREF_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}


export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [message, setMessage] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  async function loadBrands() {
    const res = await fetch("/ui-api/admin/brands", { cache: "no-store" });
    const data = await res.json();
    setBrands(Array.isArray(data.brands) ? data.brands : []);
  }

  useEffect(() => {
    try {
      const session = JSON.parse(localStorage.getItem("agent_session_data") || "{}");
      const id = String(session?.id || "").toLowerCase();
      const role = String(session?.role || "").toLowerCase();

      if (!id) {
        window.location.href = "/agent/login";
        return;
      }

      if (id !== "supercoin" && role !== "superadmin") {
        setAccessDenied(true);
        return;
      }

      setAuthorized(true);
      loadBrands();
    } catch {
      window.location.href = "/agent/login";
    }
  }, []);

  function openEditor(brand: Brand) {
    setMessage("");
    setEditing({
      ...brand,
      home_banners_json: Array.isArray(brand.home_banners_json)
        ? JSON.parse(JSON.stringify(brand.home_banners_json))
        : [],
      casino_banners_json: Array.isArray(brand.casino_banners_json)
        ? JSON.parse(JSON.stringify(brand.casino_banners_json))
        : [],
      promotion_faq_json: Array.isArray(brand.promotion_faq_json)
        ? JSON.parse(JSON.stringify(brand.promotion_faq_json))
        : [],
      promotion_cards_json: Array.isArray((brand as any).promotion_cards_json)
        ? JSON.parse(JSON.stringify((brand as any).promotion_cards_json))
        : [],
    });
  }

  function updateBanner(index: number, patch: Partial<Banner>) {
    setEditing((prev) => {
      if (!prev) return prev;
      const banners = [...(prev.home_banners_json || [])];
      banners[index] = { ...(banners[index] || emptyBanner), ...patch };
      return { ...prev, home_banners_json: banners };
    });
  }

  async function uploadBannerImage(index: number, file: File) {
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/ui-api/upload", {
      method: "POST",
      body: fd,
    });

    const data = await res.json();
    if (!res.ok || !data?.url) {
      alert("Upload failed");
      return;
    }

    const finalUrl = data.url.startsWith("http")
      ? data.url
      : `${window.location.origin}${data.url}`;

    updateBanner(index, { image_url: finalUrl });
    setMessage(`Image uploaded: ${finalUrl}`);
  }


  async function uploadBannerMobileImage(index: number, file: File) {
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/ui-api/upload", { method: "POST", body: fd });
    const data = await res.json();

    if (!res.ok || !data?.url) {
      alert("Upload failed");
      return;
    }

    const finalUrl = data.url.startsWith("http") ? data.url : `${window.location.origin}${data.url}`;
    updateBanner(index, { mobile_image_url: finalUrl });
    setMessage(`Mobile banner uploaded: ${finalUrl}`);
  }

  function updateCasinoBanner(index: number, patch: Partial<Banner>) {
    setEditing((prev) => {
      if (!prev) return prev;
      const banners = [...(prev.casino_banners_json || [])];
      banners[index] = { ...(banners[index] || emptyBanner), ...patch };
      return { ...prev, casino_banners_json: banners };
    });
  }

  async function uploadCasinoBannerImage(index: number, file: File) {
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/ui-api/upload", { method: "POST", body: fd });
    const data = await res.json();

    if (!res.ok || !data?.url) {
      alert("Upload failed");
      return;
    }

    const finalUrl = data.url.startsWith("http") ? data.url : `${window.location.origin}${data.url}`;
    updateCasinoBanner(index, { image_url: finalUrl });
    setMessage(`Casino banner uploaded: ${finalUrl}`);
  }

  async function uploadCasinoBannerMobileImage(index: number, file: File) {
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/ui-api/upload", { method: "POST", body: fd });
    const data = await res.json();

    if (!res.ok || !data?.url) {
      alert("Upload failed");
      return;
    }

    const finalUrl = data.url.startsWith("http") ? data.url : `${window.location.origin}${data.url}`;
    updateCasinoBanner(index, { mobile_image_url: finalUrl });
    setMessage(`Casino mobile banner uploaded: ${finalUrl}`);
  }

  async function uploadPromoCardImage(index: number, file: File) {
    if (!editing) return;

    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/ui-api/upload", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data?.url) {
      setMessage("Promotion image upload failed");
      return;
    }

    const finalUrl = data.url.startsWith("http") ? data.url : `${window.location.origin}${data.url}`;
    const cards = [...(editing.promotion_cards_json || [])];
    cards[index] = { ...cards[index], image_url: finalUrl };
    setEditing({ ...editing, promotion_cards_json: cards });
    setMessage(`Promotion image uploaded: ${finalUrl}`);
  }

  async function saveBrand() {
    if (!editing) return;

    const payload = {
      ...editing,
      logo_url: editing.logo_url || "",
      favicon_url: editing.favicon_url || "",
      support_email: editing.support_email || "",
      support_telegram: editing.support_telegram || "",
      home_banners_json: editing.home_banners_json || [],
      casino_banners_json: editing.casino_banners_json || [],
      promotion_faq_json: editing.promotion_faq_json || [],
      promotion_cards_json: editing.promotion_cards_json || [],
    };

    const res = await fetch(`/ui-api/admin/brands/update/${editing.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok) {
      alert(data?.detail || "Save failed");
      return;
    }

    await loadBrands();
    setMessage("Saved ✅");
    setEditing(null);
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-[#071824] p-6 text-white">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <div className="text-xl font-black text-red-200">Access denied</div>
          <div className="mt-2 text-sm text-red-100">You do not have permission to manage Brand CMS.</div>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return <div className="min-h-screen bg-[#071824] p-6 text-white">Checking access...</div>;
  }

  return (
    <AgentShell title="Brand CMS" subtitle="Manage brand assets, banners, contact info, and FAQ.">
      <div className="min-h-screen bg-[#071824] p-3 text-white sm:p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-black">Brand CMS</h1>
        <p className="text-sm text-slate-400">Manage brands, banners, support info, and CMS content.</p>
      </div>

      {message ? (
        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200 break-all">
          {message}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {brands.map((brand) => (
          <div key={brand.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="text-lg font-black">{brand.brand_name}</div>
            <div className="text-sm text-slate-400 break-all">{brand.domain}</div>
            <div className="mt-2 text-xs text-slate-500">
              {(brand.home_banners_json || []).length} home banners • {(brand.casino_banners_json || []).length} casino banners
            </div>
            <button
              onClick={() => openEditor(brand)}
              className="mt-4 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-black text-[#071824]"
            >
              Edit CMS
            </button>
          </div>
        ))}
      </div>

      {editing ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-3">
          <div className="mx-auto my-3 w-full max-w-3xl rounded-2xl bg-slate-950 p-4 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">{editing.brand_name}</h2>
                <p className="text-xs text-slate-400 break-all">{editing.domain}</p>
              </div>
              <button onClick={() => setEditing(null)} className="rounded-xl bg-slate-800 px-3 py-2 text-sm">
                Close
              </button>
            </div>

                        <div className="mb-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-xs leading-5 text-slate-300">
              <div className="mb-2 text-sm font-black text-white">Banner image specs</div>
              <div className="font-bold text-emerald-300">Home & Casino Banners</div>
              <div>Use one main banner image for desktop and mobile.</div>
              <div>Aspect ratio: 16:5 · Ideal: 1920×600 · Minimum: 1600×500</div>
              <div>Keep important text/logo centered with safe margins.</div>

              <div className="mt-3 font-bold text-emerald-300">Promotion Cards</div>
              <div>Aspect ratio: 16:9 · Recommended: 1200×675 or 1280×720</div>

              <div className="mt-3 font-bold text-emerald-300">Formats</div>
              <div>WEBP preferred · JPG or PNG accepted</div>
              <div>Ideal: under 500KB · Max: 1.5MB</div>
            </div>

            <div className="mb-4 rounded-2xl border border-slate-800 bg-slate-900 p-3">
              <div className="mb-3 text-sm font-black text-white">Brand assets & contact</div>
              <input className="mb-2 w-full rounded-lg bg-slate-950 p-2 text-sm" placeholder="Logo URL" value={editing.logo_url || ""} onChange={(e) => setEditing({ ...editing, logo_url: e.target.value })} />
              <input className="mb-2 block w-full rounded-lg bg-slate-900 p-3 text-xs" type="file" accept="image/*" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const fd = new FormData();
                fd.append("file", file);
                const res = await fetch("/ui-api/upload", { method: "POST", body: fd });
                const data = await res.json();
                if (data?.url) setEditing({ ...editing, logo_url: `${window.location.origin}${data.url}` });
                e.target.value = "";
              }} />

              <input className="mb-2 w-full rounded-lg bg-slate-950 p-2 text-sm" placeholder="Favicon URL" value={editing.favicon_url || ""} onChange={(e) => setEditing({ ...editing, favicon_url: e.target.value })} />
              <input className="mb-2 block w-full rounded-lg bg-slate-900 p-3 text-xs" type="file" accept="image/*" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const fd = new FormData();
                fd.append("file", file);
                const res = await fetch("/ui-api/upload", { method: "POST", body: fd });
                const data = await res.json();
                if (data?.url) setEditing({ ...editing, favicon_url: `${window.location.origin}${data.url}` });
                e.target.value = "";
              }} />
              <input className="mb-2 w-full rounded-lg bg-slate-950 p-2 text-sm" placeholder="Contact email" value={editing.support_email || ""} onChange={(e) => setEditing({ ...editing, support_email: e.target.value })} />
              <input className="w-full rounded-lg bg-slate-950 p-2 text-sm" placeholder="Telegram account / link" value={editing.support_telegram || ""} onChange={(e) => setEditing({ ...editing, support_telegram: e.target.value })} />
            </div>

            <div className="grid gap-3">
              {(editing.home_banners_json || []).map((banner, index) => (
                <div key={index} className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="font-black">Banner #{index + 1}</div>
                    <button
                      onClick={() => {
                        setEditing((prev) => {
                          if (!prev) return prev;
                          const banners = [...(prev.home_banners_json || [])];
                          banners.splice(index, 1);
                          return { ...prev, home_banners_json: banners };
                        });
                      }}
                      className="rounded-lg bg-red-500/10 px-3 py-1 text-xs font-bold text-red-300"
                    >
                      Remove
                    </button>
                  </div>

                  {banner.image_url ? (
                    <div className="mb-3">
                      <img
                        src={banner.image_url}
                        alt="Banner preview"
                        className="w-full rounded-xl border border-slate-700 object-cover aspect-[16/5]"
                      />
                      <div className="mt-1 break-all text-xs text-emerald-300">{banner.image_url}</div>
                    </div>
                  ) : null}

                  <input className="mb-2 w-full rounded-lg bg-slate-950 p-2 text-sm" placeholder="Badge" value={banner.badge || ""} onChange={(e) => updateBanner(index, { badge: e.target.value })} />
                  <input className="mb-2 w-full rounded-lg bg-slate-950 p-2 text-sm" placeholder="Title optional" value={banner.title || ""} onChange={(e) => updateBanner(index, { title: e.target.value })} />
                  <input className="mb-2 w-full rounded-lg bg-slate-950 p-2 text-sm" placeholder="CTA label" value={banner.cta_label || ""} onChange={(e) => updateBanner(index, { cta_label: e.target.value })} />
                  <div className="mb-2">
                    <CtaHrefPicker
                      value={banner.cta_href || ""}
                      onChange={(value) => updateBanner(index, { cta_href: value })}
                      inputClassName="w-full rounded-lg bg-slate-950 p-2 text-sm"
                    />
                  </div>
                  <input className="mb-2 w-full rounded-lg bg-slate-950 p-2 text-sm" placeholder="Image URL" value={banner.image_url || ""} onChange={(e) => updateBanner(index, { image_url: e.target.value })} />
                  <input className="mb-2 w-full rounded-lg bg-slate-950 p-2 text-sm" placeholder="Mobile Image URL optional" value={banner.mobile_image_url || ""} onChange={(e) => updateBanner(index, { mobile_image_url: e.target.value })} />

                  <div className="grid gap-2">
                    <div className="rounded-xl border border-dashed border-slate-600 bg-slate-950 p-3 text-sm font-bold text-slate-200">
                      <div className="mb-2">Upload / Replace Image</div>
                      <input
                        key={`upload-desktop-${editing.id}-${index}-${banner.image_url || "empty"}`}
                        type="file"
                        accept="image/*"
                        className="block w-full rounded-lg bg-slate-900 p-3 text-xs"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setMessage(`Uploading desktop banner #${index + 1}: ${file.name}`);
                          await uploadBannerImage(index, file);
                          e.target.value = "";
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setEditing((prev) => {
                  if (!prev) return prev;
                  return { ...prev, home_banners_json: [...(prev.home_banners_json || []), { ...emptyBanner }] };
                });
              }}
              className="mt-4 rounded-xl bg-sky-500 px-4 py-2 text-sm font-black text-white"
            >
              + Add Banner
            </button>

            <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-3">
              <div className="mb-3 text-sm font-black text-white">Casino Lobby Banners</div>
              <div className="grid gap-3">
                {(editing.casino_banners_json || []).map((banner, index) => (
                  <div key={index} className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="font-black">Casino Banner #{index + 1}</div>
                      <button
                        onClick={() => {
                          setEditing((prev) => {
                            if (!prev) return prev;
                            const banners = [...(prev.casino_banners_json || [])];
                            banners.splice(index, 1);
                            return { ...prev, casino_banners_json: banners };
                          });
                        }}
                        className="rounded-lg bg-red-500/10 px-3 py-1 text-xs font-bold text-red-300"
                      >
                        Remove
                      </button>
                    </div>

                    {banner.image_url ? (
                      <div className="mb-3">
                        <img src={banner.image_url} alt="Casino banner preview" className="w-full rounded-xl border border-slate-700 object-cover aspect-[16/5]" />
                        <div className="mt-1 break-all text-xs text-emerald-300">{banner.image_url}</div>
                      </div>
                    ) : null}

                    <input className="mb-2 w-full rounded-lg bg-slate-900 p-2 text-sm" placeholder="Badge optional" value={banner.badge || ""} onChange={(e) => updateCasinoBanner(index, { badge: e.target.value })} />
                    <input className="mb-2 w-full rounded-lg bg-slate-900 p-2 text-sm" placeholder="Title optional" value={banner.title || ""} onChange={(e) => updateCasinoBanner(index, { title: e.target.value })} />
                    <input className="mb-2 w-full rounded-lg bg-slate-900 p-2 text-sm" placeholder="CTA label optional" value={banner.cta_label || ""} onChange={(e) => updateCasinoBanner(index, { cta_label: e.target.value })} />
                    <div className="mb-2">
                      <CtaHrefPicker
                        value={banner.cta_href || ""}
                        onChange={(value) => updateCasinoBanner(index, { cta_href: value })}
                        inputClassName="w-full rounded-lg bg-slate-900 p-2 text-sm"
                      />
                    </div>
                    <input className="mb-2 w-full rounded-lg bg-slate-900 p-2 text-sm" placeholder="Image URL" value={banner.image_url || ""} onChange={(e) => updateCasinoBanner(index, { image_url: e.target.value })} />
                    <input className="mb-2 w-full rounded-lg bg-slate-900 p-2 text-sm" placeholder="Mobile Image URL optional" value={banner.mobile_image_url || ""} onChange={(e) => updateCasinoBanner(index, { mobile_image_url: e.target.value })} />

                    <div className="grid gap-2">
                      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/60 p-3 text-sm font-bold text-slate-200">
                        <div className="mb-2">Upload / Replace Image</div>
                        <input
                          type="file"
                          accept="image/*"
                          className="block w-full rounded-lg bg-slate-950 p-3 text-xs"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            await uploadCasinoBannerImage(index, file);
                            e.target.value = "";
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  setEditing((prev) => {
                    if (!prev) return prev;
                    return { ...prev, casino_banners_json: [...(prev.casino_banners_json || []), { ...emptyBanner }] };
                  });
                }}
                className="mt-4 rounded-xl bg-sky-500 px-4 py-2 text-sm font-black text-white"
              >
                + Add Casino Banner
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-3">
              <div className="mb-3 text-sm font-black text-white">Promotion Cards</div>

              {(editing.promotion_cards_json || []).map((card, idx) => (
                <div key={idx} className="mb-3 rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="text-xs font-black uppercase tracking-[0.14em] text-emerald-300">Card {idx + 1}</div>
                    <button type="button" onClick={() => {
                      const cards = [...(editing.promotion_cards_json || [])];
                      cards.splice(idx, 1);
                      setEditing({ ...editing, promotion_cards_json: cards });
                    }} className="rounded-lg border border-red-400/30 bg-red-500/10 px-2 py-1 text-xs font-black text-red-200">
                      Remove
                    </button>
                  </div>

                  <input className="mb-2 w-full rounded-lg bg-slate-900 p-2 text-sm" placeholder="Title" value={card.title || ""} onChange={(e) => {
                    const cards = [...(editing.promotion_cards_json || [])];
                    cards[idx] = { ...cards[idx], title: e.target.value };
                    setEditing({ ...editing, promotion_cards_json: cards });
                  }} />

                  <input className="mb-2 w-full rounded-lg bg-slate-900 p-2 text-sm" placeholder="Image URL" value={card.image_url || ""} onChange={(e) => {
                    const cards = [...(editing.promotion_cards_json || [])];
                    cards[idx] = { ...cards[idx], image_url: e.target.value };
                    setEditing({ ...editing, promotion_cards_json: cards });
                  }} />

                  <div className="mb-2 rounded-xl border border-dashed border-slate-700 bg-slate-900/60 p-3 text-sm font-bold text-slate-200">
                    <div className="mb-2">Upload / Replace Promo Image</div>
                    <input
                      type="file"
                      accept="image/*"
                      className="block w-full rounded-lg bg-slate-950 p-3 text-xs"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        await uploadPromoCardImage(idx, file);
                        e.target.value = "";
                      }}
                    />
                  </div>

                  <textarea className="mb-2 min-h-[76px] w-full rounded-lg bg-slate-900 p-2 text-sm" placeholder="Description" value={card.description || ""} onChange={(e) => {
                    const cards = [...(editing.promotion_cards_json || [])];
                    cards[idx] = { ...cards[idx], description: e.target.value };
                    setEditing({ ...editing, promotion_cards_json: cards });
                  }} />

                  <textarea className="mb-2 min-h-[92px] w-full rounded-lg bg-slate-900 p-2 text-sm" placeholder="Terms / Conditions" value={card.terms || ""} onChange={(e) => {
                    const cards = [...(editing.promotion_cards_json || [])];
                    cards[idx] = { ...cards[idx], terms: e.target.value };
                    setEditing({ ...editing, promotion_cards_json: cards });
                  }} />

                  <div className="grid gap-2">
                    <input className="w-full rounded-lg bg-slate-900 p-2 text-sm" placeholder="CTA label" value={card.cta_label || ""} onChange={(e) => {
                      const cards = [...(editing.promotion_cards_json || [])];
                      cards[idx] = { ...cards[idx], cta_label: e.target.value };
                      setEditing({ ...editing, promotion_cards_json: cards });
                    }} />

                    <CtaHrefPicker
                      value={card.cta_href || ""}
                      onChange={(value) => {
                        const cards = [...(editing.promotion_cards_json || [])];
                        cards[idx] = { ...cards[idx], cta_href: value };
                        setEditing({ ...editing, promotion_cards_json: cards });
                      }}
                      inputClassName="w-full rounded-lg bg-slate-900 p-2 text-sm"
                    />
                  </div>

                  {card.image_url ? <img src={card.image_url} alt={card.title || "Promotion"} className="mt-3 aspect-[16/9] w-full rounded-xl object-cover" /> : null}
                </div>
              ))}

              <button type="button" onClick={() => {
                setEditing({
                  ...editing,
                  promotion_cards_json: [
                    ...(editing.promotion_cards_json || []),
                    { title: "", image_url: "", description: "", terms: "", cta_label: "Play Now", cta_href: "/casino" },
                  ],
                });
              }} className="mb-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm font-black text-emerald-200">
                + Add Promotion Card
              </button>

            </div>

            <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-3">
              <div className="mb-3 text-sm font-black text-white">FAQ</div>

              {(editing.promotion_faq_json || []).map((item, idx) => (
                <div key={idx} className="mb-3 rounded-xl bg-slate-950 p-3">
                  <input className="mb-2 w-full rounded-lg bg-slate-900 p-2 text-sm" placeholder="Question" value={item.question || ""} onChange={(e) => {
                    const faq = [...(editing.promotion_faq_json || [])];
                    faq[idx] = { ...faq[idx], question: e.target.value };
                    setEditing({ ...editing, promotion_faq_json: faq });
                  }} />
                  <textarea className="mb-2 min-h-[90px] w-full rounded-lg bg-slate-900 p-2 text-sm" placeholder="Answer" value={item.answer || ""} onChange={(e) => {
                    const faq = [...(editing.promotion_faq_json || [])];
                    faq[idx] = { ...faq[idx], answer: e.target.value };
                    setEditing({ ...editing, promotion_faq_json: faq });
                  }} />
                  <button className="rounded-lg bg-red-500/10 px-3 py-1 text-xs font-bold text-red-300" onClick={() => {
                    const faq = [...(editing.promotion_faq_json || [])];
                    faq.splice(idx, 1);
                    setEditing({ ...editing, promotion_faq_json: faq });
                  }}>
                    Remove FAQ
                  </button>
                </div>
              ))}
              <button className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-black text-white" onClick={() => {
                setEditing({ ...editing, promotion_faq_json: [...(editing.promotion_faq_json || []), { question: "", answer: "" }] });
              }}>
                + Add FAQ
              </button>
            </div>

            <div className="mt-5 flex gap-2">
              <button onClick={saveBrand} className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-[#071824]">
                Save
              </button>
              <button onClick={() => setEditing(null)} className="rounded-xl bg-slate-800 px-5 py-3 text-sm font-bold">
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
      </div>
    </AgentShell>
  );
}
