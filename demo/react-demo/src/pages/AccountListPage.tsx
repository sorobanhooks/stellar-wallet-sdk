import { sharedStyles } from "../constants/styles";
import { AccountListSection } from "../components/AccountListSection";
import type { Network } from "../constants/network";
import type { StellarWallet } from "stellar-wallet-sdk";

interface AccountListPageProps {
  wallet: StellarWallet;
  network: Network;
  setNetwork: (n: Network) => void;
  password: string;
  setPassword: (p: string) => void;
  loading: boolean;
  onSelectAccount: (publicKey: string) => void;
  onAddAccount: () => void;
  onLogout: () => void;
}

export function AccountListPage({
  wallet,
  network,
  setNetwork,
  password,
  setPassword,
  loading,
  onSelectAccount,
  onAddAccount,
  onLogout,
}: AccountListPageProps) {
  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <h2 style={{ fontSize: 16 }}>Your Accounts</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 12, color: "#8b949e" }}>Network:</label>
          <select
            value={network}
            onChange={(e) => setNetwork(e.target.value as Network)}
            style={{ ...sharedStyles.select, marginBottom: 0, width: "auto", minWidth: 100 }}
          >
            <option value="testnet">Testnet</option>
            <option value="mainnet">Mainnet</option>
          </select>
        </div>
      </div>
      <AccountListSection accounts={wallet.getAccounts()} onSelect={onSelectAccount} />
      {wallet.canAddAccount() && (
        <>
          <input
            type="password"
            placeholder="Password to add account"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ ...sharedStyles.input, marginTop: 16 }}
          />
          <button
            onClick={onAddAccount}
            disabled={loading}
            style={{ ...sharedStyles.button(true), marginBottom: 12 }}
          >
            {loading ? "..." : "Add Account"}
          </button>
        </>
      )}
      <button onClick={onLogout} style={sharedStyles.button()}>
        Logout
      </button>
    </>
  );
}
