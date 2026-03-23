import type { SearchAssetResult } from "stellar-wallet-sdk";
import { sharedStyles } from "../constants/styles";

function truncateAddress(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

function truncateContractId(contractId: string): string {
  if (contractId.length <= 12) return contractId;
  return `${contractId.slice(0, 4)}...${contractId.slice(-4)}`;
}

interface AddTokenConfirmModalProps {
  token: SearchAssetResult;
  walletAddress: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  isConfirming?: boolean;
}

export function AddTokenConfirmModal({
  token,
  walletAddress,
  onConfirm,
  onCancel,
  isConfirming = false,
}: AddTokenConfirmModalProps) {
  const displayName = token.contractId
    ? truncateContractId(token.contractId)
    : token.name ?? token.assetCode;
  const contractId = token.contractId ?? token.assetIssuer;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#161b22",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          border: "1px solid #30363d",
          padding: 24,
          margin: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          {token.image ? (
            <img
              src={token.image}
              alt=""
              style={{ width: 48, height: 48, borderRadius: "50%", marginBottom: 12 }}
            />
          ) : (
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "#6f42c1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 16,
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              {token.assetCode?.slice(0, 2).toUpperCase() ?? "?"}
            </div>
          )}
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>
            {displayName}
          </div>
          <div
            style={{
              padding: "8px 16px",
              background: "#6f42c1",
              borderRadius: 8,
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span style={{ fontSize: 18 }}>⊕</span> Add Token
          </div>
        </div>

        <p
          style={{
            fontSize: 13,
            color: "#8b949e",
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          Allow token to be displayed and used with this wallet address
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 12,
            background: "#0d1117",
            borderRadius: 8,
            marginBottom: 20,
            fontSize: 13,
          }}
        >
          <span style={{ color: "#8b949e", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>✉️</span> Wallet
          </span>
          <span style={{ fontFamily: "monospace" }}>{truncateAddress(walletAddress)}</span>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onCancel}
            disabled={isConfirming}
            style={{ ...sharedStyles.button(), flex: 1 }}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm()}
            disabled={isConfirming}
            style={{ ...sharedStyles.button(true), flex: 1 }}
          >
            {isConfirming ? "..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
