import type { SorobanTokenMetadata } from "stellar-wallet-sdk";
import type { Network } from "../constants/network";

export const SOROBAN_TOKENS_STORAGE_KEY = "stellar_soroban_tokens";

export function getStoredSorobanTokens(
  network: Network
): Array<{ contractId: string } & SorobanTokenMetadata> {
  try {
    const raw = localStorage.getItem(`${SOROBAN_TOKENS_STORAGE_KEY}_${network}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<{ contractId: string } & SorobanTokenMetadata>;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSorobanTokens(
  network: Network,
  tokens: Array<{ contractId: string } & SorobanTokenMetadata>
) {
  localStorage.setItem(`${SOROBAN_TOKENS_STORAGE_KEY}_${network}`, JSON.stringify(tokens));
}
