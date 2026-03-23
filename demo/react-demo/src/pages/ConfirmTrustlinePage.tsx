import { useState, useEffect } from "react";
import { TransactionBuilder } from "@stellar/stellar-sdk";
import type { StellarWallet } from "stellar-wallet-sdk";
import { getDisplayMessage } from "stellar-wallet-sdk";
import { sharedStyles } from "../constants/styles";
import { TransactionDetailsModal } from "../components/TransactionDetailsModal";
import { BASE_FEE_XLM } from "../constants/config";
import { NETWORK_CONFIGS } from "../constants/network";
import type { Network } from "../constants/network";

interface ConfirmTrustlinePageProps {
  wallet: StellarWallet;
  selectedAccount: string;
  network: Network;
  asset: {
    assetCode: string;
    assetIssuer: string;
    domain?: string;
    name?: string;
    image?: string;
  };
  mode?: "add" | "remove";
  onBack: () => void;
  onSuccess: () => void;
}

function truncateAddress(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export function ConfirmTrustlinePage({
  wallet,
  selectedAccount,
  network,
  asset,
  mode = "add",
  onBack,
  onSuccess,
}: ConfirmTrustlinePageProps) {
  const [xdr, setXdr] = useState<string | null>(null);
  const [sequence, setSequence] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const limit = mode === "remove" ? "0" : undefined;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const unsignedXdr = await wallet.buildTrustlineTransaction(
          asset.assetCode,
          asset.assetIssuer,
          limit
        );
        if (cancelled) return;
        setXdr(unsignedXdr);
        try {
          const passphrase = NETWORK_CONFIGS[network].networkPassphrase;
          const tx = TransactionBuilder.fromXDR(unsignedXdr, passphrase);
          const seq = (tx as { sequence?: string }).sequence;
          if (seq) setSequence(String(seq));
        } catch {
          setSequence("—");
        }
      } catch (err) {
        if (!cancelled) setError(getDisplayMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [wallet, network, asset.assetCode, asset.assetIssuer, limit]);

  const handleConfirm = async () => {
    if (!xdr) return;
    setSubmitting(true);
    setError(null);
    try {
      await wallet.createTrustline(asset.assetCode, asset.assetIssuer, limit);
      onSuccess();
    } catch (err) {
      setError(getDisplayMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const displayName = asset.name ?? asset.assetCode;
  const dAppOrigin = asset.domain ?? "stellar-wallet-demo";

  if (loading) {
    return (
      <>
        <button onClick={onBack} style={{ ...sharedStyles.button(), fontSize: 12, marginBottom: 16 }}>
          Back
        </button>
        <p style={{ fontSize: 13, color: "#8b949e" }}>Building transaction...</p>
      </>
    );
  }

  if (error && !xdr) {
    return (
      <>
        <button onClick={onBack} style={{ ...sharedStyles.button(), fontSize: 12, marginBottom: 16 }}>
          Back
        </button>
        <p style={sharedStyles.error}>{error}</p>
      </>
    );
  }

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
          Back
        </button>
        <h2 style={{ fontSize: 16, margin: 0 }}>Choose asset</h2>
      </div>

      <div
        style={{
          background: "#0d1117",
          borderRadius: 8,
          border: "1px solid #30363d",
          padding: 16,
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 24 }}>XLM</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>Confirm Transaction</div>
            <div style={{ fontSize: 12, color: "#8b949e" }}>{dAppOrigin}</div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 12,
            background: "#161b22",
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {asset.image ? (
              <img
                src={asset.image}
                alt=""
                style={{ width: 32, height: 32, borderRadius: "50%" }}
              />
            ) : (
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "#6f42c1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {asset.assetCode.slice(0, 1).toUpperCase()}
              </div>
            )}
            <span style={{ fontWeight: 600 }}>{displayName}</span>
          </div>
          <span style={{ fontSize: 12, color: "#8b949e" }}>
            {mode === "remove" ? "Remove Trustline" : "Add Trustline"}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
            fontSize: 13,
          }}
        >
          <span style={{ color: "#8b949e" }}>Wallet</span>
          <span style={{ fontFamily: "monospace" }}>{truncateAddress(selectedAccount)}</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 13,
          }}
        >
          <span style={{ color: "#8b949e" }}>Fee</span>
          <span>{BASE_FEE_XLM} XLM</span>
        </div>
      </div>

      <button
        onClick={() => setDetailsOpen(true)}
        style={{
          ...sharedStyles.button(),
          width: "100%",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        Transaction details
      </button>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={onBack}
          disabled={submitting}
          style={{ ...sharedStyles.button(), flex: 1 }}
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={submitting || !xdr}
          style={{ ...sharedStyles.button(true), flex: 1 }}
        >
          {submitting ? "..." : "Confirm"}
        </button>
      </div>

      {error && <p style={{ ...sharedStyles.error, marginTop: 12 }}>{error}</p>}

      <TransactionDetailsModal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        operations={1}
        fees={`${BASE_FEE_XLM} XLM`}
        sequenceNumber={sequence || "—"}
        memo="None (MEMO_NONE)"
        xdr={xdr ?? ""}
        changeTrust={{
          assetCode: asset.assetCode,
          assetIssuer: asset.assetIssuer,
          limit: limit ?? "922337203685.4775807",
        }}
      />
    </>
  );
}
