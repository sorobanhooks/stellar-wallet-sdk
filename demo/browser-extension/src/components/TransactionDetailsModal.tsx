import { sharedStyles } from "../constants/styles";

interface TransactionDetailsModalProps {
  open: boolean;
  onClose: () => void;
  operations: number;
  fees: string;
  sequenceNumber: string;
  memo: string;
  xdr: string;
  changeTrust?: {
    assetCode: string;
    assetIssuer: string;
    limit: string;
  };
}

export function TransactionDetailsModal({
  open,
  onClose,
  operations,
  fees,
  sequenceNumber,
  memo,
  xdr,
  changeTrust,
}: TransactionDetailsModalProps) {
  if (!open) return null;

  const copyXdr = () => {
    navigator.clipboard.writeText(xdr);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#161b22",
          padding: 24,
          borderRadius: 12,
          border: "1px solid #30363d",
          maxWidth: 400,
          maxHeight: "80vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Transaction Details</h3>
          <button onClick={onClose} style={{ ...sharedStyles.button(), padding: "4px 8px" }}>
            X
          </button>
        </div>

        <div
          style={{
            background: "#0d1117",
            borderRadius: 8,
            padding: 16,
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ color: "#8b949e" }}>Operations</span>
            <span>{operations}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ color: "#8b949e" }}>Fees</span>
            <span>{fees}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ color: "#8b949e" }}>Sequence #</span>
            <span style={{ fontFamily: "monospace", fontSize: 11 }}>{sequenceNumber}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ color: "#8b949e" }}>Memo</span>
            <span>{memo}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#8b949e" }}>XDR</span>
            <button onClick={copyXdr} style={{ ...sharedStyles.button(), padding: "4px 8px", fontSize: 11 }}>
              Copy
            </button>
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 11, wordBreak: "break-all", marginTop: 4 }}>
            {xdr.slice(0, 48)}...
          </div>
        </div>

        {changeTrust && (
          <div
            style={{
              background: "#0d1117",
              borderRadius: 8,
              padding: 16,
              fontSize: 13,
            }}
          >
            <h4 style={{ margin: "0 0 12px", fontSize: 14 }}>Change Trust</h4>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#8b949e" }}>Asset Code</span>
              <span>{changeTrust.assetCode}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#8b949e" }}>Asset Issuer</span>
              <span style={{ fontFamily: "monospace", fontSize: 11 }}>
                {changeTrust.assetIssuer.slice(0, 8)}...{changeTrust.assetIssuer.slice(-4)}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#8b949e" }}>Type</span>
              <span>changeTrust</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              <span style={{ color: "#8b949e" }}>Limit</span>
              <span style={{ fontFamily: "monospace", fontSize: 11 }}>{changeTrust.limit}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
