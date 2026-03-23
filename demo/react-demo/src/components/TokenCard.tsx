import type { AccountBalance } from "stellar-wallet-sdk";
import { sharedStyles } from "../constants/styles";

interface TokenCardProps {
  balance: AccountBalance | undefined;
  canonical: string;
  onClick: () => void;
}

export function TokenCard({ balance, canonical, onClick }: TokenCardProps) {
  const code = canonical === "native" ? "XLM" : canonical.split(":")[0];
  const displayName = balance?.name ?? code;
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: 16,
        background: "transparent",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        color: "#e6edf3",
        textAlign: "left",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {balance?.iconUrl ? (
          <img
            src={balance.iconUrl}
            alt=""
            style={{ width: 24, height: 24, borderRadius: "50%" }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : null}
        <div>
          <div style={{ fontWeight: 600 }}>{displayName}</div>
          <div style={{ fontSize: 12, color: "#8b949e" }}>{balance?.balance ?? "0"}</div>
        </div>
      </div>
      <span style={{ color: "#8b949e" }}>&gt;</span>
    </button>
  );
}
