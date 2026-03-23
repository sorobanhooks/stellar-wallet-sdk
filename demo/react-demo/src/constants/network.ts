const INDEXER_URL =
  (typeof import.meta.env !== "undefined" && import.meta.env?.VITE_INDEXER_URL) || "";

const TESTNET_RPC_URL = (
  typeof import.meta.env !== "undefined" && import.meta.env?.VITE_TESTNET_RPC_URL
)

const MAINNET_RPC_URL = (
  typeof import.meta.env !== "undefined" && import.meta.env?.VITE_MAINNET_RPC_URL
)

const TESTNET_SOROBAN_RPC_URL = (
  typeof import.meta.env !== "undefined" && import.meta.env?.VITE_TESTNET_SOROBAN_RPC_URL
)

const MAINNET_SOROBAN_RPC_URL = (
  typeof import.meta.env !== "undefined" && import.meta.env?.VITE_MAINNET_SOROBAN_RPC_URL
)

export const NETWORK_STORAGE_KEY = "stellar_network";

export const NETWORK_CONFIGS = {
  testnet: {
    rpcUrl: TESTNET_RPC_URL,
    networkPassphrase: "Test SDF Network ; September 2015",
    friendbotUrl: "https://friendbot.stellar.org",
    indexerUrl: INDEXER_URL,
    sorobanRpcUrl: TESTNET_SOROBAN_RPC_URL,
  },
  mainnet: {
    rpcUrl: MAINNET_RPC_URL,
    networkPassphrase: "Public Global Stellar Network ; September 2015",
    friendbotUrl: undefined,
    indexerUrl: INDEXER_URL,
    sorobanRpcUrl: MAINNET_SOROBAN_RPC_URL,
  },
} as const;

export type Network = keyof typeof NETWORK_CONFIGS;

export function getPersistedNetwork(): Network {
  const stored =
    typeof window !== "undefined" && window.localStorage?.getItem(NETWORK_STORAGE_KEY);
  if (stored === "testnet" || stored === "mainnet") return stored;
  return "testnet";
}

export { INDEXER_URL, TESTNET_RPC_URL, MAINNET_RPC_URL, TESTNET_SOROBAN_RPC_URL, MAINNET_SOROBAN_RPC_URL };
