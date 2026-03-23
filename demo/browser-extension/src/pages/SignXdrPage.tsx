import { sharedStyles } from "../constants/styles";
import type { SubmitTransactionResult } from "stellar-wallet-sdk";

interface SignXdrPageProps {
  xdrInput: string;
  setXdrInput: (s: string) => void;
  signedXdr: string;
  submitResult: SubmitTransactionResult | null;
  loading: boolean;
  onBack: () => void;
  onSignOnly: () => void;
  onSignAndSubmit: () => void;
}

export function SignXdrPage({
  xdrInput,
  setXdrInput,
  signedXdr,
  submitResult,
  loading,
  onBack,
  onSignOnly,
  onSignAndSubmit,
}: SignXdrPageProps) {
  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <button onClick={onBack} style={{ ...sharedStyles.button(), fontSize: 12 }}>
          ← Back
        </button>
      </div>
      <h2 style={{ fontSize: 16, marginBottom: 12 }}>Sign & Submit XDR</h2>
      <p style={{ fontSize: 13, color: "#8b949e", marginBottom: 12 }}>
        Paste an unsigned transaction XDR (base64) below.
      </p>
      <textarea
        placeholder="Paste transaction XDR here..."
        value={xdrInput}
        onChange={(e) => setXdrInput(e.target.value)}
        rows={6}
        style={{
          ...sharedStyles.input,
          resize: "vertical",
          fontFamily: "monospace",
          fontSize: 12,
        }}
      />
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          onClick={onSignOnly}
          disabled={loading}
          style={{ ...sharedStyles.button(), flex: 1 }}
        >
          {loading ? "..." : "Sign only"}
        </button>
        <button
          onClick={onSignAndSubmit}
          disabled={loading}
          style={{ ...sharedStyles.button(true), flex: 1 }}
        >
          {loading ? "..." : "Sign & Submit"}
        </button>
      </div>
      {signedXdr && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: "#8b949e", marginBottom: 4, display: "block" }}>
            Signed XDR (copy to submit elsewhere)
          </label>
          <textarea
            readOnly
            value={signedXdr}
            rows={4}
            style={{
              ...sharedStyles.input,
              fontFamily: "monospace",
              fontSize: 12,
              resize: "vertical",
            }}
          />
        </div>
      )}
      {submitResult && (
        <div
          style={{
            padding: 16,
            marginBottom: 16,
            background: "#0d1117",
            borderRadius: 8,
            fontSize: 13,
            fontFamily: "monospace",
            border: "1px solid #30363d",
          }}
        >
          <div style={{ marginBottom: 8 }}>
            <strong>Hash:</strong> {submitResult.hash}
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>Ledger:</strong> {submitResult.ledger}
          </div>
          <div>
            <strong>Successful:</strong> {submitResult.successful ? "Yes" : "No"}
          </div>
        </div>
      )}
    </>
  );
}
