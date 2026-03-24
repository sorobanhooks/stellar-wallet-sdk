import { sharedStyles } from "../constants/styles";
import { API_KEY } from "../constants/network";
import { formatAsset, getTokenId } from "../utils/asset";
import { isContractId } from "stellar-wallet-sdk";
import type { AccountBalance, TokenPriceData } from "stellar-wallet-sdk";
import type { Network } from "../constants/network";

interface AccountDetailPageProps {
  selectedAccount: string;
  network: Network;
  setNetwork: (n: Network) => void;
  balances: AccountBalance[];
  tokenPrices: Record<string, TokenPriceData | null>;
  balancesLoading: boolean;
  accountNotFound: boolean;
  onBack: () => void;
  onRefresh: () => void;
  onFundAccount: () => void;
  funding: boolean;
  onSwap: () => void;
  onSignXdr: () => void;
  onChooseAsset: () => void;
  onSend: () => void;
  onHistory: () => void;
  onRemoveTrustline: (asset: { assetCode: string; assetIssuer: string; domain?: string; name?: string; image?: string }) => void;
  onSignMessage: () => void;
  onSignAuthEntry: () => void;
  onPathPayment: () => void;
  onAddCollectible: () => void;
  onSession: () => void;
}

export function AccountDetailPage({
  selectedAccount,
  network,
  setNetwork,
  balances,
  tokenPrices,
  balancesLoading,
  accountNotFound,
  onBack,
  onRefresh,
  onFundAccount,
  funding,
  onSwap,
  onSignXdr,
  onChooseAsset,
  onSend,
  onHistory,
  onRemoveTrustline,
  onSignMessage,
  onSignAuthEntry,
  onPathPayment,
  onAddCollectible,
  onSession,
}: AccountDetailPageProps) {
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: 12,
          marginBottom: 16,
          background: "#0d1117",
          borderRadius: 8,
          fontSize: 12,
          wordBreak: "break-all",
          fontFamily: "monospace",
        }}
      >
        <span style={{ flex: 1 }}>{selectedAccount}</span>
        <button
          onClick={() => navigator.clipboard.writeText(selectedAccount)}
          style={{ ...sharedStyles.button(), padding: "6px 12px", fontSize: 12 }}
        >
          Copy
        </button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <h2 style={{ fontSize: 16 }}>Balances</h2>
        <button
          onClick={onRefresh}
          disabled={balancesLoading}
          style={{ ...sharedStyles.button(), padding: "6px 12px", fontSize: 12 }}
        >
          {balancesLoading ? "..." : "Refresh"}
        </button>
      </div>
      {accountNotFound ? (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: "#8b949e", marginBottom: 12 }}>
            {network === "testnet"
              ? "Account not found on network. Fund it with test XLM?"
              : "Account not found on network. Fund it with XLM from an exchange or another wallet."}
          </p>
          {network === "testnet" && (
            <button
              onClick={onFundAccount}
              disabled={funding}
              style={sharedStyles.button(true)}
            >
              {funding ? "Funding..." : "Fund Account"}
            </button>
          )}
        </div>
      ) : balances.length > 0 ? (
        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #30363d" }}>
              <th style={{ textAlign: "left", padding: "8px 0" }}>Asset</th>
              <th style={{ textAlign: "right", padding: "8px 0" }}>Balance</th>
              {API_KEY && (
                <>
                  <th style={{ textAlign: "right", padding: "8px 0" }}>Price (USD)</th>
                  <th style={{ textAlign: "right", padding: "8px 0" }}>24h %</th>
                </>
              )}
              <th style={{ textAlign: "right", padding: "8px 0", width: 80 }}></th>
            </tr>
          </thead>
          <tbody>
            {balances.map((b, i) => {
              const tokenId = getTokenId(b);
              const price = tokenId ? tokenPrices[tokenId] : null;
              return (
                <tr key={i} style={{ borderBottom: "1px solid #21262d" }}>
                  <td style={{ padding: "8px 0", display: "flex", alignItems: "center", gap: 8 }}>
                    {b.iconUrl ? (
                      <img
                        src={b.iconUrl}
                        alt=""
                        style={{ width: 24, height: 24, borderRadius: "50%" }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : null}
                    {formatAsset(b)}
                  </td>
                  <td style={{ textAlign: "right", padding: "8px 0" }}>{b.balance}</td>
                  {API_KEY && (
                    <>
                      <td style={{ textAlign: "right", padding: "8px 0" }}>
                        {price?.currentPrice != null
                          ? `$${(price.currentPrice * parseFloat(b.balance)).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 6,
                            })}`
                          : "—"}
                      </td>
                      <td style={{ textAlign: "right", padding: "8px 0" }}>
                        {price?.percentagePriceChange24h != null
                          ? `${price.percentagePriceChange24h >= 0 ? "+" : ""}${price.percentagePriceChange24h.toFixed(2)}%`
                          : "—"}
                      </td>
                    </>
                  )}
                  <td style={{ textAlign: "right", padding: "8px 0" }}>
                    {b.assetCode && b.assetIssuer && !isContractId(b.assetIssuer) ? (
                      <button
                        onClick={() =>
                          onRemoveTrustline({
                            assetCode: b.assetCode as string,
                            assetIssuer: b.assetIssuer as string,
                            name: b.name,
                            image: b.iconUrl,
                          })
                        }
                        style={{
                          ...sharedStyles.button(),
                          padding: "4px 8px",
                          fontSize: 11,
                        }}
                      >
                        Remove
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p style={{ fontSize: 13, color: "#8b949e" }}>
          {balancesLoading ? "Loading..." : "No balances."}
        </p>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
        {balances.length >= 1 && (
          <button onClick={onSend} style={{ ...sharedStyles.button(true), whiteSpace: "nowrap" }}>
            Send
          </button>
        )}
        <button onClick={onHistory} style={{ ...sharedStyles.button(true), whiteSpace: "nowrap" }}>
          History
        </button>
        {balances.length >= 2 && (
          <button onClick={onSwap} style={{ ...sharedStyles.button(true), whiteSpace: "nowrap" }}>
            Swap
          </button>
        )}
        <button
          onClick={onChooseAsset}
          style={{
            ...sharedStyles.button(true),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ fontSize: 16 }}>+</span> Add
        </button>
        <button onClick={onSignXdr} style={{ ...sharedStyles.button(true), whiteSpace: "nowrap" }}>
          Sign & Submit XDR
        </button>
        <button onClick={onSignMessage} style={{ ...sharedStyles.button(true), whiteSpace: "nowrap" }}>
          Sign Message
        </button>
        <button onClick={onSignAuthEntry} style={{ ...sharedStyles.button(true), whiteSpace: "nowrap" }}>
          Sign Auth Entry
        </button>
        {balances.length >= 2 && (
          <button onClick={onPathPayment} style={{ ...sharedStyles.button(true), whiteSpace: "nowrap" }}>
            Path Payment
          </button>
        )}
        <button onClick={onAddCollectible} style={{ ...sharedStyles.button(true), whiteSpace: "nowrap" }}>
          Add Collectible
        </button>
        <button onClick={onSession} style={{ ...sharedStyles.button(true), whiteSpace: "nowrap" }}>
          Session Management
        </button>
      </div>
    </>
  );
}
