import AsyncStorage from '@react-native-async-storage/async-storage';

// In-memory fallback storage
const memoryStorage = new Map<string, string>();

// Safe storage wrapper that falls back to memory storage on error
export const SafeStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value;
    } catch (error) {
      console.warn('[SafeStorage] AsyncStorage getItem failed, using memory storage:', error);
      return memoryStorage.get(key) || null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    // Always try AsyncStorage first
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.warn('[SafeStorage] AsyncStorage setItem failed, using memory storage:', error);
      // Fallback to memory storage
      memoryStorage.set(key, value);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.warn('[SafeStorage] AsyncStorage removeItem failed, using memory storage:', error);
      memoryStorage.delete(key);
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.warn('[SafeStorage] AsyncStorage clear failed, clearing memory storage:', error);
      memoryStorage.clear();
    }
  },
};
