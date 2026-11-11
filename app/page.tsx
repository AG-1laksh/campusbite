"use client";

import { useState } from "react";
import AgentChat from "@/components/AgentChat";
import WalletOrders from "@/components/WalletOrders";
import MenuPanel from "@/components/MenuPanel";

/*
 * HOME PAGE
 * Left: the agent chat. Right: the live student canteen data.
 */
export default function HomePage() {
  // Changes every time the agent writes data, so the list on the right reloads.
  const [refreshKey, setRefreshKey] = useState(0);

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">CampusBite · SRM canteen ordering agent</h1>
          <p className="text-sm text-slate-500">Order your canteen favourites in plain English.</p>
        </div>
        <button onClick={logout} className="text-sm text-slate-500 hover:text-slate-900">
          Log out
        </button>
        <a href="/kitchen" className="text-sm text-emerald-700 hover:underline">Open kitchen screen</a>
      </header>
      <div className="grid gap-4 md:grid-cols-5">
        <section className="md:col-span-3">
          <AgentChat onDataChanged={() => setRefreshKey((k) => k + 1)} />
        </section>
        <section className="md:col-span-2">
          <WalletOrders refreshKey={refreshKey} />
          <MenuPanel refreshKey={refreshKey} />
        </section>
      </div>
    </main>
  );
}
