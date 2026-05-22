import React, { createContext, useContext, useEffect, useState } from 'react';
import { initDatabase } from '../../db';
import { Account, getAccounts, getSettings, getTransactions, Settings, Transaction } from '../_services/_db-service';

interface AppContextType {
  accounts: Account[];
  transactions: Transaction[];
  settings: Settings | null;
  loading: boolean;
  totalBalance: number;
  currency: string;
  refresh: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const [accs, txs, sets] = await Promise.all([
        getAccounts(),
        getTransactions(),
        getSettings(),
      ]);
      setAccounts(accs);
      setTransactions(txs);
      setSettings(sets);
    } catch (e) {
      console.error('[AppContext] Refresh error:', e);
    }
  }

  useEffect(() => {
    async function init() {
      try {
        console.log('[AppContext] Initializing...');
        await initDatabase();
        await refresh();
        console.log('[AppContext] Initialized successfully');
      } catch (e) {
        console.error('[AppContext] Init error:', e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  const currency = settings?.currency_symbol || '৳';

  return (
    <AppContext.Provider
      value={{ accounts, transactions, settings, loading, totalBalance, currency, refresh }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

