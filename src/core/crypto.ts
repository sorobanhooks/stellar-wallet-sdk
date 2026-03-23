import { Keypair } from "@stellar/stellar-sdk";
import { WebCryptoUnavailableError, DecryptionFailedError } from "../errors";

const PBKDF2_ITERATIONS = 310000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_LENGTH = 256;
const ALGORITHM = "AES-GCM";

export interface EncryptedPayload {
  cipherText: string;
  iv: string;
  salt: string;
}

function getCrypto(): Crypto {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    return crypto;
  }
  throw new WebCryptoUnavailableError();
}

function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return btoa(String.fromCharCode(...bytes));
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer.slice(0);
}

async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const crypto = getCrypto();
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

export class CryptoEngine {
  static generateKeypair(): Keypair {
    return Keypair.random();
  }

  static async encryptPrivateKey(
    secret: string,
    password: string
  ): Promise<EncryptedPayload> {
    const crypto = getCrypto();

    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    const key = await deriveKey(password, salt);

    const encoder = new TextEncoder();
    const plaintext = encoder.encode(secret);

    const cipherText = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv,
        tagLength: 128,
      },
      key,
      plaintext
    );

    return {
      cipherText: bufferToBase64(cipherText),
      iv: bufferToBase64(iv),
      salt: bufferToBase64(salt),
    };
  }

  static async decryptPrivateKey(
    payload: EncryptedPayload,
    password: string
  ): Promise<string> {
    try {
      const salt = new Uint8Array(base64ToBuffer(payload.salt));
      const iv = new Uint8Array(base64ToBuffer(payload.iv));
      const cipherText = base64ToBuffer(payload.cipherText);

      const key = await deriveKey(password, salt);

      const crypto = getCrypto();
      const plaintext = await crypto.subtle.decrypt(
        {
          name: ALGORITHM,
          iv: iv as BufferSource,
          tagLength: 128,
        },
        key,
        cipherText as ArrayBuffer
      );

      const decoder = new TextDecoder();
      return decoder.decode(plaintext);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      throw new DecryptionFailedError(msg);
    }
  }

  static async encryptMnemonic(
    mnemonic: string,
    password: string
  ): Promise<EncryptedPayload> {
    return this.encryptPrivateKey(mnemonic, password);
  }

  static async decryptMnemonic(
    payload: EncryptedPayload,
    password: string
  ): Promise<string> {
    return this.decryptPrivateKey(payload, password);
  }
}
