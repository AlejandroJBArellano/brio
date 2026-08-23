"use server";

import { getDb } from "@/lib/db";
import {
  WishlistDashboardData,
  WishlistItem,
  WishlistPriority,
  WishlistStatus,
} from "@/lib/types";
import { awardHabiticaEvent } from "@/lib/habiticaEvents";
import { revalidatePath } from "next/cache";
import { getTodayDateStr } from "@/lib/dateUtils";

const DEFAULT_COOLING_DAYS = 30;

interface WishlistDbRow {
  id: string;
  title: string;
  price_estimated: number | string;
  category?: string;
  priority?: string;
  url?: string;
  image_url?: string;
  reason_or_notes?: string;
  status: string;
  cooling_days_total?: number | string;
  created_at?: Date | string;
  resolved_at?: Date | string;
}

/**
 * Helper to process raw DB row into typed WishlistItem with calculated countdowns.
 */
function processWishlistRow(r: WishlistDbRow): WishlistItem {
  const createdAt = r.created_at
    ? typeof r.created_at === "string"
      ? r.created_at
      : new Date(r.created_at).toISOString()
    : new Date().toISOString();

  const createdMs = new Date(createdAt).getTime();
  const nowMs = Date.now();
  const daysElapsed = Math.max(
    0,
    Math.floor((nowMs - createdMs) / (1000 * 60 * 60 * 24))
  );

  const coolingDaysTotal = Number(r.cooling_days_total) || DEFAULT_COOLING_DAYS;
  const daysRemaining = Math.max(0, coolingDaysTotal - daysElapsed);
  const isCoolingFinished = daysRemaining === 0;

  let computedStatus: WishlistStatus = r.status as WishlistStatus;
  if (computedStatus === "cooling" && isCoolingFinished) {
    computedStatus = "ready";
  }

  return {
    id: r.id,
    title: r.title,
    priceEstimated: Number(r.price_estimated) || 0,
    category: r.category || "General",
    priority: (r.priority as WishlistPriority) || "medium",
    url: r.url || undefined,
    imageUrl: r.image_url || undefined,
    reasonOrNotes: r.reason_or_notes || undefined,
    status: computedStatus,
    coolingDaysTotal,
    daysElapsed,
    daysRemaining,
    isCoolingFinished,
    createdAt,
    resolvedAt: r.resolved_at?.toString(),
  };
}

/**
 * Server Action: Fetches all Wishlist items and computes financial & cooling statistics.
 */
export async function fetchWishlistDataAction(): Promise<WishlistDashboardData> {
  const sql = getDb();

  const rows = await sql`
    SELECT * FROM wishlist_items ORDER BY created_at DESC;
  `;

  const items = (rows as unknown as WishlistDbRow[]).map(processWishlistRow);

  const activeItems = items.filter(
    (i) => i.status === "cooling" || i.status === "ready"
  );
  const dismissedItems = items.filter((i) => i.status === "dismissed");
  const purchasedItems = items.filter((i) => i.status === "purchased");

  const totalWishlistValue = activeItems.reduce(
    (sum, i) => sum + i.priceEstimated,
    0
  );
  const totalSavedImpulseValue = dismissedItems.reduce(
    (sum, i) => sum + i.priceEstimated,
    0
  );

  return {
    items,
    stats: {
      totalWishlistValue: Number(totalWishlistValue.toFixed(2)),
      totalSavedImpulseValue: Number(totalSavedImpulseValue.toFixed(2)),
      coolingCount: items.filter((i) => i.status === "cooling").length,
      readyCount: items.filter((i) => i.status === "ready").length,
      purchasedCount: purchasedItems.length,
      dismissedCount: dismissedItems.length,
    },
  };
}

/**
 * Server Action: Creates a new Wishlist item with cooling period.
 */
export async function createWishlistItemAction(input: {
  title: string;
  priceEstimated: number;
  category?: string;
  priority?: WishlistPriority;
  url?: string;
  imageUrl?: string;
  reasonOrNotes?: string;
  coolingDaysTotal?: number;
}): Promise<{ success: boolean; item?: WishlistItem; error?: string }> {
  try {
    if (!input.title || !input.title.trim()) {
      return { success: false, error: "El título del artículo es requerido." };
    }
    if (!input.priceEstimated || input.priceEstimated <= 0) {
      return { success: false, error: "El precio estimado debe ser mayor a 0." };
    }

    const sql = getDb();
    const id = `wish-${Date.now()}`;
    const coolingDaysTotal = input.coolingDaysTotal || DEFAULT_COOLING_DAYS;

    await sql`
      INSERT INTO wishlist_items (
        id, title, price_estimated, category, priority, url,
        image_url, reason_or_notes, status, cooling_days_total, created_at
      )
      VALUES (
        ${id},
        ${input.title.trim()},
        ${input.priceEstimated},
        ${input.category?.trim() || "General"},
        ${input.priority || "medium"},
        ${input.url?.trim() || null},
        ${input.imageUrl?.trim() || null},
        ${input.reasonOrNotes?.trim() || null},
        'cooling',
        ${coolingDaysTotal},
        NOW()
      );
    `;

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Create Wishlist Item Error]:", error);
    return { success: false, error: "No se pudo agregar a la wishlist." };
  }
}

/**
 * Server Action: Marks item as purchased and converts directly to a real transaction.
 */
export async function purchaseWishlistItemAction(
  id: string,
  options?: {
    account?: string;
    category?: string;
    actualAmount?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = getDb();

    // 1. Fetch item
    const rows = await sql`
      SELECT * FROM wishlist_items WHERE id = ${id} LIMIT 1;
    `;

    if (rows.length === 0) {
      return { success: false, error: "Artículo no encontrado." };
    }

    const item = rows[0] as unknown as WishlistDbRow;
    const amount = options?.actualAmount || Number(item.price_estimated) || 0;
    const category = options?.category || item.category || "General";
    const account = options?.account || "default";

    // 2. Mark wishlist item as purchased
    await sql`
      UPDATE wishlist_items
      SET status = 'purchased', resolved_at = NOW()
      WHERE id = ${id};
    `;

    // 3. Automatically record financial transaction in Neon DB
    const txId = `tx-wish-${Date.now()}`;
    const todayStr = getTodayDateStr();

    await sql`
      INSERT INTO transactions (
        id, amount, type, category, account, notes, is_ant_expense, date, created_at
      )
      VALUES (
        ${txId},
        ${amount},
        'expense',
        ${category},
        ${account},
        ${`Wishlist Compra: ${item.title}`},
        false,
        ${todayStr},
        NOW()
      );
    `;

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Purchase Wishlist Item Error]:", error);
    return { success: false, error: "No se pudo registrar la compra." };
  }
}

/**
 * Server Action: Dismisses an impulse item, saving money and boosting saved stats.
 */
export async function dismissWishlistItemAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = getDb();

    const itemRows = await sql`
      SELECT title, price_estimated FROM wishlist_items WHERE id = ${id} LIMIT 1;
    `;
    const title = itemRows.length > 0 ? (itemRows[0].title as string) : "Capricho";
    const price = itemRows.length > 0 ? Number(itemRows[0].price_estimated) || 0 : 0;

    await sql`
      UPDATE wishlist_items
      SET status = 'dismissed', resolved_at = NOW()
      WHERE id = ${id};
    `;

    // Award Habitica XP for self-control & money saved
    await awardHabiticaEvent("WISHLIST_DISMISSED_COOLING", {
      customNotes: `Ahorraste $${price} al descartar: ${title}`,
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Dismiss Wishlist Item Error]:", error);
    return { success: false, error: "No se pudo descartar el capricho." };
  }
}

/**
 * Server Action: Deletes item from wishlist completely.
 */
export async function deleteWishlistItemAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = getDb();

    await sql`
      DELETE FROM wishlist_items WHERE id = ${id};
    `;

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Delete Wishlist Item Error]:", error);
    return { success: false, error: "No se pudo eliminar el elemento." };
  }
}
