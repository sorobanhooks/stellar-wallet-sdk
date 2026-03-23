import { useState } from "react";
import type { StellarWallet } from "stellar-wallet-sdk";
import type { SearchAssetResult } from "stellar-wallet-sdk";
import { isContractId } from "stellar-wallet-sdk";
import { sharedStyles } from "../constants/styles";
import { AssetSearchInput } from "../components/AssetSearchInput";
import { AssetResultItem } from "../components/AssetResultItem";
import { AssetWarning } from "../components/AssetWarning";
import { AddTokenConfirmModal } from "../components/AddTokenConfirmModal";
import { useAssetSearch } from "../hooks/useAssetSearch";
import type { Network } from "../constants/network";

interface ChooseAssetPageProps {
  wallet: StellarWallet;
  selectedAccount: string;
  network: Network;
  onBack: () => void;
  onAddAsset: (asset: SearchAssetResult) => void;
  onAddSorobanToken: (asset: SearchAssetResult) => void | Promise<void>;
}

function hasMultipleSimilarCodes(results: SearchAssetResult[]): boolean {
  const codes = new Map<string, number>();
  for (const r of results) {
    const code = r.assetCode.toUpperCase();
    codes.set(code, (codes.get(code) ?? 0) + 1);
  }
  return [...codes.values()].some((c) => c > 1);
}

export function ChooseAssetPage({
  wallet,
  selectedAccount,
  onBack,
  onAddAsset,
  onAddSorobanToken,
}: ChooseAssetPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSorobanToken, setSelectedSorobanToken] = useState<SearchAssetResult | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const { results, loading, error } = useAssetSearch(wallet, searchQuery);
  const showWarning = results.length > 1 && hasMultipleSimilarCodes(results);

  const handleAddAsset = (asset: SearchAssetResult) => {
    if (isContractId(asset.assetIssuer)) {
      setSelectedSorobanToken(asset);
    } else {
      onAddAsset(asset);
    }
  };

  const handleConfirmAddSorobanToken = async () => {
    if (!selectedSorobanToken) return;
    setIsConfirming(true);
    try {
      await onAddSorobanToken(selectedSorobanToken);
      setSelectedSorobanToken(null);
    } finally {
      setIsConfirming(false);
    }
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
        <h2 style={{ fontSize: 16, margin: 0 }}>Choose asset</h2>
      </div>

      <AssetSearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="test"
      />

      <p style={{ fontSize: 12, color: "#8b949e", marginBottom: 12 }}>
        powered by stellar.expert
      </p>

      {showWarning && <AssetWarning />}

      <div style={{ marginBottom: 8 }}>
        <h3
          style={{
            fontSize: 14,
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          Not on your lists
          <span
            title="Results are assets not yet in your wallet or tracked lists"
            style={{ color: "#58a6ff", fontSize: 12, cursor: "help" }}
          >
            ⓘ
          </span>
        </h3>
      </div>

      {error && <p style={sharedStyles.error}>{error}</p>}
      {loading && <p style={{ fontSize: 13, color: "#8b949e" }}>Searching...</p>}

      {!loading && results.length === 0 && searchQuery.trim() && (
        <p style={{ fontSize: 13, color: "#8b949e" }}>No assets found.</p>
      )}

      {!loading &&
        results.map((asset) => (
          <AssetResultItem
            key={`${asset.assetCode}:${asset.assetIssuer}`}
            asset={asset}
            onAdd={() => handleAddAsset(asset)}
          />
        ))}

      {selectedSorobanToken && (
        <AddTokenConfirmModal
          token={selectedSorobanToken}
          walletAddress={selectedAccount}
          onConfirm={handleConfirmAddSorobanToken}
          onCancel={() => setSelectedSorobanToken(null)}
          isConfirming={isConfirming}
        />
      )}
    </>
  );
}
