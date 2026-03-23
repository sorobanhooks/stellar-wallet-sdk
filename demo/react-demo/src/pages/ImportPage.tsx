import { useState } from "react";
import { sharedStyles } from "../constants/styles";
import type { Network } from "../constants/network";

type ImportMode = "mnemonic" | "secretKey";

interface ImportPageProps {
  network: Network;
  setNetwork: (n: Network) => void;
  mnemonic: string;
  setMnemonic: (m: string) => void;
  secretKey: string;
  setSecretKey: (s: string) => void;
  password: string;
  setPassword: (p: string) => void;
  loading: boolean;
  onImportMnemonic: () => void;
  onImportSecretKey: () => void;
  onBack: () => void;
}

export function ImportPage({
  network,
  setNetwork,
  mnemonic,
  setMnemonic,
  secretKey,
  setSecretKey,
  password,
  setPassword,
  loading,
  onImportMnemonic,
  onImportSecretKey,
  onBack,
}: ImportPageProps) {
  const [mode, setMode] = useState<ImportMode>("mnemonic");

  const handleImport = () => {
    if (mode === "mnemonic") {
      onImportMnemonic();
    } else {
      onImportSecretKey();
    }
  };

  const canImport =
    password.trim() &&
    (mode === "mnemonic" ? mnemonic.trim() : secretKey.trim());

  return (
    <>
      <label style={{ fontSize: 12, color: "#8b949e", marginBottom: 4, display: "block" }}>
        Network
      </label>
      <select
        value={network}
        onChange={(e) => setNetwork(e.target.value as Network)}
        style={{ ...sharedStyles.select, marginBottom: 12 }}
      >
        <option value="testnet">Testnet</option>
        <option value="mainnet">Mainnet</option>
      </select>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => setMode("mnemonic")}
          style={{
            ...sharedStyles.button(mode === "mnemonic"),
            flex: 1,
          }}
        >
          Mnemonic
        </button>
        <button
          type="button"
          onClick={() => setMode("secretKey")}
          style={{
            ...sharedStyles.button(mode === "secretKey"),
            flex: 1,
          }}
        >
          Secret Key
        </button>
      </div>

      {mode === "mnemonic" ? (
        <textarea
          placeholder="Enter your 12 or 24 word mnemonic phrase"
          value={mnemonic}
          onChange={(e) => setMnemonic(e.target.value)}
          rows={4}
          style={{
            ...sharedStyles.input,
            resize: "vertical",
            fontFamily: "monospace",
            marginBottom: 12,
          }}
        />
      ) : (
        <input
          type="password"
          placeholder="Enter your secret key (starts with S...)"
          value={secretKey}
          onChange={(e) => setSecretKey(e.target.value)}
          style={{ ...sharedStyles.input, marginBottom: 12, fontFamily: "monospace" }}
        />
      )}

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={sharedStyles.input}
      />
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button
          onClick={handleImport}
          disabled={loading || !canImport}
          style={{ ...sharedStyles.button(true), flex: 1 }}
        >
          {loading ? "..." : "Import"}
        </button>
        <button onClick={onBack} disabled={loading} style={sharedStyles.button()}>
          Back
        </button>
      </div>
    </>
  );
}
