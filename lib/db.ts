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

    isInitialized = true;
  } catch (error) {
    console.error("[Brio DB Init Error]:", error);
  }
}
