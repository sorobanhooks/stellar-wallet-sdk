export const API_KEY =
  (typeof import.meta.env !== "undefined" && import.meta.env?.VITE_API_KEY) || "";

export const NETWORK_STORAGE_KEY = "stellar_network";

export const NETWORK_CONFIGS = {
  testnet: {
    network: "testnet" as const,
    apiKey: API_KEY,
    networkPassphrase: "Test SDF Network ; September 2015",
  },
  mainnet: {
    network: "mainnet" as const,
    apiKey: API_KEY,
    networkPassphrase: "Public Global Stellar Network ; September 2015",
  },
} as const;

export type Network = keyof typeof NETWORK_CONFIGS;

export function getPersistedNetwork(): Network {
  const stored =
    typeof window !== "undefined" && window.localStorage?.getItem(NETWORK_STORAGE_KEY);
  if (stored === "testnet" || stored === "mainnet") return stored;
  return "testnet";
}

