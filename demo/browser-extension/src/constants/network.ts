const INDEXER_URL =
  (typeof import.meta.env !== "undefined" && import.meta.env?.VITE_INDEXER_URL) || "";

export const NETWORK_STORAGE_KEY = "stellar_network";

export const NETWORK_CONFIGS = {
  testnet: {
    rpcUrl: "https://horizon-testnet.stellar.org",
    networkPassphrase: "Test SDF Network ; September 2015",
    friendbotUrl: "https://friendbot.stellar.org",
    indexerUrl: INDEXER_URL,
    sorobanRpcUrl: "https://soroban-testnet.stellar.org",
  },
  mainnet: {
    rpcUrl: "https://horizon.stellar.org",
    networkPassphrase: "Public Global Stellar Network ; September 2015",
    friendbotUrl: undefined,
    indexerUrl: INDEXER_URL,
    sorobanRpcUrl: "https://mainnet.sorobanrpc.com",
  },
} as const;

export type Network = keyof typeof NETWORK_CONFIGS;

export function getPersistedNetwork(): Network {
  const stored =
    typeof window !== "undefined" && window.localStorage?.getItem(NETWORK_STORAGE_KEY);
  if (stored === "testnet" || stored === "mainnet") return stored;
  return "testnet";
}

export { INDEXER_URL };
