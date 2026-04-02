"use client";

import { useEffect, useState } from "react";

export default function TreePage() {
  const [tree, setTree] = useState<any[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const vid = params.get("viewer_id");

    if (!vid) {
      alert("Missing viewer_id");
      return;
    }

    const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY;

    fetch(`/api/admin/hierarchy/my-tree/${vid}`, {
      headers: { "X-Admin-Key": ADMIN_KEY || "" },
    })
      .then((res) => res.json())
      .then((json) => setTree(json.tree || []));
  }, []);

  return (
    <div className="p-6 text-white">
      <h1 className="text-xl mb-4">Hierarchy Tree</h1>

      {tree.map((node: any) => (
        <div key={node.id} style={{ marginLeft: node.depth * 20 }}>
          <div className="bg-[#1e293b] p-2 my-1 rounded flex justify-between">
            <span>{node.role} → {node.id}</span>

            <a
              href={`/agent/dashboard?viewer_id=${node.id}`}
              className="text-blue-400"
            >
              View
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
