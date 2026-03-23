import { sharedStyles } from "../constants/styles";

interface CreateResultPageProps {
  mnemonic: string;
  onAck: () => void;
}

export function CreateResultPage({ mnemonic, onAck }: CreateResultPageProps) {
  return (
    <>
      <p style={{ fontSize: 13, color: "#f0883e", marginBottom: 12 }}>
        Save your mnemonic phrase securely. Anyone with it can access your accounts. Never share
        it.
      </p>
      <div
        style={{
          padding: 16,
          marginBottom: 16,
          background: "#0d1117",
          borderRadius: 8,
          fontSize: 13,
          fontFamily: "monospace",
          wordBreak: "break-word",
          border: "1px solid #30363d",
        }}
      >
        {mnemonic}
      </div>
      <button onClick={onAck} style={sharedStyles.button(true)}>
        I&apos;ve saved my mnemonic
      </button>
    </>
  );
}
