import type { WalletAccount } from "stellar-wallet-sdk";
import { sharedStyles } from "../constants/styles";

interface AccountListSectionProps {
  accounts: WalletAccount[];
  onSelect: (publicKey: string) => void;
}

export function AccountListSection({ accounts, onSelect }: AccountListSectionProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      {accounts.map((acc) => (
        <button
          key={acc.publicKey}
          onClick={() => onSelect(acc.publicKey)}
          style={{
            ...sharedStyles.button(),
            width: "100%",
            marginBottom: 8,
            textAlign: "left",
            display: "block",
            padding: 12,
          }}
        >
          <div style={{ fontSize: 12, fontFamily: "monospace", wordBreak: "break-all" }}>
            {acc.publicKey}
          </div>
          <div style={{ fontSize: 11, color: "#8b949e", marginTop: 4 }}>{acc.source}</div>
        </button>
      ))}
    </div>
  );
}
