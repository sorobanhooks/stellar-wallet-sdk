import { useState } from "react";
import type { StellarWallet } from "stellar-wallet-sdk";
import { getDisplayMessage } from "stellar-wallet-sdk";
import type { CollectibleMetadata } from "stellar-wallet-sdk";
import { sharedStyles } from "../constants/styles";
import type { Network } from "../constants/network";

const COLLECTIBLES_STORAGE_KEY = "stellar_collectibles";

interface StoredCollectible extends CollectibleMetadata {
  addedAt?: number;
}

function getStoredCollectibles(network: Network): StoredCollectible[] {
  try {
    const raw = localStorage.getItem(`${COLLECTIBLES_STORAGE_KEY}_${network}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredCollectible[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCollectibles(network: Network, items: StoredCollectible[]) {
  localStorage.setItem(`${COLLECTIBLES_STORAGE_KEY}_${network}`, JSON.stringify(items));
}

interface AddCollectiblePageProps {
  wallet: StellarWallet;
  network: Network;
  onBack: () => void;
}

export function AddCollectiblePage({
  wallet,
  network,
  onBack,
}: AddCollectiblePageProps) {
  const [contractId, setContractId] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [addedCollectible, setAddedCollectible] = useState<StoredCollectible | null>(null);
  const [collectibles, setCollectibles] = useState<StoredCollectible[]>(
    () => getStoredCollectibles(network)
  );

  const handleAdd = async () => {
    const cId = contractId.trim();
    const tId = tokenId.trim();
    if (!cId || !tId) {
      setError("Please enter contract ID and token ID");
      return;
    }
    setLoading(true);
    setError("");
    setAddedCollectible(null);
    try {
      const metadata = await wallet.addCollectible(cId, tId);
      const item: StoredCollectible = {
        ...metadata,
        addedAt: Date.now(),
      };
      const exists = collectibles.some(
        (c) => c.contractId === cId && c.tokenId === tId
      );
      const updated = exists
        ? collectibles.map((c) =>
            c.contractId === cId && c.tokenId === tId ? item : c
          )
        : [...collectibles, item];
      setCollectibles(updated);
      saveCollectibles(network, updated);
      setAddedCollectible(item);
      setContractId("");
      setTokenId("");
    } catch (err) {
      setError(getDisplayMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (cId: string, tId: string) => {
    const updated = collectibles.filter(
      (c) => !(c.contractId === cId && c.tokenId === tId)
    );
    setCollectibles(updated);
    saveCollectibles(network, updated);
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
        <h2 style={{ fontSize: 16, margin: 0 }}>Add Collectible</h2>
      </div>

      <p style={{ fontSize: 13, color: "#8b949e", marginBottom: 12 }}>
        Enter a Soroban NFT contract ID and token ID to add it to your collectibles.
      </p>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontSize: 12, color: "#8b949e", marginBottom: 4 }}>
          Contract ID
        </label>
        <input
          type="text"
          value={contractId}
          onChange={(e) => setContractId(e.target.value)}
          placeholder="C..."
          style={sharedStyles.input}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontSize: 12, color: "#8b949e", marginBottom: 4 }}>
          Token ID
        </label>
        <input
          type="text"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
          placeholder="1 or token identifier"
          style={sharedStyles.input}
        />
      </div>

      {error && <p style={sharedStyles.error}>{error}</p>}
      {addedCollectible && (
        <p style={sharedStyles.success}>
          Added: {addedCollectible.name || addedCollectible.tokenId}
          {addedCollectible.image && " (with image)"}
        </p>
      )}

      <div style={{ marginBottom: 24 }}>
        <button
          onClick={handleAdd}
          disabled={loading || !contractId.trim() || !tokenId.trim()}
          style={{ ...sharedStyles.button(true), width: "100%" }}
        >
          {loading ? "Adding..." : "Add Collectible"}
        </button>
      </div>

      {collectibles.length > 0 && (
        <>
          <h3 style={{ fontSize: 14, marginBottom: 8 }}>Collectibles</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {collectibles.map((c, i) => (
              <li
                key={`${c.contractId}-${c.tokenId}-${i}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "8px 0",
                  borderBottom: "1px solid #21262d",
                  fontSize: 13,
                }}
              >
                {c.image ? (
                  <img
                    src={c.image}
                    alt=""
                    style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover" }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : null}
                <span style={{ flex: 1 }}>
                  {c.name || c.tokenId} — {c.contractId.slice(0, 8)}.../{c.tokenId}
                </span>
                <button
                  onClick={() => handleRemove(c.contractId, c.tokenId)}
                  style={{ ...sharedStyles.button(), padding: "4px 8px", fontSize: 11 }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
