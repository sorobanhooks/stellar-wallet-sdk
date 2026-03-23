import type { SearchAssetResult } from "stellar-wallet-sdk";
import { isContractId } from "stellar-wallet-sdk";
import { sharedStyles } from "../constants/styles";

function truncateContractId(contractId: string): string {
  if (contractId.length <= 12) return contractId;
  return `${contractId.slice(0, 4)}...${contractId.slice(-4)}`;
}

interface AssetResultItemProps {
  asset: SearchAssetResult;
  onAdd: () => void;
}

export function AssetResultItem({ asset, onAdd }: AssetResultItemProps) {
  const isSoroban = isContractId(asset.assetIssuer);
  const displayName = isSoroban
    ? truncateContractId(asset.assetIssuer)
    : asset.name ?? asset.assetCode;
  const domain = asset.domain ?? "Stellar Network";
  const iconFallback = asset.assetCode?.slice(0, 2).toUpperCase() ?? "?";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 12,
        marginBottom: 8,
        background: "#0d1117",
        borderRadius: 8,
        border: "1px solid #30363d",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {asset.image ? (
          <img
            src={asset.image}
            alt=""
            style={{ width: 32, height: 32, borderRadius: "50%" }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "#fff",
              color: "#000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {iconFallback}
          </div>
        )}
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{displayName}</div>
          <div style={{ fontSize: 12, color: "#8b949e" }}>{domain}</div>
        </div>
      </div>
      <button
        onClick={onAdd}
        style={{
          ...sharedStyles.button(),
          padding: "6px 12px",
          fontSize: 12,
          border: "1px solid #30363d",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <span>+</span> Add
      </button>
    </div>
  );
}
