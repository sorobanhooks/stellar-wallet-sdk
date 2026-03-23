import { useState } from "react";
import type { StellarWallet } from "stellar-wallet-sdk";
import { getDisplayMessage } from "stellar-wallet-sdk";
import { sharedStyles } from "../constants/styles";

interface SignMessagePageProps {
  wallet: StellarWallet;
  onBack: () => void;
}

export function SignMessagePage({ wallet, onBack }: SignMessagePageProps) {
  const [message, setMessage] = useState("");
  const [signature, setSignature] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSign = async () => {
    const msg = message.trim();
    if (!msg) {
      setError("Please enter a message");
      return;
    }
    setLoading(true);
    setError("");
    setSignature("");
    try {
      const sig = wallet.signMessage(msg);
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
        <h2 style={{ fontSize: 16, margin: 0 }}>Sign Message</h2>
      </div>

      <p style={{ fontSize: 12, color: "#8b949e", marginBottom: 12 }}>
        Sign a message with SEP-53 style prefix (&quot;Stellar Signed Message:\n&quot;). Used for dApp authentication.
      </p>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontSize: 12, color: "#8b949e", marginBottom: 4 }}>
          Message
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter message to sign..."
          rows={4}
          style={{
            ...sharedStyles.input,
            resize: "vertical",
            fontFamily: "monospace",
          }}
        />
      </div>

      <button
        onClick={handleSign}
        disabled={loading || !message.trim()}
        style={{ ...sharedStyles.button(true), width: "100%", marginBottom: 16 }}
      >
        {loading ? "Signing..." : "Sign Message"}
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
