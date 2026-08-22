"use server";

import { ensureDatabaseSchema, getDb } from "@/lib/db";
import {
  DEFAULT_NUTRITION_SETTINGS,
  FOOD_GROUPS_CATALOG,
  MARIANA_MONT_PRESET_RECIPES,
  calculateMacrosFromPortions,
} from "@/lib/nutritionPresets";
import {
  FoodGroupKey,
  GroceryItem,
  GroceryListCategory,
  MealSlotType,
  NutritionDailyLog,
  NutritionDashboardData,
  NutritionHabitLog,
  NutritionRecipe,
  NutritionSettings,
  ScheduledMealItem,
} from "@/lib/types";
import { revalidatePath } from "next/cache";

const DEFAULT_HABITS: NutritionHabitLog = {
  dailySalad: false,
  hydrationGoal: false,
  noUltraProcessed: false,
  b12Weekly: false,
  spirulina: false,
  omega3Dha: false,
  magnesium: false,
  vitC: false,
};

const DEFAULT_PORTIONS: Record<FoodGroupKey, number> = {
  fruits: 0,
  vegetables: 0,
  cereals: 0,
  tubers: 0,
  legumes: 0,
  fats_seeds: 0,
  leafy_greens: 0,
};

/**
 * Ensures preset recipes from Mariana Mont's clinical plan exist in the database.
 */
async function ensurePresetRecipes(sql: any) {
  for (const rec of MARIANA_MONT_PRESET_RECIPES) {
    await sql`
      INSERT INTO nutrition_recipes (
        id, title, meal_slot, week_number, option_label, portions, ingredients, prep_notes, is_preset
      ) VALUES (
        ${rec.id},
        ${rec.title},
        ${rec.mealSlot},
        ${rec.weekNumber || 1},
        ${rec.optionLabel || null},
        ${JSON.stringify(rec.portions)},
        ${JSON.stringify(rec.ingredients)},
        ${rec.prepNotes || null},
        true
      ) ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        meal_slot = EXCLUDED.meal_slot,
        portions = EXCLUDED.portions,
        ingredients = EXCLUDED.ingredients,
        prep_notes = EXCLUDED.prep_notes;
    `;
  }
}

/**
 * Fetches or initializes nutrition settings.
 */
async function getOrSeedSettings(sql: any): Promise<NutritionSettings> {
  const rows = await sql`
    SELECT * FROM nutrition_settings WHERE id = 'default' LIMIT 1;
  `;

  if (rows.length === 0) {
    await sql`
      INSERT INTO nutrition_settings (
        id, daily_portion_goals, macro_factors, water_target_ml, active_week
      ) VALUES (
        'default',
        ${JSON.stringify(DEFAULT_NUTRITION_SETTINGS.dailyPortionGoals)},
        ${JSON.stringify(DEFAULT_NUTRITION_SETTINGS.macroFactors)},
        ${DEFAULT_NUTRITION_SETTINGS.waterTargetMl},
        ${DEFAULT_NUTRITION_SETTINGS.activeWeek || 1}
      ) ON CONFLICT (id) DO NOTHING;
    `;
    return DEFAULT_NUTRITION_SETTINGS;
  }

  const row = rows[0];
  return {
    dailyPortionGoals: {
      ...DEFAULT_NUTRITION_SETTINGS.dailyPortionGoals,
      ...(row.daily_portion_goals || {}),
    },
    macroFactors: {
      ...DEFAULT_NUTRITION_SETTINGS.macroFactors,
      ...(row.macro_factors || {}),
    },
    waterTargetMl: Number(row.water_target_ml) || 2000,
    activeWeek: Number(row.active_week) || 1,
  };
}

/**
 * Formats a Date object or string as YYYY-MM-DD.
 */
function toDateStr(date?: Date | string): string {
  if (!date) {
    const now = new Date();
    return now.toISOString().split("T")[0];
  }
  if (typeof date === "string") {
    return date.split("T")[0];
  }
  return date.toISOString().split("T")[0];
}

/**
 * Fetches the entire Nutrition Dashboard Data payload for a specific date (defaults to today).
 */
export async function fetchNutritionDashboardDataAction(
  targetDateStr?: string
): Promise<NutritionDashboardData> {
  try {
    await ensureDatabaseSchema();
    const sql = getDb();
    await ensurePresetRecipes(sql);

    const todayDate = toDateStr(targetDateStr);
    const settings = await getOrSeedSettings(sql);

    // 1. Fetch Today's Daily Log
    const todayLogRows = await sql`
      SELECT * FROM nutrition_daily_logs WHERE date = ${todayDate} LIMIT 1;
    `;

    let todayLog: NutritionDailyLog;
    if (todayLogRows.length > 0) {
      const row = todayLogRows[0];
      const portions = {
        ...DEFAULT_PORTIONS,
        ...(row.portions || {}),
      };
      const habits = {
        ...DEFAULT_HABITS,
        ...(row.habits || {}),
      };
      const calculatedMacros =
        row.calculated_macros && Object.keys(row.calculated_macros).length > 0
          ? row.calculated_macros
          : calculateMacrosFromPortions(portions, settings.macroFactors);

      todayLog = {
        date: todayDate,
        portions,
        habits,
        calculatedMacros,
        notes: row.notes || "",
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
        updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
      };
    } else {
      todayLog = {
        date: todayDate,
        portions: { ...DEFAULT_PORTIONS },
        habits: { ...DEFAULT_HABITS },
        calculatedMacros: calculateMacrosFromPortions(DEFAULT_PORTIONS, settings.macroFactors),
      };
    }

    // 2. Fetch Recipes Catalog
    const recipeRows = await sql`
      SELECT * FROM nutrition_recipes ORDER BY week_number ASC NULLS LAST, meal_slot ASC, title ASC;
    `;

    const recipesCatalog: NutritionRecipe[] = recipeRows.map((r: any) => ({
      id: r.id,
      title: r.title,
      mealSlot: r.meal_slot as MealSlotType,
      weekNumber: r.week_number ? Number(r.week_number) : undefined,
      optionLabel: r.option_label || undefined,
      portions: r.portions || {},
      ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
      prepNotes: r.prep_notes || "",
      isPreset: Boolean(r.is_preset),
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : undefined,
    }));

    const recipeMap = new Map<string, NutritionRecipe>();
    recipesCatalog.forEach((rec) => recipeMap.set(rec.id, rec));

    // 3. Fetch Scheduled Meals for Current Week (Monday to Sunday)
    const currDate = new Date(`${todayDate}T12:00:00Z`);
    const dayOfWeek = currDate.getUTCDay(); // 0 = Sunday, 1 = Monday
    const diffToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(currDate);
    monday.setUTCDate(monday.getUTCDate() - diffToMonday);
    const sunday = new Date(monday);
    sunday.setUTCDate(sunday.getUTCDate() + 6);

    const mondayStr = toDateStr(monday);
    const sundayStr = toDateStr(sunday);

    const scheduleRows = await sql`
      SELECT * FROM nutrition_meal_schedule 
      WHERE date >= ${mondayStr} AND date <= ${sundayStr}
      ORDER BY date ASC, 
        CASE meal_slot 
          WHEN 'breakfast' THEN 1 
          WHEN 'lunch' THEN 2 
          WHEN 'snack' THEN 3 
          WHEN 'dinner' THEN 4 
          WHEN 'smoothie' THEN 5 
          ELSE 6 
        END ASC;
    `;

    const scheduledMealsThisWeek: ScheduledMealItem[] = scheduleRows.map((s: any) => {
      const rec = s.recipe_id ? recipeMap.get(s.recipe_id) : undefined;
      return {
        id: s.id,
        date: toDateStr(s.date),
        mealSlot: s.meal_slot as MealSlotType,
        recipeId: s.recipe_id || undefined,
        customTitle: s.custom_title || undefined,
        isCompleted: Boolean(s.is_completed),
        portions: s.portions || rec?.portions || {},
        notes: s.notes || "",
        recipe: rec,
        createdAt: s.created_at ? new Date(s.created_at).toISOString() : undefined,
      };
    });

    const scheduledMealsToday = scheduledMealsThisWeek.filter((m) => m.date === todayDate);

    // 4. Fetch Recent Daily Logs for Adherence Analytics (Last 14 days)
    const recentLogsRows = await sql`
      SELECT * FROM nutrition_daily_logs 
      ORDER BY date DESC 
      LIMIT 14;
    `;

    const recentDailyLogs: NutritionDailyLog[] = recentLogsRows.map((row: any) => ({
      date: toDateStr(row.date),
      portions: { ...DEFAULT_PORTIONS, ...(row.portions || {}) },
      habits: { ...DEFAULT_HABITS, ...(row.habits || {}) },
      calculatedMacros:
        row.calculated_macros && Object.keys(row.calculated_macros).length > 0
          ? row.calculated_macros
          : calculateMacrosFromPortions(row.portions || {}, settings.macroFactors),
      notes: row.notes || "",
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
    }));

    // Calculate weekly adherence
    const thisWeekLogs = recentDailyLogs.filter((l) => l.date >= mondayStr && l.date <= sundayStr);
    let daysWithPortionsMet = 0;
    let daysWithSalad = 0;
    let daysWithWater = 0;
    let b12LoggedThisWeek = false;

    thisWeekLogs.forEach((l) => {
      if (l.habits.dailySalad) daysWithSalad++;
      if (l.habits.hydrationGoal) daysWithWater++;
      if (l.habits.b12Weekly) b12LoggedThisWeek = true;

      // Check if at least 4 out of 7 food groups met target
      let groupsMet = 0;
      (Object.keys(settings.dailyPortionGoals) as FoodGroupKey[]).forEach((g) => {
        if ((l.portions[g] || 0) >= (settings.dailyPortionGoals[g] || 1)) {
          groupsMet++;
        }
      });
      if (groupsMet >= 4) daysWithPortionsMet++;
    });

    // Also check unified supplements table (health_logs) for B12 this week
    if (!b12LoggedThisWeek) {
      const healthLogRows = await sql`
        SELECT supplements FROM health_logs 
        WHERE date >= ${mondayStr} AND date <= ${sundayStr};
      `;
      for (const hRow of healthLogRows) {
        if (Array.isArray(hRow.supplements)) {
          const hasB12 = hRow.supplements.some(
            (s: any) =>
              (s.name?.toLowerCase().includes("b12") ||
                s.name?.toLowerCase().includes("b-12") ||
                s.id?.toLowerCase().includes("b12")) &&
              s.taken
          );
          if (hasB12) {
            b12LoggedThisWeek = true;
            break;
          }
        }
      }
    }

    return {
      todayLog,
      settings,
      scheduledMealsThisWeek,
      scheduledMealsToday,
      recipesCatalog,
      recentDailyLogs,
      weeklyAdherence: {
        daysWithPortionsMet,
        daysWithSalad,
        daysWithWater,
        b12LoggedThisWeek,
      },
    };
  } catch (error) {
    console.error("[fetchNutritionDashboardDataAction Error]:", error);
    return {
      todayLog: {
        date: toDateStr(targetDateStr),
        portions: { ...DEFAULT_PORTIONS },
        habits: { ...DEFAULT_HABITS },
        calculatedMacros: calculateMacrosFromPortions(DEFAULT_PORTIONS),
      },
      settings: DEFAULT_NUTRITION_SETTINGS,
      scheduledMealsThisWeek: [],
      scheduledMealsToday: [],
      recipesCatalog: MARIANA_MONT_PRESET_RECIPES,
      recentDailyLogs: [],
      weeklyAdherence: {
        daysWithPortionsMet: 0,
        daysWithSalad: 0,
        daysWithWater: 0,
        b12LoggedThisWeek: false,
      },
    };
  }
}

/**
 * Logs or updates portion counts and habit checks for a specific date.
 */
export async function logDailyPortionsAction(
  dateStr: string,
  portions: Record<FoodGroupKey, number>,
  habits?: Partial<NutritionHabitLog>,
  notes?: string
) {
  try {
    await ensureDatabaseSchema();
    const sql = getDb();
    const targetDate = toDateStr(dateStr);
    const settings = await getOrSeedSettings(sql);

    // Merge existing habits if any
    const existing = await sql`
      SELECT * FROM nutrition_daily_logs WHERE date = ${targetDate} LIMIT 1;
    `;

    const currentHabits: NutritionHabitLog = existing.length > 0 && existing[0].habits
      ? { ...DEFAULT_HABITS, ...existing[0].habits }
      : { ...DEFAULT_HABITS };

    const mergedHabits: NutritionHabitLog = {
      ...currentHabits,
      ...(habits || {}),
    };

    const calculatedMacros = calculateMacrosFromPortions(portions, settings.macroFactors);

    await sql`
      INSERT INTO nutrition_daily_logs (
        date, portions, habits, calculated_macros, notes, created_at, updated_at
      ) VALUES (
        ${targetDate},
        ${JSON.stringify(portions)},
        ${JSON.stringify(mergedHabits)},
        ${JSON.stringify(calculatedMacros)},
        ${notes || (existing[0]?.notes || null)},
        NOW(),
        NOW()
      )
      ON CONFLICT (date) DO UPDATE SET
        portions = EXCLUDED.portions,
        habits = EXCLUDED.habits,
        calculated_macros = EXCLUDED.calculated_macros,
        notes = COALESCE(EXCLUDED.notes, nutrition_daily_logs.notes),
        updated_at = NOW();
    `;

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[logDailyPortionsAction Error]:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Quick increment/decrement (+1, -1, +0.5, etc.) for a single food group portion.
 */
export async function quickAdjustPortionAction(
  dateStr: string,
  group: FoodGroupKey,
  delta: number
) {
  try {
    await ensureDatabaseSchema();
    const sql = getDb();
    const targetDate = toDateStr(dateStr);
    const settings = await getOrSeedSettings(sql);

    const existing = await sql`
      SELECT * FROM nutrition_daily_logs WHERE date = ${targetDate} LIMIT 1;
    `;

    const portions: Record<FoodGroupKey, number> = existing.length > 0 && existing[0].portions
      ? { ...DEFAULT_PORTIONS, ...existing[0].portions }
      : { ...DEFAULT_PORTIONS };

    const habits: NutritionHabitLog = existing.length > 0 && existing[0].habits
      ? { ...DEFAULT_HABITS, ...existing[0].habits }
      : { ...DEFAULT_HABITS };

    const currentVal = portions[group] || 0;
    const newVal = Math.max(0, Math.round((currentVal + delta) * 10) / 10);
    portions[group] = newVal;

    const calculatedMacros = calculateMacrosFromPortions(portions, settings.macroFactors);

    await sql`
      INSERT INTO nutrition_daily_logs (
        date, portions, habits, calculated_macros, created_at, updated_at
      ) VALUES (
        ${targetDate},
        ${JSON.stringify(portions)},
        ${JSON.stringify(habits)},
        ${JSON.stringify(calculatedMacros)},
        NOW(),
        NOW()
      )
      ON CONFLICT (date) DO UPDATE SET
        portions = EXCLUDED.portions,
        calculated_macros = EXCLUDED.calculated_macros,
        updated_at = NOW();
    `;

    revalidatePath("/");
    return { success: true, newVal };
  } catch (error) {
    console.error("[quickAdjustPortionAction Error]:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Toggles a nutrition habit (e.g. daily salad, B12 supplement, hydration).
 */
export async function toggleNutritionHabitAction(
  dateStr: string,
  habitKey: keyof NutritionHabitLog
) {
  try {
    await ensureDatabaseSchema();
    const sql = getDb();
    const targetDate = toDateStr(dateStr);

    const existing = await sql`
      SELECT * FROM nutrition_daily_logs WHERE date = ${targetDate} LIMIT 1;
    `;

    const habits: NutritionHabitLog = existing.length > 0 && existing[0].habits
      ? { ...DEFAULT_HABITS, ...existing[0].habits }
      : { ...DEFAULT_HABITS };

    habits[habitKey] = !habits[habitKey];

    const portions: Record<FoodGroupKey, number> = existing.length > 0 && existing[0].portions
      ? { ...DEFAULT_PORTIONS, ...existing[0].portions }
      : { ...DEFAULT_PORTIONS };

    const calculatedMacros = existing.length > 0 && existing[0].calculated_macros
      ? existing[0].calculated_macros
      : calculateMacrosFromPortions(portions);

    await sql`
      INSERT INTO nutrition_daily_logs (
        date, portions, habits, calculated_macros, created_at, updated_at
      ) VALUES (
        ${targetDate},
        ${JSON.stringify(portions)},
        ${JSON.stringify(habits)},
        ${JSON.stringify(calculatedMacros)},
        NOW(),
        NOW()
      )
      ON CONFLICT (date) DO UPDATE SET
        habits = EXCLUDED.habits,
        updated_at = NOW();
    `;

    revalidatePath("/");
    return { success: true, habits };
  } catch (error) {
    console.error("[toggleNutritionHabitAction Error]:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Schedules a meal slot on a specific date.
 */
export async function scheduleMealSlotAction(payload: {
  date: string;
  mealSlot: MealSlotType;
  recipeId?: string;
  customTitle?: string;
  portions?: Partial<Record<FoodGroupKey, number>>;
  notes?: string;
}) {
  try {
    await ensureDatabaseSchema();
    const sql = getDb();
    const id = `meal-${payload.date}-${payload.mealSlot}-${Date.now().toString(36)}`;
    const targetDate = toDateStr(payload.date);

    // If recipe is selected and portions not provided, resolve recipe's portions
    let mealPortions = payload.portions || {};
    if (payload.recipeId && Object.keys(mealPortions).length === 0) {
      const rec = await sql`
        SELECT portions FROM nutrition_recipes WHERE id = ${payload.recipeId} LIMIT 1;
      `;
      if (rec.length > 0 && rec[0].portions) {
        mealPortions = rec[0].portions;
      }
    }

    await sql`
      INSERT INTO nutrition_meal_schedule (
        id, date, meal_slot, recipe_id, custom_title, is_completed, portions, notes
      ) VALUES (
        ${id},
        ${targetDate},
        ${payload.mealSlot},
        ${payload.recipeId || null},
        ${payload.customTitle || null},
        false,
        ${JSON.stringify(mealPortions)},
        ${payload.notes || null}
      );
    `;

    revalidatePath("/");
    return { success: true, id };
  } catch (error) {
    console.error("[scheduleMealSlotAction Error]:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Toggles meal completed status, optionally auto-filling portions in today's daily log.
 */
export async function toggleScheduledMealCompletedAction(
  mealId: string,
  autoFillPortions: boolean = true
) {
  try {
    await ensureDatabaseSchema();
    const sql = getDb();

    const mealRows = await sql`
      SELECT s.*, r.portions as recipe_portions 
      FROM nutrition_meal_schedule s
      LEFT JOIN nutrition_recipes r ON s.recipe_id = r.id
      WHERE s.id = ${mealId} LIMIT 1;
    `;

    if (mealRows.length === 0) {
      return { success: false, error: "Meal not found" };
    }

    const meal = mealRows[0];
    const newCompleted = !meal.is_completed;

    await sql`
      UPDATE nutrition_meal_schedule
      SET is_completed = ${newCompleted}
      WHERE id = ${mealId};
    `;

    // Auto-fill portions into the daily log if completing
    if (newCompleted && autoFillPortions) {
      const targetDate = toDateStr(meal.date);
      const mealPortions: Partial<Record<FoodGroupKey, number>> =
        (meal.portions && Object.keys(meal.portions).length > 0)
          ? meal.portions
          : (meal.recipe_portions || {});

      if (Object.keys(mealPortions).length > 0) {
        const logRows = await sql`
          SELECT * FROM nutrition_daily_logs WHERE date = ${targetDate} LIMIT 1;
        `;

        const portions: Record<FoodGroupKey, number> = logRows.length > 0 && logRows[0].portions
          ? { ...DEFAULT_PORTIONS, ...logRows[0].portions }
          : { ...DEFAULT_PORTIONS };

        const habits: NutritionHabitLog = logRows.length > 0 && logRows[0].habits
          ? { ...DEFAULT_HABITS, ...logRows[0].habits }
          : { ...DEFAULT_HABITS };

        (Object.keys(mealPortions) as FoodGroupKey[]).forEach((k) => {
          const add = Number(mealPortions[k]) || 0;
          portions[k] = Math.round(((portions[k] || 0) + add) * 10) / 10;
        });

        const settings = await getOrSeedSettings(sql);
        const calculatedMacros = calculateMacrosFromPortions(portions, settings.macroFactors);

        await sql`
          INSERT INTO nutrition_daily_logs (
            date, portions, habits, calculated_macros, created_at, updated_at
          ) VALUES (
            ${targetDate},
            ${JSON.stringify(portions)},
            ${JSON.stringify(habits)},
            ${JSON.stringify(calculatedMacros)},
            NOW(),
            NOW()
          )
          ON CONFLICT (date) DO UPDATE SET
            portions = EXCLUDED.portions,
            calculated_macros = EXCLUDED.calculated_macros,
            updated_at = NOW();
        `;
      }
    }

    revalidatePath("/");
    return { success: true, isCompleted: newCompleted };
  } catch (error) {
    console.error("[toggleScheduledMealCompletedAction Error]:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Deletes a scheduled meal item.
 */
export async function deleteScheduledMealAction(mealId: string) {
  try {
    await ensureDatabaseSchema();
    const sql = getDb();

    await sql`
      DELETE FROM nutrition_meal_schedule WHERE id = ${mealId};
    `;

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[deleteScheduledMealAction Error]:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Creates or updates a recipe in the catalog.
 */
export async function saveRecipeAction(recipe: Partial<NutritionRecipe>) {
  try {
    await ensureDatabaseSchema();
    const sql = getDb();
    const id = recipe.id || `rec-custom-${Date.now().toString(36)}`;

    await sql`
      INSERT INTO nutrition_recipes (
        id, title, meal_slot, week_number, option_label, portions, ingredients, prep_notes, is_preset, created_at
      ) VALUES (
        ${id},
        ${recipe.title || "Nueva Receta"},
        ${recipe.mealSlot || "lunch"},
        ${recipe.weekNumber || null},
        ${recipe.optionLabel || null},
        ${JSON.stringify(recipe.portions || {})},
        ${JSON.stringify(recipe.ingredients || [])},
        ${recipe.prepNotes || null},
        ${recipe.isPreset ?? false},
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        meal_slot = EXCLUDED.meal_slot,
        week_number = EXCLUDED.week_number,
        option_label = EXCLUDED.option_label,
        portions = EXCLUDED.portions,
        ingredients = EXCLUDED.ingredients,
        prep_notes = EXCLUDED.prep_notes;
    `;

    revalidatePath("/");
    return { success: true, id };
  } catch (error) {
    console.error("[saveRecipeAction Error]:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Deletes a custom recipe.
 */
export async function deleteRecipeAction(recipeId: string) {
  try {
    await ensureDatabaseSchema();
    const sql = getDb();

    await sql`
      DELETE FROM nutrition_recipes WHERE id = ${recipeId};
    `;

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[deleteRecipeAction Error]:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Updates nutrition settings (portion targets, water goal, macro factors).
 */
export async function updateNutritionSettingsAction(settings: Partial<NutritionSettings>) {
  try {
    await ensureDatabaseSchema();
    const sql = getDb();
    const current = await getOrSeedSettings(sql);

    const merged: NutritionSettings = {
      dailyPortionGoals: {
        ...current.dailyPortionGoals,
        ...(settings.dailyPortionGoals || {}),
      },
      macroFactors: {
        ...current.macroFactors,
        ...(settings.macroFactors || {}),
      },
      waterTargetMl: settings.waterTargetMl ?? current.waterTargetMl,
      activeWeek: settings.activeWeek ?? current.activeWeek,
    };

    await sql`
      INSERT INTO nutrition_settings (
        id, daily_portion_goals, macro_factors, water_target_ml, active_week, created_at, updated_at
      ) VALUES (
        'default',
        ${JSON.stringify(merged.dailyPortionGoals)},
        ${JSON.stringify(merged.macroFactors)},
        ${merged.waterTargetMl},
        ${merged.activeWeek || 1},
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        daily_portion_goals = EXCLUDED.daily_portion_goals,
        macro_factors = EXCLUDED.macro_factors,
        water_target_ml = EXCLUDED.water_target_ml,
        active_week = EXCLUDED.active_week,
        updated_at = NOW();
    `;

    revalidatePath("/");
    return { success: true, settings: merged };
  } catch (error) {
    console.error("[updateNutritionSettingsAction Error]:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Generates a smart categorized grocery shopping list based on scheduled meals in a date range.
 */
export async function generateGroceryListAction(
  startDateStr: string,
  endDateStr: string
): Promise<GroceryListCategory[]> {
  try {
    await ensureDatabaseSchema();
    const sql = getDb();
    const start = toDateStr(startDateStr);
    const end = toDateStr(endDateStr);

    const rows = await sql`
      SELECT s.*, r.title as recipe_title, r.ingredients as recipe_ingredients
      FROM nutrition_meal_schedule s
      LEFT JOIN nutrition_recipes r ON s.recipe_id = r.id
      WHERE s.date >= ${start} AND s.date <= ${end}
      ORDER BY s.date ASC;
    `;

    const ingredientsMap = new Map<string, { name: string; sourceRecipes: Set<string> }>();

    rows.forEach((r: any) => {
      const mealName = r.recipe_title || r.custom_title || "Comida agendada";
      const ingredients: string[] = Array.isArray(r.recipe_ingredients) ? r.recipe_ingredients : [];

      ingredients.forEach((ing) => {
        const cleanName = ing.trim();
        if (!cleanName) return;
        const lowerKey = cleanName.toLowerCase();
        if (!ingredientsMap.has(lowerKey)) {
          ingredientsMap.set(lowerKey, {
            name: cleanName,
            sourceRecipes: new Set([mealName]),
          });
        } else {
          ingredientsMap.get(lowerKey)!.sourceRecipes.add(mealName);
        }
      });
    });

    // Categorization dictionary
    const categoriesMap: Record<string, GroceryItem[]> = {
      verduras_hojas: [],
      frutas: [],
      legumbres_granos: [],
      semillas_frutos: [],
      insumos_cocina: [],
      otros: [],
    };

    const VEG_KEYWORDS = ["espinaca", "kale", "lechuga", "nopal", "champiñon", "seta", "calabac", "pepino", "zanahoria", "chayote", "esparrag", "brocoli", "col", "jitomate", "cebolla", "pimiento", "ajo"];
    const FRUIT_KEYWORDS = ["plátano", "platano", "manzana", "fresa", "frutos rojos", "mango", "arándano", "arandano", "frambuesa", "naranja", "limón", "limon", "aguacate", "dátil", "datil", "melón", "sandía"];
    const GRAIN_LEGUME_KEYWORDS = ["tofu", "frijol", "lenteja", "garbanzo", "edamame", "soya", "avena", "arroz", "quinoa", "amaranto", "tortilla", "pasta", "sope", "fideo", "papa", "camote", "harina"];
    const SEED_KEYWORDS = ["pepita", "semilla", "chía", "chia", "linaza", "ajonjolí", "ajonjoli", "nuez", "nueces", "almendra", "cacahuate", "hemp", "tahini", "crema de cacahuate"];
    const PANTRY_KEYWORDS = ["aceite", "vinagreta", "monkfruit", "stevia", "miel de agave", "sal", "canela", "cúrcuma", "curcuma", "cacao", "páprika", "paprika", "orégano", "leche de"];

    ingredientsMap.forEach((item, _) => {
      const lower = item.name.toLowerCase();
      let assignedCategory: GroceryItem["category"] = "otros";

      if (VEG_KEYWORDS.some((kw) => lower.includes(kw))) {
        assignedCategory = "verduras_hojas";
      } else if (FRUIT_KEYWORDS.some((kw) => lower.includes(kw))) {
        assignedCategory = "frutas";
      } else if (GRAIN_LEGUME_KEYWORDS.some((kw) => lower.includes(kw))) {
        assignedCategory = "legumbres_granos";
      } else if (SEED_KEYWORDS.some((kw) => lower.includes(kw))) {
        assignedCategory = "semillas_frutos";
      } else if (PANTRY_KEYWORDS.some((kw) => lower.includes(kw))) {
        assignedCategory = "insumos_cocina";
      }

      categoriesMap[assignedCategory].push({
        id: `groc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        name: item.name,
        category: assignedCategory,
        checked: false,
        sourceRecipes: Array.from(item.sourceRecipes),
      });
    });

    return [
      {
        categoryKey: "verduras_hojas",
        categoryTitle: "Verduras, Hojas & Hongos",
        icon: "🥦",
        items: categoriesMap.verduras_hojas,
      },
      {
        categoryKey: "frutas",
        categoryTitle: "Frutas Frescas",
        icon: "🍎",
        items: categoriesMap.frutas,
      },
      {
        categoryKey: "legumbres_granos",
        categoryTitle: "Legumbres, Tofu & Granos Integrales",
        icon: "🫘",
        items: categoriesMap.legumbres_granos,
      },
      {
        categoryKey: "semillas_frutos",
        categoryTitle: "Semillas, Frutos Secos & Grasas",
        icon: "🥑",
        items: categoriesMap.semillas_frutos,
      },
      {
        categoryKey: "insumos_cocina",
        categoryTitle: "Insumos, Aceites & Especias",
        icon: "🌿",
        items: categoriesMap.insumos_cocina,
      },
      {
        categoryKey: "otros",
        categoryTitle: "Otros Ingredientes",
        icon: "🛒",
        items: categoriesMap.otros,
      },
    ].filter((cat) => cat.items.length > 0);
  } catch (error) {
    console.error("[generateGroceryListAction Error]:", error);
    return [];
  }
}
