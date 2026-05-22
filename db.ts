import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<void> | null = null;

// Simple, fast database initialization
async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  
  // Only try once - expo-sqlite handles the heavy lifting
  db = SQLite.openDatabaseSync('money_management.db');
  console.log('[DB] Database opened');
  return db;
}

async function ensureTablesCreated(): Promise<void> {
  if (initPromise) {
    await initPromise;
    return;
  }

  initPromise = (async () => {
    const database = await getDb();
    
    try {
      console.log('[DB] Creating tables...');
      // Create all tables in one batch
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS accounts (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          balance REAL NOT NULL DEFAULT 0,
          color TEXT DEFAULT '#6366f1',
          note TEXT,
          created_date TEXT DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          amount REAL NOT NULL,
          date TEXT NOT NULL,
          category TEXT,
          account_id TEXT,
          account_name TEXT,
          to_account_id TEXT,
          to_account_name TEXT,
          note TEXT,
          created_date TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(account_id) REFERENCES accounts(id),
          FOREIGN KEY(to_account_id) REFERENCES accounts(id)
        );
        
        CREATE TABLE IF NOT EXISTS settings (
          id TEXT PRIMARY KEY,
          dark_mode INTEGER DEFAULT 0,
          pin_enabled INTEGER DEFAULT 0,
          pin_hash TEXT,
          income_sources TEXT DEFAULT '["Fiverr", "Freelancing", "Personal", "Other"]',
          expense_categories TEXT DEFAULT '["Food", "Transport", "Entertainment", "Betting / Personal Use", "Others"]',
          currency_symbol TEXT DEFAULT '৳',
          created_date TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('[DB] Tables created successfully');
    } catch (error) {
      console.error('[DB] Error creating tables:', error);
      throw error;
    }
  })();

  await initPromise;
}

export async function initDatabase() {
  console.log('[DB] initDatabase() called');
  await getDb();
  await ensureTablesCreated();
  console.log('[DB] initDatabase() completed');
}

// Export database wrapper
export default {
  getAllAsync: async (sql: string, args?: any[]) => {
    const database = await getDb();
    await ensureTablesCreated();
    return database.getAllAsync(sql, args);
  },
  getFirstAsync: async (sql: string, args?: any[]) => {
    const database = await getDb();
    await ensureTablesCreated();
    return database.getFirstAsync(sql, args);
  },
  runAsync: async (sql: string, args?: any[]) => {
    const database = await getDb();
    await ensureTablesCreated();
    return database.runAsync(sql, args);
  },
  execAsync: async (sql: string) => {
    const database = await getDb();
    await ensureTablesCreated();
    return database.execAsync(sql);
  },
};
