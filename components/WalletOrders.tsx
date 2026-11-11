"use client";

import { useEffect, useState } from "react";

type Order = { id: number; status: string; total: number; pickup_time: string; items: string[] };
type WalletData = { wallet: { name: string; balance: number }; orders: Order[] };

export default function WalletOrders({ refreshKey }: { refreshKey: number }) {
  const [data, setData] = useState<WalletData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = () => fetch("/api/me").then(async (res) => {
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not load orders");
      if (active) { setData(body); setError(""); }
    }).catch((err) => active && setError(err instanceof Error ? err.message : "Could not load orders"));
    load();
    const timer = setInterval(load, 5000);
    return () => { active = false; clearInterval(timer); };
  }, [refreshKey]);

  return (
    <div className="mb-4 rounded-xl bg-slate-900 p-4 text-white">
      {error && <p className="text-sm text-red-300">{error}</p>}
      {data && <>
        <div className="flex items-center justify-between">
          <div><p className="text-xs text-slate-400">Wallet · {data.wallet.name}</p><p className="text-2xl font-semibold">Rs {data.wallet.balance}</p></div>
          <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-xs text-emerald-300">S001</span>
        </div>
        <h2 className="mt-4 border-t border-slate-700 pt-3 text-sm font-semibold">My orders today</h2>
        {data.orders.length === 0 ? <p className="mt-2 text-sm text-slate-400">No orders yet.</p> : <ul className="divide-y divide-slate-700">
          {data.orders.map((order) => <li key={order.id} className="py-2 text-sm">
            <div className="flex justify-between"><span>Order #{order.id} · {order.pickup_time}</span><span className="text-emerald-300">Rs {order.total}</span></div>
            <div className="mt-1 flex justify-between gap-2 text-xs text-slate-300"><span>{order.items.join(", ")}</span><span className="rounded bg-white/10 px-1.5 py-0.5">{order.status}</span></div>
          </li>)}
        </ul>}
      </>}
    </div>
  );
}
