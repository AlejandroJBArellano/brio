import { neon } from "@neondatabase/serverless";

/**
 * Returns a configured Neon SQL tagged template runner.
 */
export function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Please configure your Neon PostgreSQL connection string in .env.local"
    );
  }
  return neon(databaseUrl);
}

let isInitialized = false;

/**
 * Ensures all required tables and indexes exist in the Neon database.
 */
export async function ensureDatabaseSchema() {
  if (isInitialized) return;
  if (!process.env.DATABASE_URL) return;

  try {
    const sql = getDb();

    // 0. Neon Auth / Better Auth Tables
    await sql`
      CREATE TABLE IF NOT EXISTS "user" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL UNIQUE,
        "emailVerified" BOOLEAN NOT NULL DEFAULT false,
        "image" TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "session" (
        "id" TEXT PRIMARY KEY,
        "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "token" TEXT NOT NULL UNIQUE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "account" (
        "id" TEXT PRIMARY KEY,
        "accountId" TEXT NOT NULL,
        "providerId" TEXT NOT NULL,
        "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "accessToken" TEXT,
        "refreshToken" TEXT,
        "idToken" TEXT,
        "accessTokenExpiresAt" TIMESTAMP WITH TIME ZONE,
        "refreshTokenExpiresAt" TIMESTAMP WITH TIME ZONE,
        "scope" TEXT,
        "password" TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "verification" (
        "id" TEXT PRIMARY KEY,
        "identifier" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // 1. Transactions table (Brio Finanzas)
    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        amount NUMERIC(12, 2) NOT NULL,
        type VARCHAR(10) NOT NULL CHECK (type IN ('expense', 'income')),
        category VARCHAR(50) NOT NULL,
        account VARCHAR(50) DEFAULT 'default',
        notes TEXT,
        is_ant_expense BOOLEAN DEFAULT false,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
    `;

    // 2. Monthly budgets table
    await sql`
      CREATE TABLE IF NOT EXISTS monthly_budgets (
        id TEXT PRIMARY KEY,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        budgeted_income NUMERIC(12, 2) DEFAULT 0,
        budgeted_fixed_expenses NUMERIC(12, 2) DEFAULT 0,
        budgeted_variable_expenses NUMERIC(12, 2) DEFAULT 0,
        daily_ant_limit NUMERIC(12, 2) DEFAULT 150.00,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // 3. Savings goals table
    await sql`
      CREATE TABLE IF NOT EXISTS savings_goals (
        id TEXT PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        target_amount NUMERIC(12, 2) NOT NULL,
        current_amount NUMERIC(12, 2) DEFAULT 0,
        deadline DATE,
        category VARCHAR(50) DEFAULT 'general',
        color VARCHAR(30) DEFAULT '#6366f1',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // 4. Ritual logs (Morning / Evening records + Must-Wins)
    await sql`
      CREATE TABLE IF NOT EXISTS ritual_logs (
        date DATE PRIMARY KEY DEFAULT CURRENT_DATE,
        must_win_tasks JSONB DEFAULT '[]'::jsonb,
        energy_level INTEGER,
        day_intention TEXT,
        reflection TEXT,
        expenses_logged BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // 5. Daily activity logs for Heatmap & Balance
    await sql`
      CREATE TABLE IF NOT EXISTS daily_activity_logs (
        date DATE PRIMARY KEY DEFAULT CURRENT_DATE,
        habits_count INTEGER DEFAULT 0,
        dailies_count INTEGER DEFAULT 0,
        todos_count INTEGER DEFAULT 0,
        expenses_count INTEGER DEFAULT 0,
        tags_distribution JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // 6. Health & Fitness logs
    await sql`
      CREATE TABLE IF NOT EXISTS health_logs (
        date DATE PRIMARY KEY DEFAULT CURRENT_DATE,
        workout_type VARCHAR(50),
        workout_notes TEXT,
        water_ml INTEGER DEFAULT 0,
        supplements JSONB DEFAULT '[]'::jsonb,
        sleep_hours NUMERIC(4, 2) DEFAULT 7.5,
        sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 5) DEFAULT 4,
        steps_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // 6.1 User Supplements Catalog (Master configuration)
    await sql`
      CREATE TABLE IF NOT EXISTS user_supplements (
        id TEXT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        dosage VARCHAR(50),
        timing VARCHAR(50),
        order_index INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // 6.2 Body Composition Logs (Smart Fit Body / InBody scans)
    await sql`
      CREATE TABLE IF NOT EXISTS body_composition_logs (
        id TEXT PRIMARY KEY,
        date DATE NOT NULL UNIQUE,
        weight_kg NUMERIC(5, 2) NOT NULL,
        body_fat_percentage NUMERIC(4, 2),
        skeletal_muscle_kg NUMERIC(5, 2),
        fat_free_mass_kg NUMERIC(5, 2),
        visceral_fat_level NUMERIC(4, 1),
        bmi NUMERIC(4, 2),
        bmr_kcal INTEGER,
        water_liters NUMERIC(5, 2),
        segmental_data JSONB DEFAULT '{}'::jsonb,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // 7. Projects Backlog
    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'idea',
        tech_stack JSONB DEFAULT '[]'::jsonb,
        repo_url TEXT,
        live_url TEXT,
        progress INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // 8. Learning Items (Books & Courses)
    await sql`
      CREATE TABLE IF NOT EXISTS learning_items (
        id TEXT PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        type VARCHAR(20) DEFAULT 'book',
        author VARCHAR(100),
        current_progress INTEGER DEFAULT 0,
        total_progress INTEGER DEFAULT 100,
        key_takeaways TEXT,
        status VARCHAR(20) DEFAULT 'reading',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // 9. Scratchpad Notes Vault
    await sql`
      CREATE TABLE IF NOT EXISTS scratchpad_notes (
        id TEXT PRIMARY KEY DEFAULT 'default',
        content TEXT DEFAULT '',
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // 10. Hevy Workout Tracker Sessions
    await sql`
      CREATE TABLE IF NOT EXISTS hevy_workouts (
        id TEXT PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE NOT NULL,
        date DATE NOT NULL,
        duration_seconds INTEGER DEFAULT 0,
        total_volume_kg NUMERIC(10, 2) DEFAULT 0,
        exercises_count INTEGER DEFAULT 0,
        sets_count INTEGER DEFAULT 0,
        exercises JSONB DEFAULT '[]'::jsonb,
        hevy_updated_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_hevy_workouts_date ON hevy_workouts(date DESC);
    `;

    // 11. Bóveda & Intereses (Books, Sheet Music, Courses, Videos & Resources)
    await sql`
      CREATE TABLE IF NOT EXISTS vault_items (
        id TEXT PRIMARY KEY,
        category VARCHAR(30) NOT NULL,
        title VARCHAR(200) NOT NULL,
        author_or_creator VARCHAR(150),
        status VARCHAR(30) NOT NULL DEFAULT 'backlog',
        instrument VARCHAR(50),
        difficulty VARCHAR(30),
        platform VARCHAR(50),
        url TEXT,
        cover_url TEXT,
        file_url TEXT,
        file_key TEXT,
        file_name VARCHAR(255),
        file_size_bytes BIGINT,
        progress INTEGER DEFAULT 0,
        total_pages INTEGER,
        notes TEXT,
        tags JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Ensure backwards-compatible columns on vault_items
    await sql`
      ALTER TABLE vault_items ADD COLUMN IF NOT EXISTS url TEXT;
    `;
    await sql`
      ALTER TABLE vault_items ADD COLUMN IF NOT EXISTS platform VARCHAR(50);
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_vault_items_category ON vault_items(category);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_vault_items_status ON vault_items(status);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_vault_items_updated_at ON vault_items(updated_at DESC);
    `;

    // 12. Wishlist Financiera Anti-Impulso
    await sql`
      CREATE TABLE IF NOT EXISTS wishlist_items (
        id TEXT PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        price_estimated NUMERIC(12, 2) NOT NULL,
        category VARCHAR(50) DEFAULT 'general',
        priority VARCHAR(20) DEFAULT 'medium',
        url TEXT,
        image_url TEXT,
        reason_or_notes TEXT,
        status VARCHAR(20) DEFAULT 'cooling',
        cooling_days_total INTEGER DEFAULT 30,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        resolved_at TIMESTAMP WITH TIME ZONE
      );
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_wishlist_items_status ON wishlist_items(status);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_wishlist_items_created_at ON wishlist_items(created_at DESC);
    `;

    // 13. Módulo de Nutrición & Dietas (Plan Mariana Mont + Tracking)
    await sql`
      CREATE TABLE IF NOT EXISTS nutrition_recipes (
        id TEXT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        meal_slot VARCHAR(30) NOT NULL,
        week_number INTEGER,
        option_label VARCHAR(50),
        portions JSONB DEFAULT '{}'::jsonb,
        ingredients JSONB DEFAULT '[]'::jsonb,
        prep_notes TEXT,
        is_preset BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_nutrition_recipes_slot ON nutrition_recipes(meal_slot);
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS nutrition_meal_schedule (
        id TEXT PRIMARY KEY,
        date DATE NOT NULL,
        meal_slot VARCHAR(30) NOT NULL,
        recipe_id TEXT REFERENCES nutrition_recipes(id) ON DELETE SET NULL,
        custom_title VARCHAR(255),
        is_completed BOOLEAN DEFAULT false,
        portions JSONB DEFAULT '{}'::jsonb,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_nutrition_schedule_date ON nutrition_meal_schedule(date DESC);
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS nutrition_daily_logs (
        date DATE PRIMARY KEY DEFAULT CURRENT_DATE,
        portions JSONB DEFAULT '{}'::jsonb,
        habits JSONB DEFAULT '{}'::jsonb,
        calculated_macros JSONB DEFAULT '{}'::jsonb,
        notes TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS nutrition_settings (
        id TEXT PRIMARY KEY DEFAULT 'default',
        daily_portion_goals JSONB DEFAULT '{}'::jsonb,
        macro_factors JSONB DEFAULT '{}'::jsonb,
        water_target_ml INTEGER DEFAULT 2000,
        active_week INTEGER DEFAULT 1,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    isInitialized = true;
  } catch (error) {
    console.error("[Brio DB Init Error]:", error);
  }
}
