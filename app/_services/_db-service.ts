import db from '../../db';

// Simple ID generator that doesn't require crypto
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Types
export interface Account {
  id: string;
  name: string;
  type: 'bank' | 'wallet' | 'cash';
  balance: number;
  color?: string;
  note?: string;
  created_date?: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  date: string;
  category?: string;
  account_id?: string;
  account_name?: string;
  to_account_id?: string;
  to_account_name?: string;
  note?: string;
  created_date?: string;
}

export interface Settings {
  id: string;
  dark_mode: boolean;
  pin_enabled: boolean;
  pin_hash?: string;
  income_sources: string[];
  expense_categories: string[];
  currency_symbol: string;
  created_date?: string;
}

// ─── Accounts ───────────────────────────────────────────────
export async function getAccounts(): Promise<Account[]> {
  try {
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM accounts ORDER BY id DESC`
    );
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type,
      balance: row.balance,
      color: row.color || '#6366f1',
      note: row.note,
      created_date: row.created_date,
    }));
  } catch (e) {
    console.error('[getAccounts] Error:', e);
    return [];
  }
}

export async function createAccount(data: Omit<Account, 'id' | 'created_date'>): Promise<Account> {
  const id = generateId();
  console.log('[createAccount] Creating account:', JSON.stringify(data));
  
  await db.runAsync(
    `INSERT INTO accounts (id, name, type, balance, color, note) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, data.name, data.type, data.balance || 0, data.color || '#6366f1', data.note || null]
  );
  
  console.log('[createAccount] Success');
  return { id, ...data, created_date: new Date().toISOString() };
}

export async function updateAccount(id: string, data: Partial<Account>): Promise<void> {
  try {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.balance !== undefined) {
      updates.push('balance = ?');
      values.push(data.balance);
    }
    if (data.color !== undefined) {
      updates.push('color = ?');
      values.push(data.color);
    }
    if (data.note !== undefined) {
      updates.push('note = ?');
      values.push(data.note);
    }

    if (updates.length === 0) return;

    values.push(id);
    const query = `UPDATE accounts SET ${updates.join(', ')} WHERE id = ?`;
    await db.runAsync(query, values);
  } catch (e) {
    console.error('Error updating account:', e);
    throw e;
  }
}

export async function deleteAccount(id: string): Promise<void> {
  await db.runAsync(`DELETE FROM transactions WHERE account_id = ? OR to_account_id = ?`, [id, id]);
  await db.runAsync(`DELETE FROM accounts WHERE id = ?`, [id]);
}

// ─── Transactions ────────────────────────────────────────────
export async function getTransactions(): Promise<Transaction[]> {
  try {
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM transactions ORDER BY date DESC`
    );
    return rows.map(row => ({
      id: row.id,
      type: row.type,
      amount: row.amount,
      date: row.date,
      category: row.category,
      account_id: row.account_id,
      account_name: row.account_name,
      to_account_id: row.to_account_id,
      to_account_name: row.to_account_name,
      note: row.note,
      created_date: row.created_date,
    }));
  } catch (e) {
    console.error('Error fetching transactions:', e);
    return [];
  }
}

export async function createTransaction(data: Omit<Transaction, 'id' | 'created_date'>): Promise<Transaction> {
  const id = generateId();
  try {
    console.log('[TX] Creating transaction:', { id, type: data.type, amount: data.amount, from: data.account_id, to: data.to_account_id });
    
    // Create the transaction
    await db.runAsync(
      `INSERT INTO transactions (id, type, amount, date, category, account_id, account_name, to_account_id, to_account_name, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.type,
        data.amount,
        data.date,
        data.category || null,
        data.account_id || null,
        data.account_name || null,
        data.to_account_id || null,
        data.to_account_name || null,
        data.note || null,
      ]
    );
    console.log('[TX] Transaction inserted successfully');

    // Update account balances
    if (data.type === 'income' && data.account_id) {
      console.log('[TX] Processing INCOME transaction');
      const account = await db.getFirstAsync<any>(
        `SELECT balance FROM accounts WHERE id = ?`,
        [data.account_id]
      );
      console.log('[TX] Current account balance:', account?.balance);
      if (account) {
        const newBalance = account.balance + data.amount;
        console.log('[TX] Updating balance from', account.balance, 'to', newBalance);
        await db.runAsync(
          `UPDATE accounts SET balance = ? WHERE id = ?`,
          [newBalance, data.account_id]
        );
        console.log('[TX] Income balance updated');
      }
    } else if (data.type === 'expense' && data.account_id) {
      console.log('[TX] Processing EXPENSE transaction');
      const account = await db.getFirstAsync<any>(
        `SELECT balance FROM accounts WHERE id = ?`,
        [data.account_id]
      );
      console.log('[TX] Current account balance:', account?.balance);
      if (account) {
        const newBalance = account.balance - data.amount;
        console.log('[TX] Updating balance from', account.balance, 'to', newBalance);
        await db.runAsync(
          `UPDATE accounts SET balance = ? WHERE id = ?`,
          [newBalance, data.account_id]
        );
        console.log('[TX] Expense balance updated');
      }
    } else if (data.type === 'transfer' && data.account_id && data.to_account_id) {
      console.log('[TX] Processing TRANSFER transaction');
      console.log('[TX] From account ID:', data.account_id);
      console.log('[TX] To account ID:', data.to_account_id);
      console.log('[TX] Transfer amount:', data.amount);
      
      const fromAccount = await db.getFirstAsync<any>(
        `SELECT balance FROM accounts WHERE id = ?`,
        [data.account_id]
      );
      const toAccount = await db.getFirstAsync<any>(
        `SELECT balance FROM accounts WHERE id = ?`,
        [data.to_account_id]
      );
      console.log('[TX] From account current balance:', fromAccount?.balance);
      console.log('[TX] To account current balance:', toAccount?.balance);
      
      if (fromAccount) {
        const newFromBalance = fromAccount.balance - data.amount;
        console.log('[TX] Updating FROM balance from', fromAccount.balance, 'to', newFromBalance);
        await db.runAsync(
          `UPDATE accounts SET balance = ? WHERE id = ?`,
          [newFromBalance, data.account_id]
        );
        // Verify the update
        const verifyFrom = await db.getFirstAsync<any>(
          `SELECT balance FROM accounts WHERE id = ?`,
          [data.account_id]
        );
        console.log('[TX] Verified FROM account new balance:', verifyFrom?.balance);
      }
      if (toAccount) {
        const newToBalance = toAccount.balance + data.amount;
        console.log('[TX] Updating TO balance from', toAccount.balance, 'to', newToBalance);
        await db.runAsync(
          `UPDATE accounts SET balance = ? WHERE id = ?`,
          [newToBalance, data.to_account_id]
        );
        // Verify the update
        const verifyTo = await db.getFirstAsync<any>(
          `SELECT balance FROM accounts WHERE id = ?`,
          [data.to_account_id]
        );
        console.log('[TX] Verified TO account new balance:', verifyTo?.balance);
      }
    }

    console.log('[TX] Transaction completed successfully');
    return { id, ...data, created_date: new Date().toISOString() };
  } catch (e) {
    console.error('Error creating transaction:', e);
    throw e;
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  try {
    // Get the transaction
    const tx = await db.getFirstAsync<any>(
      `SELECT * FROM transactions WHERE id = ?`,
      [id]
    );

    if (!tx) return;

    // Reverse the balance effect
    if (tx.type === 'income' && tx.account_id) {
      const account = await db.getFirstAsync<any>(
        `SELECT balance FROM accounts WHERE id = ?`,
        [tx.account_id]
      );
      if (account) {
        await db.runAsync(
          `UPDATE accounts SET balance = ? WHERE id = ?`,
          [account.balance - tx.amount, tx.account_id]
        );
      }
    } else if (tx.type === 'expense' && tx.account_id) {
      const account = await db.getFirstAsync<any>(
        `SELECT balance FROM accounts WHERE id = ?`,
        [tx.account_id]
      );
      if (account) {
        await db.runAsync(
          `UPDATE accounts SET balance = ? WHERE id = ?`,
          [account.balance + tx.amount, tx.account_id]
        );
      }
    } else if (tx.type === 'transfer' && tx.account_id && tx.to_account_id) {
      const fromAccount = await db.getFirstAsync<any>(
        `SELECT balance FROM accounts WHERE id = ?`,
        [tx.account_id]
      );
      const toAccount = await db.getFirstAsync<any>(
        `SELECT balance FROM accounts WHERE id = ?`,
        [tx.to_account_id]
      );
      if (fromAccount) {
        await db.runAsync(
          `UPDATE accounts SET balance = ? WHERE id = ?`,
          [fromAccount.balance + tx.amount, tx.account_id]
        );
      }
      if (toAccount) {
        await db.runAsync(
          `UPDATE accounts SET balance = ? WHERE id = ?`,
          [toAccount.balance - tx.amount, tx.to_account_id]
        );
      }
    }

    // Delete the transaction
    await db.runAsync(`DELETE FROM transactions WHERE id = ?`, [id]);
  } catch (e) {
    console.error('Error deleting transaction:', e);
    throw e;
  }
}

// ─── Settings ────────────────────────────────────────────────
export async function getSettings(): Promise<Settings> {
  try {
    let settings = await db.getFirstAsync<any>(
      `SELECT * FROM settings LIMIT 1`
    );

    if (!settings) {
      const id = generateId();
      const defaultSettings: Settings = {
        id,
        dark_mode: false,
        pin_enabled: false,
        income_sources: ['Fiverr', 'Freelancing', 'Personal', 'Other'],
        expense_categories: ['Food', 'Transport', 'Entertainment', 'Betting / Personal Use', 'Others'],
        currency_symbol: '৳',
      };

      await db.runAsync(
        `INSERT INTO settings (id, dark_mode, pin_enabled, income_sources, expense_categories, currency_symbol)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          id,
          0,
          0,
          JSON.stringify(defaultSettings.income_sources),
          JSON.stringify(defaultSettings.expense_categories),
          defaultSettings.currency_symbol,
        ]
      );

      return defaultSettings;
    }

    return {
      id: settings.id,
      dark_mode: settings.dark_mode === 1,
      pin_enabled: settings.pin_enabled === 1,
      pin_hash: settings.pin_hash,
      income_sources: JSON.parse(settings.income_sources || '[]'),
      expense_categories: JSON.parse(settings.expense_categories || '[]'),
      currency_symbol: settings.currency_symbol || '৳',
      created_date: settings.created_date,
    };
  } catch (e) {
    console.error('Error fetching settings:', e);
    throw e;
  }
}

export async function updateSettings(id: string, data: Partial<Settings>): Promise<void> {
  try {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.dark_mode !== undefined) {
      updates.push('dark_mode = ?');
      values.push(data.dark_mode ? 1 : 0);
    }
    if (data.pin_enabled !== undefined) {
      updates.push('pin_enabled = ?');
      values.push(data.pin_enabled ? 1 : 0);
    }
    if (data.pin_hash !== undefined) {
      updates.push('pin_hash = ?');
      values.push(data.pin_hash);
    }
    if (data.income_sources !== undefined) {
      updates.push('income_sources = ?');
      values.push(JSON.stringify(data.income_sources));
    }
    if (data.expense_categories !== undefined) {
      updates.push('expense_categories = ?');
      values.push(JSON.stringify(data.expense_categories));
    }
    if (data.currency_symbol !== undefined) {
      updates.push('currency_symbol = ?');
      values.push(data.currency_symbol);
    }

    if (updates.length === 0) return;

    values.push(id);
    const query = `UPDATE settings SET ${updates.join(', ')} WHERE id = ?`;
    await db.runAsync(query, values);
  } catch (e) {
    console.error('Error updating settings:', e);
    throw e;
  }
}

// ─── Reports ────────────────────────────────────────────────
export interface MonthlyReport {
  month: string;
  income: number;
  expense: number;
  transfer: number;
  net: number;
}

export interface CategorySummary {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface DailySummary {
  date: string;
  income: number;
  expense: number;
  net: number;
}

export async function getMonthlyReport(year: number, month: number): Promise<MonthlyReport> {
  try {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const rows = await db.getAllAsync<any>(
      `SELECT type, SUM(amount) as total, COUNT(*) as count FROM transactions 
       WHERE date >= ? AND date <= ? AND type != 'transfer'
       GROUP BY type`,
      [startDate, endDate]
    );

    let income = 0, expense = 0;
    rows.forEach((row: any) => {
      if (row.type === 'income') income = row.total || 0;
      if (row.type === 'expense') expense = row.total || 0;
    });

    const transfers = await db.getFirstAsync<any>(
      `SELECT SUM(amount) as total FROM transactions 
       WHERE date >= ? AND date <= ? AND type = 'transfer'`,
      [startDate, endDate]
    );

    const transfer = transfers?.total || 0;

    return {
      month: startDate,
      income,
      expense,
      transfer,
      net: income - expense,
    };
  } catch (e) {
    console.error('Error getting monthly report:', e);
    return { month: '', income: 0, expense: 0, transfer: 0, net: 0 };
  }
}

export async function getCategoryReport(type: 'income' | 'expense', year?: number, month?: number): Promise<CategorySummary[]> {
  try {
    let query = `SELECT category, SUM(amount) as amount, COUNT(*) as count FROM transactions 
                 WHERE type = ? AND category IS NOT NULL AND category != ''`;
    const params: any[] = [type];

    if (year && month) {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];
      query += ` AND date >= ? AND date <= ?`;
      params.push(startDate, endDate);
    }

    query += ` GROUP BY category ORDER BY amount DESC`;

    const rows = await db.getAllAsync<any>(query, params);

    const total = rows.reduce((sum, row) => sum + (row.amount || 0), 0);

    return rows.map((row: any) => ({
      category: row.category,
      amount: row.amount || 0,
      percentage: total > 0 ? ((row.amount || 0) / total) * 100 : 0,
      count: row.count || 0,
    }));
  } catch (e) {
    console.error('Error getting category report:', e);
    return [];
  }
}

export async function getDailyReport(year: number, month: number): Promise<DailySummary[]> {
  try {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const rows = await db.getAllAsync<any>(
      `SELECT date, type, SUM(amount) as amount FROM transactions 
       WHERE date >= ? AND date <= ?
       GROUP BY date, type
       ORDER BY date ASC`,
      [startDate, endDate]
    );

    const dailyMap = new Map<string, any>();

    rows.forEach((row: any) => {
      if (!dailyMap.has(row.date)) {
        dailyMap.set(row.date, { date: row.date, income: 0, expense: 0, net: 0 });
      }
      const daily = dailyMap.get(row.date);
      if (row.type === 'income') daily.income = row.amount || 0;
      if (row.type === 'expense') daily.expense = row.amount || 0;
      daily.net = daily.income - daily.expense;
    });

    return Array.from(dailyMap.values());
  } catch (e) {
    console.error('Error getting daily report:', e);
    return [];
  }
}

export async function getYearlyReport(year: number): Promise<MonthlyReport[]> {
  try {
    const reports: MonthlyReport[] = [];

    for (let month = 1; month <= 12; month++) {
      const report = await getMonthlyReport(year, month);
      reports.push(report);
    }

    return reports;
  } catch (e) {
    console.error('Error getting yearly report:', e);
    return [];
  }
}

export async function getAccountSummary(): Promise<{ accountId: string; accountName: string; balance: number; income: number; expense: number }[]> {
  try {
    const accounts = await getAccounts();

    const summaries = await Promise.all(
      accounts.map(async (acc) => {
        const incomeRow = await db.getFirstAsync<any>(
          `SELECT SUM(amount) as total FROM transactions WHERE account_id = ? AND type = 'income'`,
          [acc.id]
        );
        const expenseRow = await db.getFirstAsync<any>(
          `SELECT SUM(amount) as total FROM transactions WHERE account_id = ? AND type = 'expense'`,
          [acc.id]
        );

        return {
          accountId: acc.id,
          accountName: acc.name,
          balance: acc.balance,
          income: incomeRow?.total || 0,
          expense: expenseRow?.total || 0,
        };
      })
    );

    return summaries;
  } catch (e) {
    console.error('Error getting account summary:', e);
    return [];
  }
}

export async function getTransactionStats(): Promise<{
  totalTransactions: number;
  totalIncome: number;
  totalExpense: number;
  averageTransaction: number;
}> {
  try {
    const count = await db.getFirstAsync<any>(`SELECT COUNT(*) as total FROM transactions`);
    const income = await db.getFirstAsync<any>(`SELECT SUM(amount) as total FROM transactions WHERE type = 'income'`);
    const expense = await db.getFirstAsync<any>(`SELECT SUM(amount) as total FROM transactions WHERE type = 'expense'`);

    const totalTransactions = count?.total || 0;
    const totalIncome = income?.total || 0;
    const totalExpense = expense?.total || 0;
    const averageTransaction = totalTransactions > 0 ? (totalIncome + totalExpense) / totalTransactions : 0;

    return {
      totalTransactions,
      totalIncome,
      totalExpense,
      averageTransaction,
    };
  } catch (e) {
    console.error('Error getting transaction stats:', e);
    return { totalTransactions: 0, totalIncome: 0, totalExpense: 0, averageTransaction: 0 };
  }
}

// ─── Clear All Data ────────────────────────────────────────────────
export async function clearAllData(): Promise<void> {
  try {
    await db.runAsync(`DELETE FROM transactions`);
    await db.runAsync(`DELETE FROM accounts`);
    await db.runAsync(`DELETE FROM settings`);
  } catch (e) {
    console.error('Error clearing all data:', e);
    throw e;
  }
}

