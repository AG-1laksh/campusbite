"use client";

import { useEffect, useState } from "react";

type MenuItem = { id: number; name: string; category: string; price: number; is_veg: boolean; stock: number; description: string };
const groups = ["meal", "snack", "sweet", "drink"];

export default function MenuPanel({ refreshKey }: { refreshKey: number }) {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const load = () => fetch("/api/menu").then(async (res) => {
      const body = await res.json(); if (!res.ok) throw new Error(body.error ?? "Could not load menu");
      if (active) { setMenu(body.menu); setError(""); }
    }).catch((err) => active && setError(err instanceof Error ? err.message : "Could not load menu"));
    load(); const timer = setInterval(load, 5000);
    return () => { active = false; clearInterval(timer); };
  }, [refreshKey]);
  return <div className="rounded-xl border border-slate-200 bg-white p-4">
    <div className="mb-3 flex items-baseline justify-between"><h2 className="font-semibold">Today&apos;s menu</h2><span className="text-xs text-slate-500">Green = vegetarian</span></div>
    {error && <p className="text-sm text-red-600">{error}</p>}
    {groups.map((group) => {
      const items = menu.filter((item) => item.category === group);
      if (!items.length) return null;
      return <section key={group} className="mb-4 last:mb-0"><h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{group}s</h3>
        <ul className="divide-y divide-slate-100">{items.map((item) => <li key={item.id} className="flex items-center gap-2 py-2 text-sm">
          <span className={`h-2 w-2 rounded-full ${item.is_veg ? "bg-emerald-500" : "bg-red-500"}`} />
          <span className={item.stock === 0 ? "flex-1 text-slate-400" : "flex-1"}>{item.name}</span>
          {item.stock === 0 ? <span className="rounded bg-red-50 px-1.5 py-0.5 text-xs text-red-600">Sold out</span> : item.stock <= 3 ? <span className="rounded bg-amber-50 px-1.5 py-0.5 text-xs text-amber-700">Only {item.stock} left</span> : null}
          <span className="font-medium">Rs {item.price}</span>
        </li>)}</ul>
      </section>;
    })}
  </div>;
}
