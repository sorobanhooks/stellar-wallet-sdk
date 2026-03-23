import { useState, useEffect, useRef, useCallback } from "react";
import type { StellarWallet } from "stellar-wallet-sdk";
import { getDisplayMessage } from "stellar-wallet-sdk";
import type { SearchAssetResult } from "stellar-wallet-sdk";

const DEBOUNCE_MS = 500;

export function useAssetSearch(wallet: StellarWallet, searchQuery: string) {
  const [results, setResults] = useState<SearchAssetResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const search = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;
      setLoading(true);
      setError(null);
      try {
        const assets = await wallet.searchAssets(query, {
          signal: controller.signal,
        });
        if (!controller.signal.aborted) {
          setResults(assets);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        if (!controller.signal.aborted) {
          setError(getDisplayMessage(err));
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [wallet]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchQuery.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    debounceRef.current = setTimeout(() => search(searchQuery), DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      abortControllerRef.current?.abort();
    };
  }, [searchQuery, search]);

  return { results, loading, error };
}
