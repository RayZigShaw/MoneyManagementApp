import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function initDatabase() {
  // Open database
  db = SQLite.openDatabaseSync('money_management.db');

  try {
    // Try to check if accounts table has the expected schema
    const columns = await db.getAllAsync(`PRAGMA table_info(accounts);`) as any[];
    const hasNoteColumn = columns.some((col: any) => col.name === 'note');
    const hasColorColumn = columns.some((col: any) => col.name === 'color');
    
    // If missing required columns, drop and recreate
    if (!hasNoteColumn || !hasColorColumn) {
      await db.execAsync(`
        DROP TABLE IF EXISTS transactions;
        DROP TABLE IF EXISTS accounts;
        DROP TABLE IF EXISTS settings;
      `);
    }
  } catch (e) {
    // Tables don't exist yet, that's fine
  }

  // Create tables (will only create if they don't exist)
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      balance REAL NOT NULL DEFAULT 0,
      color TEXT DEFAULT '#6366f1',
      note TEXT,
      created_date TEXT DEFAULT CURRENT_TIMESTAMP
    );`
  );

  // Transactions table
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS transactions (
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
    );`
  );

  // Settings table
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      dark_mode INTEGER DEFAULT 0,
      pin_enabled INTEGER DEFAULT 0,
      pin_hash TEXT,
      income_sources TEXT DEFAULT '["Fiverr", "Freelancing", "Personal", "Other"]',
      expense_categories TEXT DEFAULT '["Food", "Transport", "Entertainment", "Betting / Personal Use", "Others"]',
      currency_symbol TEXT DEFAULT '৳',
      created_date TEXT DEFAULT CURRENT_TIMESTAMP
    );`
  );
}

function getDatabase() {
  if (!db) {
    db = SQLite.openDatabaseSync('money_management.db');
  }
  return db;
}

export default getDatabase();
