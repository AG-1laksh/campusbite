import { NextResponse } from "next/server";
import { CURRENT_STUDENT_ID, formatSlot } from "@/lib/campusbite";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabase();
  const [{ data: wallet, error: walletError }, { data: orders, error: ordersError }] = await Promise.all([
    supabase.from("wallets").select("name, balance").eq("student_id", CURRENT_STUDENT_ID).single(),
    supabase
      .from("orders")
      .select("id, status, total, pickup_slots(slot_time), order_items(quantity, menu_items(name))")
      .eq("student_id", CURRENT_STUDENT_ID)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  if (walletError || ordersError) {
    const message = walletError?.message ?? ordersError?.message ?? "Could not load student data";
    console.error("[GET /api/me]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
  return NextResponse.json({
    wallet,
    orders: orders.map((order) => ({
      id: order.id,
      status: order.status,
      total: order.total,
      pickup_time: Array.isArray(order.pickup_slots) ? formatSlot((order.pickup_slots[0] as any)?.slot_time ?? "") : formatSlot((order.pickup_slots as any)?.slot_time ?? ""),
      items: order.order_items.map((item) => `${item.quantity}x ${Array.isArray(item.menu_items) ? (item.menu_items[0] as any)?.name : (item.menu_items as any)?.name}`),
    })),
  });
}
