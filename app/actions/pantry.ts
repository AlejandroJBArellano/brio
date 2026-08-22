"use server";

import { getDb } from "@/lib/db";
import { DEFAULT_PANTRY_ITEMS } from "@/lib/pantryCatalog";
import { PantryCategory, PantryItem } from "@/lib/types";
import { revalidatePath } from "next/cache";

interface PantryDbRow {
  id: string;
  name: string;
  category: string;
  in_stock: boolean;
  icon?: string;
  created_at?: Date | string;
}

/**
 * Ensures the pantry_items table exists and is seeded with defaults if empty.
 */
async function ensurePantryTableExists() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS pantry_items (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      category VARCHAR(50) NOT NULL,
      in_stock BOOLEAN NOT NULL DEFAULT true,
      icon VARCHAR(20),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  // Check if empty
  const countRes = await sql`SELECT COUNT(*) as count FROM pantry_items;`;
  const count = Number(countRes[0]?.count || 0);

  if (count === 0) {
    for (const item of DEFAULT_PANTRY_ITEMS) {
      await sql`
        INSERT INTO pantry_items (id, name, category, in_stock, icon)
        VALUES (${item.id}, ${item.name}, ${item.category}, ${item.inStock}, ${item.icon || null})
        ON CONFLICT (id) DO NOTHING;
      `;
    }
  }
}

/**
 * Server Action: Fetches all pantry items grouped or sorted.
 */
export async function fetchPantryItemsAction(): Promise<PantryItem[]> {
  try {
    const sql = getDb();
    await ensurePantryTableExists();

    const rows = (await sql`
      SELECT id, name, category, in_stock, icon
      FROM pantry_items
      ORDER BY name ASC;
    `) as unknown as PantryDbRow[];

    if (rows.length === 0) {
      return DEFAULT_PANTRY_ITEMS;
    }

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category as PantryCategory,
      inStock: Boolean(r.in_stock),
      icon: r.icon || "🥑",
    }));
  } catch (error) {
    console.error("[Fetch Pantry Error]:", error);
    return DEFAULT_PANTRY_ITEMS;
  }
}

/**
 * Server Action: Toggles inStock boolean of a pantry item.
 */
export async function togglePantryItemAction(
  id: string
): Promise<{ success: boolean; inStock?: boolean; error?: string }> {
  try {
    const sql = getDb();
    await ensurePantryTableExists();

    const current = (await sql`
      SELECT in_stock FROM pantry_items WHERE id = ${id} LIMIT 1;
    `) as unknown as PantryDbRow[];

    if (current.length === 0) {
      return { success: false, error: "Item no encontrado" };
    }

    const nextState = !current[0].in_stock;

    await sql`
      UPDATE pantry_items
      SET in_stock = ${nextState}
      WHERE id = ${id};
    `;

    revalidatePath("/");
    return { success: true, inStock: nextState };
  } catch (error) {
    console.error("[Toggle Pantry Item Error]:", error);
    return { success: false, error: "No se pudo actualizar el ingrediente" };
  }
}

/**
 * Server Action: Batch updates inStock status for multiple pantry items.
 */
export async function batchUpdatePantryStockAction(
  updates: Array<{ id: string; inStock: boolean }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = getDb();
    await ensurePantryTableExists();

    for (const update of updates) {
      await sql`
        UPDATE pantry_items
        SET in_stock = ${update.inStock}
        WHERE id = ${update.id};
      `;
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Batch Update Pantry Error]:", error);
    return { success: false, error: "No se pudo actualizar la despensa" };
  }
}

/**
 * Server Action: Adds a custom pantry item.
 */
export async function addCustomPantryItemAction(
  name: string,
  category: PantryCategory,
  icon?: string
): Promise<{ success: boolean; item?: PantryItem; error?: string }> {
  try {
    if (!name.trim()) {
      return { success: false, error: "El nombre del ingrediente es requerido" };
    }

    const sql = getDb();
    await ensurePantryTableExists();

    const cleanName = name.trim();
    const id = `custom-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString(36)}`;
    const cleanIcon = icon?.trim() || "✨";

    await sql`
      INSERT INTO pantry_items (id, name, category, in_stock, icon)
      VALUES (${id}, ${cleanName}, ${category}, true, ${cleanIcon})
      ON CONFLICT (id) DO UPDATE
      SET in_stock = true;
    `;

    const newItem: PantryItem = {
      id,
      name: cleanName,
      category,
      inStock: true,
      icon: cleanIcon,
    };

    revalidatePath("/");
    return { success: true, item: newItem };
  } catch (error) {
    console.error("[Add Custom Pantry Item Error]:", error);
    return { success: false, error: "No se pudo agregar el ingrediente a la despensa" };
  }
}

/**
 * Server Action: Deletes a pantry item.
 */
export async function deletePantryItemAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = getDb();
    await ensurePantryTableExists();

    await sql`
      DELETE FROM pantry_items WHERE id = ${id};
    `;

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Delete Pantry Item Error]:", error);
    return { success: false, error: "No se pudo eliminar el ingrediente" };
  }
}
