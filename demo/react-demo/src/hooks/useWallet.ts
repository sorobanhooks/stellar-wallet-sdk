import { useState, useEffect } from "react";
import { StellarWallet } from "stellar-wallet-sdk";
import {
  NETWORK_CONFIGS,
  getPersistedNetwork,
  NETWORK_STORAGE_KEY,
} from "../constants/network";
import type { Network } from "../constants/network";

export function useWallet() {
  const [network, setNetwork] = useState<Network>(getPersistedNetwork);
  const [wallet] = useState(() => new StellarWallet({
    network: NETWORK_CONFIGS[network].network,
    apiKey: NETWORK_CONFIGS[network].apiKey,
  }));

  useEffect(() => {
    wallet.setNetworkConfig({
      network: NETWORK_CONFIGS[network].network,
      apiKey: NETWORK_CONFIGS[network].apiKey,
    });
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(NETWORK_STORAGE_KEY, network);
    }
  }, [network, wallet]);

  return { wallet, network, setNetwork };
}


