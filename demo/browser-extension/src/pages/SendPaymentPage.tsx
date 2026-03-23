import { useState } from "react";
import type { StellarWallet } from "stellar-wallet-sdk";
import { getDisplayMessage } from "stellar-wallet-sdk";
import { sharedStyles } from "../constants/styles";
import { formatAsset, getCanonicalFromBalance } from "../utils/asset";
import type { AccountBalance } from "stellar-wallet-sdk";
import type { Network } from "../constants/network";

interface SendPaymentPageProps {
  wallet: StellarWallet;
  selectedAccount: string;
  network: Network;
  balances: AccountBalance[];
  onBack: () => void;
  onSuccess: () => void;
}

export function SendPaymentPage({
  wallet,
  selectedAccount,
  balances,
  onBack,
  onSuccess,
}: SendPaymentPageProps) {
  const [destination, setDestination] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<string>(
    balances.length > 0 ? getCanonicalFromBalance(balances[0]) : "native"
  );
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedBalance = balances.find((b) => getCanonicalFromBalance(b) === selectedAsset);
  const assetCode = selectedBalance?.assetType === "native" ? "XLM" : selectedBalance?.assetCode ?? "XLM";
  const assetIssuer = selectedBalance?.assetType === "native" ? "" : selectedBalance?.assetIssuer ?? "";

  const handleSend = async () => {
    const dest = destination.trim();
    const amt = amount.trim();
    if (!dest || !amt) {
      setError("Please enter destination and amount");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const xdr = await wallet.buildPaymentTransaction({
        destination: dest,
        assetCode,
        assetIssuer,
        amount: amt,
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
    if (selectedBalance) setAmount(selectedBalance.balance);
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
        <h2 style={{ fontSize: 16, margin: 0 }}>Send</h2>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontSize: 12, color: "#8b949e", marginBottom: 4 }}>
          Asset
        </label>
        <select
          value={selectedAsset}
          onChange={(e) => setSelectedAsset(e.target.value)}
          style={{ ...sharedStyles.select, marginBottom: 0 }}
        >
          {balances.map((b) => (
            <option key={getCanonicalFromBalance(b)} value={getCanonicalFromBalance(b)}>
              {formatAsset(b)} ({b.balance})
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
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
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
          disabled={submitting || !destination.trim() || !amount.trim()}
          style={{ ...sharedStyles.button(true), flex: 1 }}
        >
          {submitting ? "Sending..." : "Send"}
        </button>
      </div>
    </>
  );
}
