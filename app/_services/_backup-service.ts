import { Account, Settings, Transaction, getAccounts, getSettings, getTransactions } from './_db-service';
import { SafeStorage } from './_safe-storage';

export interface BackupData {
  version: string;
  timestamp: string;
  accounts: Account[];
  transactions: Transaction[];
  settings: Omit<Settings, 'id' | 'created_date'>;
}

// Simple hash function for PIN (not cryptographically secure, for demo purposes)
export async function hashPin(pin: string): Promise<string> {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString();
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  const computedHash = await hashPin(pin);
  return computedHash === hash;
}

export async function exportBackup(): Promise<BackupData> {
  try {
    const [accounts, transactions, settings] = await Promise.all([
      getAccounts(),
      getTransactions(),
      getSettings(),
    ]);

    const backup: BackupData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      accounts,
      transactions,
      settings: {
        dark_mode: settings.dark_mode,
        pin_enabled: settings.pin_enabled,
        pin_hash: settings.pin_hash,
        income_sources: settings.income_sources,
        expense_categories: settings.expense_categories,
        currency_symbol: settings.currency_symbol,
      },
    };

    return backup;
  } catch (e) {
    console.error('Error exporting backup:', e);
    throw e;
  }
}

export async function saveBackupToStorage(backup: BackupData): Promise<void> {
  try {
    const backupJson = JSON.stringify(backup, null, 2);
    await SafeStorage.setItem('money_management_backup', backupJson);
    console.log('[Backup] Backup saved to storage');
  } catch (e) {
    console.error('Error saving backup to storage:', e);
    throw e;
  }
}

export async function getLastBackup(): Promise<BackupData | null> {
  try {
    const backupJson = await SafeStorage.getItem('money_management_backup');
    if (!backupJson) return null;
    return JSON.parse(backupJson) as BackupData;
  } catch (e) {
    console.error('Error retrieving backup:', e);
    return null;
  }
}

export async function importBackupFromJson(jsonString: string): Promise<BackupData> {
  try {
    const backup = JSON.parse(jsonString) as BackupData;
    
    // Validate backup structure
    if (!backup.version || !backup.accounts || !backup.transactions) {
      throw new Error('Invalid backup format');
    }

    return backup;
  } catch (e) {
    console.error('Error parsing backup JSON:', e);
    throw new Error('Failed to parse backup file');
  }
}
