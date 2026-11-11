"use client";

import { useEffect, useState } from "react";

type Order = { id: number; status: "placed" | "preparing" | "ready"; total: number; student_name: string; pickup_time: string; items: string[] };
const columns = [
  { status: "placed", title: "New orders", action: "Start preparing" },
  { status: "preparing", title: "Preparing", action: "Mark ready" },
  { status: "ready", title: "Ready for pickup", action: "Collected" },
] as const;

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const load = () => fetch("/api/kitchen").then(async (res) => {
    const body = await res.json(); if (!res.ok) throw new Error(body.error ?? "Could not load orders");
    setOrders(body.orders); setError("");
  }).catch((err) => setError(err instanceof Error ? err.message : "Could not load orders"));
  useEffect(() => { load(); const timer = setInterval(load, 3000); return () => clearInterval(timer); }, []);
  async function advance(order: Order) {
    const next = order.status === "placed" ? "preparing" : order.status === "preparing" ? "ready" : "collected";
    const res = await fetch("/api/kitchen", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order_id: order.id, status: next }) });
    if (!res.ok) { const body = await res.json(); setError(body.error ?? "Could not update order"); return; }
    load();
  }
  return <main className="min-h-screen bg-slate-950 p-4 text-white md:p-8">
    <header className="mb-6 flex items-center justify-between"><div><h1 className="text-2xl font-semibold">CampusBite Kitchen</h1><p className="text-sm text-slate-400">Live order board</p></div><span className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm text-emerald-300">● Live</span></header>
    {error && <p className="mb-4 text-sm text-red-300">{error}</p>}
    <div className="grid gap-4 md:grid-cols-3">{columns.map((column) => <section key={column.status} className="rounded-xl bg-slate-900 p-3">
      <h2 className="mb-3 font-semibold">{column.title} <span className="text-sm text-slate-500">({orders.filter((o) => o.status === column.status).length})</span></h2>
      <div className="space-y-3">{orders.filter((o) => o.status === column.status).map((order) => <article key={order.id} className="rounded-lg border border-slate-700 bg-slate-800 p-3">
        <div className="flex justify-between font-medium"><span>Order #{order.id}</span><span>{order.pickup_time}</span></div>
        <p className="mt-2 text-sm text-slate-300">{order.student_name}</p><p className="text-sm text-slate-300">{order.items.join(", ")}</p><p className="mt-2 text-sm">Rs {order.total}</p>
        <button onClick={() => advance(order)} className="mt-3 w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium hover:bg-emerald-500">{column.action}</button>
      </article>)}</div>
    </section>)}</div>
  </main>;
}
