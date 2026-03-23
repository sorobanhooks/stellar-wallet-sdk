import { useState, useEffect, useCallback } from "react";
import type { StellarWallet } from "stellar-wallet-sdk";
import type { AccountBalance, TokenPriceData } from "stellar-wallet-sdk";
import { isAccountNotFoundError, getDisplayMessage } from "stellar-wallet-sdk";
import { INDEXER_URL } from "../constants/network";
import { getStoredSorobanTokens } from "../utils/soroban-tokens-storage";
import type { Network } from "../constants/network";

export function useBalances(
  wallet: StellarWallet,
  selectedAccount: string | null,
  network?: Network
) {
  const [balances, setBalances] = useState<AccountBalance[]>([]);
  const [tokenPrices, setTokenPrices] = useState<Record<string, TokenPriceData | null>>({});
  const [balancesLoading, setBalancesLoading] = useState(false);
  const [accountNotFound, setAccountNotFound] = useState(false);
  const [status, setStatus] = useState("");

  const loadBalances = useCallback(async () => {
    if (!selectedAccount) return;
    setBalancesLoading(true);
    setStatus("");
    try {
      const b = await wallet.getAccountBalancesWithMetadata(selectedAccount);
      const sorobanTokens = network ? getStoredSorobanTokens(network) : [];
      const sorobanBalances: AccountBalance[] = sorobanTokens.map((t) => ({
        assetType: "credit_alphanum12" as const,
        balance: "0",
        assetCode: t.symbol,
        assetIssuer: t.contractId,
        name: t.name ?? t.symbol,
        decimals: t.decimals,
      }));
      const existingContractIds = new Set(
        b.filter((x) => x.assetIssuer?.startsWith("C")).map((x) => x.assetIssuer)
      );
      const newSoroban = sorobanBalances.filter((s) => !existingContractIds.has(s.assetIssuer));
      const merged = [...b, ...newSoroban];
      setBalances(merged);
      setAccountNotFound(false);
      if (INDEXER_URL && merged.length > 0) {
        try {
          const prices = await wallet.getTokenPrices(merged);
          setTokenPrices(prices);
        } catch (e) {
          console.warn("Failed to fetch token prices:", e);
        }
      } else {
        setTokenPrices({});
      }
    } catch (err) {
      if (isAccountNotFoundError(err)) {
        setAccountNotFound(true);
        setBalances([]);
        setTokenPrices({});
      } else {
        setAccountNotFound(false);
        setStatus(`Error: ${getDisplayMessage(err)}`);
      }
    } finally {
      setBalancesLoading(false);
    }
  }, [selectedAccount, wallet, network]);

  useEffect(() => {
    if (selectedAccount) {
      loadBalances();
    }
  }, [selectedAccount, loadBalances]);

  useEffect(() => {
    if (selectedAccount && INDEXER_URL && balances.length > 0) {
      const interval = setInterval(async () => {
        try {
          const prices = await wallet.getTokenPrices(balances);
          setTokenPrices(prices);
        } catch (e) {
          console.warn("Error refreshing token prices:", e);
        }
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [selectedAccount, balances, wallet]);

  return {
    balances,
    tokenPrices,
    balancesLoading,
    accountNotFound,
    status,
    setStatus,
    loadBalances,
  };
}
