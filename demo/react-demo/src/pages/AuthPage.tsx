import { sharedStyles } from "../constants/styles";
import { NETWORK_CONFIGS } from "../constants/network";
import type { Network } from "../constants/network";

interface AuthPageProps {
  network: Network;
  setNetwork: (n: Network) => void;
  password: string;
  setPassword: (p: string) => void;
  loading: boolean;
  hasStoredWallet: boolean;
  onCreate: () => void;
  onImport: () => void;
  onRestore: () => void;
}

export function AuthPage({
  network,
  setNetwork,
  password,
  setPassword,
  loading,
  hasStoredWallet,
  onCreate,
  onImport,
  onRestore,
}: AuthPageProps) {
  return (
    <>
      {!hasStoredWallet && (
        <p style={{ fontSize: 13, color: "#8b949e", marginBottom: 12 }}>
          No wallet found. Create a new one or import from mnemonic or secret key.
        </p>
      )}
      <label style={{ fontSize: 12, color: "#8b949e", marginBottom: 4, display: "block" }}>
        Network
      </label>
      <select
        value={network}
        onChange={(e) => setNetwork(e.target.value as Network)}
        style={sharedStyles.select}
      >
        <option value="testnet">Testnet</option>
        <option value="mainnet">Mainnet</option>
      </select>
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={sharedStyles.input}
      />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={onCreate}
          disabled={loading}
          style={{ ...sharedStyles.button(true), flex: 1 }}
        >
          {loading ? "..." : "Create"}
        </button>
        <button
          onClick={onImport}
          disabled={loading}
          style={{ ...sharedStyles.button(), flex: 1 }}
        >
          Import
        </button>
        {hasStoredWallet && (
          <button
            onClick={onRestore}
            disabled={loading}
            style={{ ...sharedStyles.button(), flex: 1 }}
          >
            {loading ? "..." : "Unlock"}
          </button>
        )}
      </div>
    </>
  );
}
