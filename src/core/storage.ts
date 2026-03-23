import { CryptoEngine, EncryptedPayload } from "./crypto";
import {
  LocalStorageUnavailableError,
  StorageSaveError,
  StorageLoadError,
  StorageClearError,
} from "../errors";

const STORAGE_KEY = "stellar_wallet";

export interface StoredAccount {
  publicKey: string;
  encryptedSecret: EncryptedPayload;
  source: "created" | "imported";
  derivationIndex?: number;
  createdAt: number;
}

export interface WalletVault {
  version: 1;
  encryptedMnemonic?: EncryptedPayload;
  accounts: StoredAccount[];
}

function getStorage(): Storage {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  throw new LocalStorageUnavailableError();
}

export class WalletStorage {
  static async saveVault(vault: WalletVault, password: string): Promise<void> {
    try {
      const storage = getStorage();
      const plaintext = JSON.stringify(vault);
      const encrypted = await CryptoEngine.encryptPrivateKey(plaintext, password);
      storage.setItem(STORAGE_KEY, JSON.stringify(encrypted));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      throw new StorageSaveError(msg);
    }
  }

  static async loadVault(password: string): Promise<WalletVault | null> {
    try {
      const storage = getStorage();
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const encrypted = JSON.parse(raw) as EncryptedPayload;
      const plaintext = await CryptoEngine.decryptPrivateKey(encrypted, password);
      return JSON.parse(plaintext) as WalletVault;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      throw new StorageLoadError(msg);
    }
  }

  static async hasVault(): Promise<boolean> {
    try {
      const storage = getStorage();
      return storage.getItem(STORAGE_KEY) !== null;
    } catch {
      return false;
    }
  }

  static async clear(): Promise<void> {
    try {
      const storage = getStorage();
      storage.removeItem(STORAGE_KEY);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      throw new StorageClearError(msg);
    }
  }
}
