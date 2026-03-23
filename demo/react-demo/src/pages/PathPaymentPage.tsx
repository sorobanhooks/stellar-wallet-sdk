import { useState, useEffect } from "react";
import type { StellarWallet } from "stellar-wallet-sdk";
import { getDisplayMessage } from "stellar-wallet-sdk";
import type { SwapQuote } from "stellar-wallet-sdk";
import { sharedStyles } from "../constants/styles";
import { formatAsset, getCanonicalFromBalance, getAssetCode } from "../utils/asset";
import type { AccountBalance } from "stellar-wallet-sdk";
import type { Network } from "../constants/network";

interface PathPaymentPageProps {
  wallet: StellarWallet;
  selectedAccount: string;
  network: Network;
  balances: AccountBalance[];
  onBack: () => void;
  onSuccess: () => void;
}

export function PathPaymentPage({
  wallet,
  selectedAccount,
  balances,
  onBack,
  onSuccess,
}: PathPaymentPageProps) {
  const [sourceAsset, setSourceAsset] = useState<string>(
    balances.length > 0 ? getCanonicalFromBalance(balances[0]) : "native"
  );
  const [destAsset, setDestAsset] = useState<string>(
    balances.length >= 2 ? getCanonicalFromBalance(balances[1]) : "native"
  );
  const [sendAmount, setSendAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [memo, setMemo] = useState("");
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const sourceBalance = balances.find((b) => getCanonicalFromBalance(b) === sourceAsset);
  const destBalance = balances.find((b) => getCanonicalFromBalance(b) === destAsset);

  useEffect(() => {
    if (
      sendAmount &&
      sourceAsset &&
      destAsset &&
      sourceAsset !== destAsset &&
      wallet
    ) {
      setQuoteLoading(true);
      setQuote(null);
      wallet
        .getSwapQuote({
          sourceAsset,
          destAsset,
          amount: sendAmount,
          mode: "strictSend",
        })
        .then((q) => {
          setQuote(q);
        })
        .catch(() => setQuote(null))
        .finally(() => setQuoteLoading(false));
    } else {
      setQuote(null);
    }
  }, [sendAmount, sourceAsset, destAsset, wallet]);

  const handleSend = async () => {
    const dest = destination.trim();
    const amt = sendAmount.trim();
    if (!dest || !amt) {
      setError("Please enter destination and amount");
      return;
    }
    if (sourceAsset === destAsset) {
      setError("Source and destination assets must differ for path payment");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const destMinAmount =
        quote?.destAmount ? (parseFloat(quote.destAmount) * 0.99).toFixed(7) : sendAmount;
      const path = quote?.path ?? [];

      const xdr = await wallet.buildPathPaymentTransaction({
        sourceAsset,
        destAsset,
        sendAmount: amt,
        destMinAmount,
        destination: dest,
        path,
        memo: memo.trim() || undefined,
      });
      const signed = await wallet.signXDR(xdr);
      await wallet.submitXDR(signed);
      onSuccess();
    } catch (err) {
      setError(getDisplayMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetMax = () => {
    if (sourceBalance) setSendAmount(sourceBalance.balance);
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <button onClick={onBack} style={{ ...sharedStyles.button(), fontSize: 12 }}>
          ← Back
        </button>
        <h2 style={{ fontSize: 16, margin: 0 }}>Path Payment</h2>
      </div>

      <p style={{ fontSize: 12, color: "#8b949e", marginBottom: 12 }}>
        Send one asset and receive another. Uses path payment when assets differ.
      </p>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontSize: 12, color: "#8b949e", marginBottom: 4 }}>
          Source Asset
        </label>
        <select
          value={sourceAsset}
          onChange={(e) => setSourceAsset(e.target.value)}
          style={{ ...sharedStyles.select, marginBottom: 0 }}
        >
          {balances.map((b) => (
            <option key={getCanonicalFromBalance(b)} value={getCanonicalFromBalance(b)}>
              {formatAsset(b)}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontSize: 12, color: "#8b949e", marginBottom: 4 }}>
          Destination Asset
        </label>
        <select
          value={destAsset}
          onChange={(e) => setDestAsset(e.target.value)}
          style={{ ...sharedStyles.select, marginBottom: 0 }}
        >
          {balances.map((b) => (
            <option key={getCanonicalFromBalance(b)} value={getCanonicalFromBalance(b)}>
              {formatAsset(b)}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontSize: 12, color: "#8b949e", marginBottom: 4 }}>
          Destination (public key)
        </label>
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="G..."
          style={sharedStyles.input}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontSize: 12, color: "#8b949e", marginBottom: 4 }}>
          Amount
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={sendAmount}
            onChange={(e) => setSendAmount(e.target.value)}
            placeholder="0"
            style={{ ...sharedStyles.input, marginBottom: 0, flex: 1 }}
          />
          <button
            onClick={handleSetMax}
            style={{ ...sharedStyles.button(), padding: "10px 12px" }}
          >
            Max
          </button>
        </div>
      </div>

      {quoteLoading && sourceAsset !== destAsset && (
        <p style={{ fontSize: 12, color: "#8b949e", marginBottom: 12 }}>Finding path...</p>
      )}
      {quote && sourceAsset !== destAsset && (
        <p style={{ fontSize: 12, color: "#7ee787", marginBottom: 12 }}>
          Will receive ~{quote.destAmount} {getAssetCode(destAsset)}
        </p>
      )}

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 12, color: "#8b949e", marginBottom: 4 }}>
          Memo (optional)
        </label>
        <input
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="Memo"
          style={sharedStyles.input}
        />
      </div>

      {error && <p style={sharedStyles.error}>{error}</p>}

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onBack} disabled={submitting} style={{ ...sharedStyles.button(), flex: 1 }}>
          Cancel
        </button>
        <button
          onClick={handleSend}
          disabled={
            submitting ||
            !destination.trim() ||
            !sendAmount.trim() ||
            sourceAsset === destAsset ||
            (sourceAsset !== destAsset && !quote && quoteLoading)
          }
          style={{ ...sharedStyles.button(true), flex: 1 }}
        >
          {submitting ? "Sending..." : "Send"}
        </button>
      </div>
    </>
  );
}
