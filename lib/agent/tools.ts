import "server-only";
import { z } from "zod";
import { defineTool, type AgentTool } from "./defineTool";
import { getSupabase } from "../supabase";
import { CURRENT_STUDENT_ID, formatSlot } from "../campusbite";

const getMenu = defineTool({
  name: "getMenu",
  description: "Use this when the student wants to browse food, prices, stock, categories or vegetarian options.",
  schema: z.object({
    category: z.enum(["meal", "snack", "drink", "sweet"]).optional(),
    veg_only: z.boolean().optional(),
    max_price: z.number().int().positive().optional(),
  }),
  run: async ({ category, veg_only, max_price }) => {
    let query = getSupabase()
      .from("menu_items")
      .select("id, name, category, price, is_veg, stock, description")
      .gt("stock", 0)
      .order("category")
      .order("price");
    if (category) query = query.eq("category", category);
    if (veg_only) query = query.eq("is_veg", true);
    if (max_price !== undefined) query = query.lte("price", max_price);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  },
});

const getWalletBalance = defineTool({
  name: "getWalletBalance",
  description: "Use this when the student asks about their wallet balance or before checking whether an order fits their budget.",
  schema: z.object({}),
  run: async () => {
    const { data, error } = await getSupabase()
      .from("wallets")
      .select("name, balance")
      .eq("student_id", CURRENT_STUDENT_ID)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
});

const getPickupSlots = defineTool({
  name: "getPickupSlots",
  description: "Use this when the student needs available canteen pickup times or before placing an order.",
  schema: z.object({}),
  run: async () => {
    const { data, error } = await getSupabase().from("pickup_slots").select("id, slot_time, capacity, booked").order("slot_time");
    if (error) throw new Error(error.message);
    return data
      .map((slot) => ({ slot_id: slot.id, time: formatSlot(slot.slot_time), free: slot.capacity - slot.booked }))
      .filter((slot) => slot.free > 0);
  },
});

const getMyOrders = defineTool({
  name: "getMyOrders",
  description: "Use this when the student asks about their recent orders, order status or pickup details.",
  schema: z.object({}),
  run: async () => {
    const { data, error } = await getSupabase()
      .from("orders")
      .select("id, status, total, pickup_slots(slot_time), order_items(quantity, menu_items(name))")
      .eq("student_id", CURRENT_STUDENT_ID)
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) throw new Error(error.message);
    return data.map((order) => ({
      id: order.id,
      status: order.status,
      total: order.total,
      pickup_time: Array.isArray(order.pickup_slots) ? formatSlot((order.pickup_slots[0] as any)?.slot_time ?? "") : formatSlot((order.pickup_slots as any)?.slot_time ?? ""),
      items: order.order_items.map((item) => `${item.quantity}x ${Array.isArray(item.menu_items) ? (item.menu_items[0] as any)?.name : (item.menu_items as any)?.name}`),
    }));
  },
});

const placeOrder = defineTool({
  name: "placeOrder",
  description: "Use this when the student has chosen items and a pickup slot and wants to place an order.",
  writes: true,
  schema: z.object({
    items: z.array(z.object({ menu_item_id: z.number().int().positive(), quantity: z.number().int().min(1).max(5) })).min(1),
    slot_id: z.number().int().positive(),
  }),
  run: async ({ items, slot_id }) => {
    const { data, error } = await getSupabase().rpc("place_order", {
      p_student_id: CURRENT_STUDENT_ID,
      p_slot_id: slot_id,
      p_items: items,
    });
    if (error) throw new Error(error.message);
    return data;
  },
});

const cancelOrder = defineTool({
  name: "cancelOrder",
  description: "Use this when the student asks to cancel one of their orders; call getMyOrders first if the order id is unknown.",
  writes: true,
  schema: z.object({ order_id: z.number().int().positive() }),
  run: async ({ order_id }) => {
    const { data, error } = await getSupabase().rpc("cancel_order", {
      p_student_id: CURRENT_STUDENT_ID,
      p_order_id: order_id,
    });
    if (error) throw new Error(error.message);
    return data;
  },
});

export const tools: AgentTool[] = [getMenu, getWalletBalance, getPickupSlots, getMyOrders, placeOrder, cancelOrder];
