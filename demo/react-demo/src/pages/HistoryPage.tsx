import { useState, useEffect } from "react";
import type { StellarWallet, TransactionRecord } from "stellar-wallet-sdk";
import { getDisplayMessage } from "stellar-wallet-sdk";
import { sharedStyles } from "../constants/styles";
import type { Network } from "../constants/network";

interface HistoryPageProps {
  wallet: StellarWallet;
  selectedAccount: string;
  network: Network;
  onBack: () => void;
}

function truncateHash(hash: string): string {
  if (hash.length <= 12) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-6)}`;
}

function formatDate(createdAt: string): string {
  try {
    const d = new Date(createdAt);
    return d.toLocaleString();
  } catch {
    return createdAt;
  }
}

export function HistoryPage({
  wallet,
  selectedAccount,
  network,
  onBack,
}: HistoryPageProps) {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const txs = await wallet.getAccountTransactions(selectedAccount, { limit: 20 });
        if (!cancelled) setTransactions(txs);
      } catch (err) {
        if (!cancelled) setError(getDisplayMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [wallet, selectedAccount]);

  const explorerBase =
    network === "testnet"
      ? "https://stellar.expert/explorer/testnet"
      : "https://stellar.expert/explorer/public";

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
        <h2 style={{ fontSize: 16, margin: 0 }}>Transaction History</h2>
      </div>

      {loading && <p style={{ fontSize: 13, color: "#8b949e" }}>Loading...</p>}
      {error && <p style={sharedStyles.error}>{error}</p>}

      {!loading && !error && transactions.length === 0 && (
        <p style={{ fontSize: 13, color: "#8b949e" }}>No transactions yet.</p>
      )}

      {!loading && transactions.length > 0 && (
        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #30363d" }}>
              <th style={{ textAlign: "left", padding: "8px 0" }}>Date</th>
              <th style={{ textAlign: "left", padding: "8px 0" }}>Hash</th>
              <th style={{ textAlign: "center", padding: "8px 0" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} style={{ borderBottom: "1px solid #21262d" }}>
                <td style={{ padding: "8px 0", fontSize: 12 }}>{formatDate(tx.created_at)}</td>
                <td style={{ padding: "8px 0" }}>
                  <a
                    href={`${explorerBase}/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#58a6ff", textDecoration: "none" }}
                  >
                    {truncateHash(tx.hash)}
                  </a>
                </td>
                <td style={{ padding: "8px 0", textAlign: "center" }}>
                  <span
                    style={{
                      color: tx.successful ? "#7ee787" : "#f85149",
                      fontSize: 12,
                    }}
                  >
                    {tx.successful ? "Success" : "Failed"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
