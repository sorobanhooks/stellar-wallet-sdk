import { useState, useEffect } from "react";
import type { StellarWallet } from "stellar-wallet-sdk";
import { getDisplayMessage } from "stellar-wallet-sdk";
import { sharedStyles } from "../constants/styles";

interface SessionPageProps {
  wallet: StellarWallet;
  onBack: () => void;
}

export function SessionPage({ wallet, onBack }: SessionPageProps) {
  const [durationMin, setDurationMin] = useState("15");
  const [sessionActive, setSessionActive] = useState(false);
  const [xdrInput, setXdrInput] = useState("");
  const [signedXdr, setSignedXdr] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if a session key exists in the wallet instance
    // Note: StellarWallet doesn't have a public 'hasSession' but we can infer or just try to sign
  }, []);

  const handleCreateSession = () => {
    const min = parseInt(durationMin);
    if (isNaN(min) || min <= 0) {
      setError("Please enter a valid duration in minutes");
      return;
    }
    setError("");
    try {
      wallet.createSession(min * 60 * 1000);
      setSessionActive(true);
      setError("Session created successfully! You can now sign without a password.");
    } catch (err) {
      setError(getDisplayMessage(err));
    }
  };

  const handleSignWithSession = () => {
    const xdr = xdrInput.trim();
    if (!xdr) {
      setError("Please enter XDR to sign");
      return;
    }
    setLoading(true);
    setError("");
    setSignedXdr("");
    try {
      const signed = wallet.signWithSession(xdr);
      setSignedXdr(signed);
      setError("Signed successfully using session key!");
    } catch (err) {
      setError(getDisplayMessage(err));
      if (getDisplayMessage(err).toLowerCase().includes("session")) {
        setSessionActive(false);
      }
    } finally {
      setLoading(false);
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
        <h2 style={{ fontSize: 16, margin: 0 }}>Session Management</h2>
      </div>

      <p style={{ fontSize: 13, color: "#8b949e", marginBottom: 16 }}>
        Create a time-limited session key to sign transactions without keeping the main key in memory.
      </p>

      <div
        style={{
          background: "#0d1117",
          borderRadius: 8,
          border: "1px solid #30363d",
          padding: 16,
          marginBottom: 16,
        }}
      >
        <label style={{ display: "block", fontSize: 12, color: "#8b949e", marginBottom: 8 }}>
          Session Duration (minutes)
        </label>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            type="number"
            value={durationMin}
            onChange={(e) => setDurationMin(e.target.value)}
            style={{ ...sharedStyles.input, marginBottom: 0, flex: 1 }}
          />
          <button
            onClick={handleCreateSession}
            style={sharedStyles.button(true)}
          >
            Create Session
          </button>
        </div>
        {sessionActive && (
          <p style={{ ...sharedStyles.success, margin: 0, fontSize: 12 }}>
            ✓ Session is currently active
          </p>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 12, color: "#8b949e", marginBottom: 8 }}>
          Transaction XDR
        </label>
        <textarea
          value={xdrInput}
          onChange={(e) => setXdrInput(e.target.value)}
          placeholder="Paste unsigned XDR..."
          rows={4}
          style={{ ...sharedStyles.input, fontFamily: "monospace", fontSize: 12 }}
        />
        <button
          onClick={handleSignWithSession}
          disabled={loading || !sessionActive}
          style={{ ...sharedStyles.button(true), width: "100%", marginTop: 8 }}
        >
          {loading ? "Signing..." : "Sign with Session Key"}
        </button>
      </div>

      {error && (
        <p
          style={{
            ...(error.includes("success") ? sharedStyles.success : sharedStyles.error),
            marginBottom: 16,
          }}
        >
          {error}
        </p>
      )}

      {signedXdr && (
        <div>
          <label style={{ display: "block", fontSize: 12, color: "#8b949e", marginBottom: 4 }}>
            Signed XDR
          </label>
          <textarea
            readOnly
            value={signedXdr}
            rows={4}
            style={{ ...sharedStyles.input, fontFamily: "monospace", fontSize: 12 }}
          />
          <button
            onClick={() => navigator.clipboard.writeText(signedXdr)}
            style={{ ...sharedStyles.button(), width: "100%", marginTop: 8 }}
          >
            Copy Signed XDR
          </button>
        </div>
      )}
    </>
  );
}
