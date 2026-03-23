import { useState } from "react";
import type { StellarWallet } from "stellar-wallet-sdk";
import { getDisplayMessage } from "stellar-wallet-sdk";
import { sharedStyles } from "../constants/styles";

interface SignAuthEntryPageProps {
  wallet: StellarWallet;
  onBack: () => void;
}

export function SignAuthEntryPage({ wallet, onBack }: SignAuthEntryPageProps) {
  const [authEntryXdr, setAuthEntryXdr] = useState("");
  const [signature, setSignature] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSign = async () => {
    const xdr = authEntryXdr.trim();
    if (!xdr) {
      setError("Please enter auth entry XDR");
      return;
    }
    setLoading(true);
    setError("");
    setSignature("");
    try {
      const sig = wallet.signAuthEntry(xdr);
      setSignature(sig);
    } catch (err) {
      setError(getDisplayMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (signature) {
      navigator.clipboard.writeText(signature);
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
        <h2 style={{ fontSize: 16, margin: 0 }}>Sign Auth Entry (CAP-40)</h2>
      </div>

      <p style={{ fontSize: 12, color: "#8b949e", marginBottom: 12 }}>
        Sign a Soroban auth entry for smart contract authorization. Paste the base64-encoded HashIdPreimageSorobanAuthorization XDR.
      </p>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontSize: 12, color: "#8b949e", marginBottom: 4 }}>
          Auth Entry XDR (base64)
        </label>
        <textarea
          value={authEntryXdr}
          onChange={(e) => setAuthEntryXdr(e.target.value)}
          placeholder="Paste auth entry preimage XDR..."
          rows={6}
          style={{
            ...sharedStyles.input,
            resize: "vertical",
            fontFamily: "monospace",
            fontSize: 12,
          }}
        />
      </div>

      <button
        onClick={handleSign}
        disabled={loading || !authEntryXdr.trim()}
        style={{ ...sharedStyles.button(true), width: "100%", marginBottom: 16 }}
      >
        {loading ? "Signing..." : "Sign Auth Entry"}
      </button>

      {error && <p style={sharedStyles.error}>{error}</p>}

      {signature && (
        <div style={{ marginTop: 16 }}>
          <label style={{ display: "block", fontSize: 12, color: "#8b949e", marginBottom: 4 }}>
            Signature (base64)
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <textarea
              readOnly
              value={signature}
              rows={3}
              style={{
                ...sharedStyles.input,
                flex: 1,
                fontFamily: "monospace",
                fontSize: 12,
              }}
            />
            <button onClick={handleCopy} style={{ ...sharedStyles.button(), alignSelf: "flex-start" }}>
              Copy
            </button>
          </div>
        </div>
      )}
    </>
  );
}
