import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import aesjs from 'aes-js';

const ENCRYPTION_KEY_SUFFIX = '-encryption-key';

type StorageBackend = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

const isAsyncStorageAvailable = () => {
  const nativeModule = (AsyncStorage as { nativeModule?: unknown }).nativeModule;

  return nativeModule != null;
};

// Expo SecureStore values are limited to ~2048 bytes; Supabase sessions are larger.
class LargeSecureStore implements StorageBackend {
  private async encrypt(key: string, value: string) {
    const encryptionKey = crypto.getRandomValues(new Uint8Array(32));
    const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
    const encryptedBytes = cipher.encrypt(aesjs.utils.utf8.toBytes(value));

    await SecureStore.setItemAsync(
      `${key}${ENCRYPTION_KEY_SUFFIX}`,
      aesjs.utils.hex.fromBytes(encryptionKey),
    );

    return aesjs.utils.hex.fromBytes(encryptedBytes);
  }

  private async decrypt(key: string, value: string) {
    const encryptionKeyHex = await SecureStore.getItemAsync(`${key}${ENCRYPTION_KEY_SUFFIX}`);

    if (!encryptionKeyHex) {
      return null;
    }

    const cipher = new aesjs.ModeOfOperation.ctr(
      aesjs.utils.hex.toBytes(encryptionKeyHex),
      new aesjs.Counter(1),
    );
    const decryptedBytes = cipher.decrypt(aesjs.utils.hex.toBytes(value));

    return aesjs.utils.utf8.fromBytes(decryptedBytes);
  }

  async getItem(key: string) {
    const encrypted = await AsyncStorage.getItem(key);

    if (!encrypted) {
      return encrypted;
    }

    return this.decrypt(key, encrypted);
  }

  async setItem(key: string, value: string) {
    const encrypted = await this.encrypt(key, value);
    await AsyncStorage.setItem(key, encrypted);
  }

  async removeItem(key: string) {
    await AsyncStorage.removeItem(key);
    await SecureStore.deleteItemAsync(`${key}${ENCRYPTION_KEY_SUFFIX}`);
  }
}

class MemoryStorage implements StorageBackend {
  private store = new Map<string, string>();

  async getItem(key: string) {
    return this.store.get(key) ?? null;
  }

  async setItem(key: string, value: string) {
    this.store.set(key, value);
  }

  async removeItem(key: string) {
    this.store.delete(key);
  }
}

const createNativeBackend = (): StorageBackend => {
  const asyncAvailable = isAsyncStorageAvailable();
  if (!asyncAvailable) {
    if (__DEV__) {
      console.warn(
        '[BloodLink] AsyncStorage native module unavailable; using in-memory auth storage for this session.',
      );
    }

    return new MemoryStorage();
  }

  return new LargeSecureStore();
};

let nativeBackend: StorageBackend | null = null;

const getNativeBackend = () => {
  if (!nativeBackend) {
    nativeBackend = createNativeBackend();
  }

  return nativeBackend;
};

export const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') {
      return Promise.resolve(globalThis.localStorage?.getItem(key) ?? null);
    }

    return getNativeBackend().getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(key, value);
      return Promise.resolve();
    }

    return getNativeBackend().setItem(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.removeItem(key);
      return Promise.resolve();
    }

    return getNativeBackend().removeItem(key);
  },
};
