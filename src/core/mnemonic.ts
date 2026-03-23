import { Keypair } from "@stellar/stellar-sdk";
import * as bip39 from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import { hmac } from "@noble/hashes/hmac.js";
import { sha512 } from "@noble/hashes/sha2.js";

const ED25519_CURVE = "ed25519 seed";
const HARDENED_OFFSET = 0x80000000;

function getMasterKeyFromSeed(seed: Uint8Array): { key: Uint8Array; chainCode: Uint8Array } {
  const I = hmac(sha512, new TextEncoder().encode(ED25519_CURVE), seed);
  return {
    key: I.slice(0, 32),
    chainCode: I.slice(32),
  };
}

function CKDPriv(
  parent: { key: Uint8Array; chainCode: Uint8Array },
  index: number
): { key: Uint8Array; chainCode: Uint8Array } {
  const indexBuffer = new Uint8Array(4);
  indexBuffer[0] = (index >> 24) & 0xff;
  indexBuffer[1] = (index >> 16) & 0xff;
  indexBuffer[2] = (index >> 8) & 0xff;
  indexBuffer[3] = index & 0xff;

  const data = new Uint8Array(1 + parent.key.length + 4);
  data[0] = 0;
  data.set(parent.key, 1);
  data.set(indexBuffer, 1 + parent.key.length);

  const I = hmac(sha512, parent.chainCode, data);
  return {
    key: I.slice(0, 32),
    chainCode: I.slice(32),
  };
}

function derivePath(path: string, seed: Uint8Array): Uint8Array {
  const segments = path
    .split("/")
    .slice(1)
    .map((s) => parseInt(s.replace("'", ""), 10) + HARDENED_OFFSET);

  let { key, chainCode } = getMasterKeyFromSeed(seed);
  for (const segment of segments) {
    const result = CKDPriv({ key, chainCode }, segment);
    key = result.key;
    chainCode = result.chainCode;
  }
  return key;
}

export function generateMnemonic(entropyBits: number = 256): string {
  const strength = entropyBits;
  return bip39.generateMnemonic(wordlist, strength);
}

export function validateMnemonic(mnemonic: string): boolean {
  return bip39.validateMnemonic(mnemonic, wordlist);
}

export function keypairFromMnemonic(mnemonic: string, index: number = 0): Keypair {
  const seed = bip39.mnemonicToSeedSync(mnemonic, "");
  const path = `m/44'/148'/${index}'`;
  const rawSeed = derivePath(path, seed);
  return Keypair.fromRawEd25519Seed(rawSeed as any);
}
