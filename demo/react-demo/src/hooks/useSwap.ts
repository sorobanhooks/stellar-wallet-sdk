import { useState, useEffect, useRef, useCallback } from "react";
import type { StellarWallet } from "stellar-wallet-sdk";
import type { AccountBalance, SwapQuote } from "stellar-wallet-sdk";
import {
  getCanonicalFromBalance,
  getAssetCode,
  getTokenId,
  formatAsset,
} from "../utils/asset";

export function useSwap(
  wallet: StellarWallet,
  selectedAccount: string | null,
  balances: AccountBalance[]
) {
  const [swapStep, setSwapStep] = useState<"input" | "review" | "swapping" | "success">("input");
  const [fromAsset, setFromAsset] = useState<string>("native");
  const [toAsset, setToAsset] = useState<string>("native");
  const [swapAmount, setSwapAmount] = useState("");
  const [slippagePercent, setSlippagePercent] = useState(1);
  const [swapQuote, setSwapQuote] = useState<SwapQuote | null>(null);
  const [swapQuoteLoading, setSwapQuoteLoading] = useState(false);
  const [unsignedXdr, setUnsignedXdr] = useState("");
  const [swapHash, setSwapHash] = useState("");
  const [swapError, setSwapError] = useState("");
  const [swapSubmitting, setSwapSubmitting] = useState(false);
  const [tokenSelectorTarget, setTokenSelectorTarget] = useState<"from" | "to" | null>(null);
  const [slippageModalOpen, setSlippageModalOpen] = useState(false);
  const swapQuoteDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getBalanceForAsset = useCallback(
    (canonical: string) => balances.find((b) => getCanonicalFromBalance(b) === canonical),
    [balances]
  );

  const handleEnterSwap = useCallback(() => {
    setSwapStep("input");
    setSwapAmount("");
    setSwapQuote(null);
    setUnsignedXdr("");
    setSwapHash("");
    setSwapError("");
    setTokenSelectorTarget(null);
    setSlippageModalOpen(false);
    if (balances.length >= 2) {
      const nativeIdx = balances.findIndex((b) => b.assetType === "native");
      const tokenIdx = balances.findIndex((b) => b.assetType !== "native");
      if (nativeIdx >= 0 && tokenIdx >= 0) {
        setFromAsset(getCanonicalFromBalance(balances[tokenIdx]));
        setToAsset(getCanonicalFromBalance(balances[nativeIdx]));
      } else {
        setFromAsset(getCanonicalFromBalance(balances[0]));
        setToAsset(getCanonicalFromBalance(balances[1]));
      }
    } else if (balances.length === 1) {
      setFromAsset(getCanonicalFromBalance(balances[0]));
      setToAsset("native");
    }
  }, [balances]);

  useEffect(() => {
    if (
      swapStep === "input" &&
      swapAmount &&
      fromAsset &&
      toAsset &&
      fromAsset !== toAsset &&
      selectedAccount
    ) {
      if (swapQuoteDebounceRef.current) clearTimeout(swapQuoteDebounceRef.current);
      swapQuoteDebounceRef.current = setTimeout(async () => {
        setSwapQuoteLoading(true);
        setSwapQuote(null);
        try {
          const q = await wallet.getSwapQuote({
            sourceAsset: fromAsset,
            destAsset: toAsset,
            amount: swapAmount,
            mode: "strictSend",
          });
          setSwapQuote(q);
        } catch {
          setSwapQuote(null);
        } finally {
          setSwapQuoteLoading(false);
        }
      }, 300);
    }
    return () => {
      if (swapQuoteDebounceRef.current) {
        clearTimeout(swapQuoteDebounceRef.current);
        swapQuoteDebounceRef.current = null;
      }
    };
  }, [swapStep, swapAmount, fromAsset, toAsset, wallet, selectedAccount]);

  return {
    swapStep,
    setSwapStep,
    fromAsset,
    setFromAsset,
    toAsset,
    setToAsset,
    swapAmount,
    setSwapAmount,
    slippagePercent,
    setSlippagePercent,
    swapQuote,
    setSwapQuote,
    swapQuoteLoading,
    unsignedXdr,
    setUnsignedXdr,
    swapHash,
    setSwapHash,
    swapError,
    setSwapError,
    swapSubmitting,
    setSwapSubmitting,
    tokenSelectorTarget,
    setTokenSelectorTarget,
    slippageModalOpen,
    setSlippageModalOpen,
    getBalanceForAsset,
    handleEnterSwap,
    getAssetCode,
    formatAsset,
    getTokenId,
    getCanonicalFromBalance,
  };
}
