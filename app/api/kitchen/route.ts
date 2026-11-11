import { NextResponse } from "next/server";
import { z } from "zod";
import { formatSlot } from "@/lib/campusbite";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const updateSchema = z.object({
  order_id: z.number().int().positive(),
  status: z.enum(["preparing", "ready", "collected"]),
});

export async function GET() {
  const { data, error } = await getSupabase()
    .from("orders")
    .select("id, status, total, created_at, wallets(name), pickup_slots(slot_time), order_items(quantity, menu_items(name))")
    .in("status", ["placed", "preparing", "ready"])
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[GET /api/kitchen]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({
    orders: data.map((order) => ({
      id: order.id,
      status: order.status,
      total: order.total,
      student_name: Array.isArray(order.wallets) ? (order.wallets[0] as any)?.name : (order.wallets as any)?.name,
      pickup_time: Array.isArray(order.pickup_slots) ? formatSlot((order.pickup_slots[0] as any)?.slot_time ?? "") : formatSlot((order.pickup_slots as any)?.slot_time ?? ""),
      items: order.order_items.map((item) => `${item.quantity}x ${Array.isArray(item.menu_items) ? (item.menu_items[0] as any)?.name : (item.menu_items as any)?.name}`),
    })),
  });
}

export async function POST(request: Request) {
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid order status", details: parsed.error.issues }, { status: 400 });
  }
  const { order_id, status } = parsed.data;
  const { data: order, error: findError } = await getSupabase().from("orders").select("status").eq("id", order_id).single();
  if (findError) {
    console.error("[POST /api/kitchen]", findError.message);
    return NextResponse.json({ error: findError.message }, { status: 500 });
  }
  const nextStatus: Record<string, string> = { placed: "preparing", preparing: "ready", ready: "collected" };
  if (nextStatus[order.status] !== status) {
    return NextResponse.json({ error: `Order can only move from ${order.status} to ${nextStatus[order.status] ?? "its next status"}.` }, { status: 409 });
  }
  const { data, error } = await getSupabase().from("orders").update({ status }).eq("id", order_id).select("id, status").single();
  if (error) {
    console.error("[POST /api/kitchen]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ order: data });
}
