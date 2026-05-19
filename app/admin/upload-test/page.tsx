"use client";

import { useState } from "react";

export default function UploadTestPage() {
  const [msg, setMsg] = useState("");

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <h1 className="text-2xl font-black">Upload Test</h1>
      <input
        type="file"
        accept="image/*"
        className="mt-5 block w-full rounded-xl bg-slate-900 p-4"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return setMsg("No file selected");
          setMsg("Uploading " + file.name);
          const fd = new FormData();
          fd.append("file", file);
          const res = await fetch("/ui-api/upload", { method: "POST", body: fd });
          const text = await res.text();
          setMsg(text);
        }}
      />
      <pre className="mt-5 whitespace-pre-wrap break-all rounded-xl bg-slate-900 p-4">{msg}</pre>
    </div>
  );
}
