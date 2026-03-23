import { TokenCard } from "../components/TokenCard";
import { sharedStyles } from "../constants/styles";
import { BASE_FEE_XLM } from "../constants/config";
import { INDEXER_URL } from "../constants/network";
import type { AccountBalance, SwapQuote } from "stellar-wallet-sdk";

interface SwapPageProps {
  network: "mainnet" | "testnet";
  swapStep: "input" | "review" | "swapping" | "success";
  fromAsset: string;
  toAsset: string;
  swapAmount: string;
  setSwapAmount: (s: string) => void;
  slippagePercent: number;
  setSlippagePercent: (n: number) => void;
  swapQuote: SwapQuote | null;
  swapQuoteLoading: boolean;
  unsignedXdr: string;
  swapHash: string;
  swapError: string;
  swapSubmitting: boolean;
  tokenSelectorTarget: "from" | "to" | null;
  setTokenSelectorTarget: (t: "from" | "to" | null) => void;
  slippageModalOpen: boolean;
  setSlippageModalOpen: (b: boolean) => void;
  getBalanceForAsset: (c: string) => AccountBalance | undefined;
  getAssetCode: (c: string) => string;
  formatAsset: (b: AccountBalance) => string;
  getTokenId: (b: AccountBalance) => string;
  tokenPrices: Record<string, { currentPrice: number; percentagePriceChange24h: number | null } | null>;
  balances: AccountBalance[];
  getCanonicalFromBalance: (b: AccountBalance) => string;
  onBack: () => void;
  onSetMax: () => void;
  onFlipAssets: () => void;
  onSelectToken: (c: string) => void;
  onReviewSwap: () => void;
  onConfirmSwap: () => void;
  onSwapCancel: () => void;
  onSwapClose: () => void;
  onSwapDone: () => void;
}

export function SwapPage({
  network,
  swapStep,
  fromAsset,
  toAsset,
  swapAmount,
  setSwapAmount,
  slippagePercent,
  setSlippagePercent,
  swapQuote,
  swapQuoteLoading,
  unsignedXdr,
  swapHash,
  swapError,
  swapSubmitting,
  tokenSelectorTarget,
  setTokenSelectorTarget,
  slippageModalOpen,
  setSlippageModalOpen,
  getBalanceForAsset,
  getAssetCode,
  formatAsset,
  getTokenId,
  tokenPrices,
  balances,
  getCanonicalFromBalance,
  onBack,
  onSetMax,
  onFlipAssets,
  onSelectToken,
  onReviewSwap,
  onConfirmSwap,
  onSwapCancel,
  onSwapClose,
  onSwapDone,
}: SwapPageProps) {
  const fromBal = getBalanceForAsset(fromAsset);
  const toBal = getBalanceForAsset(toAsset);
  const tokenIdFrom = fromBal ? getTokenId(fromBal) : "";
  const priceFrom = tokenIdFrom ? tokenPrices[tokenIdFrom] : null;
  const usdFrom =
    priceFrom?.currentPrice != null
      ? parseFloat(swapAmount) * priceFrom.currentPrice
      : 0;

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
        <h2 style={{ fontSize: 16, margin: 0 }}>Swap</h2>
      </div>

      {swapStep === "input" && (
        <>
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 24,
                fontWeight: 600,
                color: "#e6edf3",
                marginBottom: 4,
              }}
            >
              {swapAmount || "0"} {getAssetCode(fromAsset)}
            </div>
            <div style={{ fontSize: 13, color: "#8b949e", display: "flex", alignItems: "center", gap: 8 }}>
              {INDEXER_URL && fromBal ? `$${usdFrom.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}` : "$0.00"}
            </div>
            <input
              type="text"
              placeholder="0"
              value={swapAmount}
              onChange={(e) => setSwapAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              style={{
                ...sharedStyles.input,
                fontSize: 18,
                marginTop: 8,
                marginBottom: 8,
              }}
            />
            <button onClick={onSetMax} style={{ ...sharedStyles.button(), padding: "6px 12px", fontSize: 12 }}>
              Set Max
            </button>
          </div>

          <div
            style={{
              background: "#0d1117",
              borderRadius: 8,
              border: "1px solid #30363d",
              marginBottom: 8,
              overflow: "hidden",
            }}
          >
            <TokenCard
              balance={fromBal}
              canonical={fromAsset}
              onClick={() => setTokenSelectorTarget("from")}
            />
            <div style={{ display: "flex", justifyContent: "center", padding: 8 }}>
              <button
                onClick={onFlipAssets}
                style={{
                  ...sharedStyles.button(),
                  padding: 8,
                  borderRadius: "50%",
                  minWidth: 40,
                  minHeight: 40,
                }}
                title="Swap direction"
              >
                ⇅
              </button>
            </div>
            <TokenCard
              balance={toBal}
              canonical={toAsset}
              onClick={() => setTokenSelectorTarget("to")}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: "#8b949e" }}>Fee: {BASE_FEE_XLM} XLM</span>
            <button
              onClick={() => setSlippageModalOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "transparent",
                border: "1px solid #30363d",
                borderRadius: 16,
                padding: "4px 12px",
                color: "#8b949e",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Slippage: {slippagePercent}%
              <span style={{ opacity: 0.8 }}>⚙</span>
            </button>
          </div>

          {slippageModalOpen && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 100,
              }}
              onClick={() => setSlippageModalOpen(false)}
            >
              <div
                style={{
                  background: "#161b22",
                  padding: 24,
                  borderRadius: 12,
                  border: "1px solid #30363d",
                  minWidth: 280,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>Slippage tolerance</h3>
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  {[1, 2, 3].map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setSlippagePercent(p);
                        setSlippageModalOpen(false);
                      }}
                      style={{ ...sharedStyles.button(slippagePercent === p), flex: 1 }}
                    >
                      {p}%
                    </button>
                  ))}
                </div>
                <button onClick={() => setSlippageModalOpen(false)} style={sharedStyles.button()}>
                  Close
                </button>
              </div>
            </div>
          )}

          {tokenSelectorTarget && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 100,
              }}
              onClick={() => setTokenSelectorTarget(null)}
            >
              <div
                style={{
                  background: "#161b22",
                  padding: 24,
                  borderRadius: 12,
                  border: "1px solid #30363d",
                  maxWidth: 400,
                  maxHeight: "80vh",
                  overflow: "auto",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>
                  Select {tokenSelectorTarget === "from" ? "from" : "to"} token
                </h3>
                {balances
                  .filter((b) => {
                    const c = getCanonicalFromBalance(b);
                    return c !== (tokenSelectorTarget === "from" ? toAsset : fromAsset);
                  })
                  .map((b) => {
                    const c = getCanonicalFromBalance(b);
                    return (
                      <button
                        key={c}
                        onClick={() => onSelectToken(c)}
                        style={{
                          ...sharedStyles.button(),
                          width: "100%",
                          marginBottom: 8,
                          textAlign: "left",
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: 12,
                        }}
                      >
                        {b.iconUrl ? (
                          <img
                            src={b.iconUrl}
                            alt=""
                            style={{ width: 32, height: 32, borderRadius: "50%" }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : null}
                        <div>
                          <div style={{ fontWeight: 600 }}>{formatAsset(b)}</div>
                          <div style={{ fontSize: 12, color: "#8b949e" }}>Balance: {b.balance}</div>
                        </div>
                      </button>
                    );
                  })}
                <button onClick={() => setTokenSelectorTarget(null)} style={sharedStyles.button()}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          <button
            onClick={onReviewSwap}
            disabled={
              !swapAmount ||
              parseFloat(swapAmount) <= 0 ||
              fromAsset === toAsset ||
              !swapQuote ||
              swapSubmitting ||
              swapQuoteLoading
            }
            style={{ ...sharedStyles.button(true), width: "100%" }}
          >
            {swapSubmitting ? "..." : "Review swap"}
          </button>
        </>
      )}

      {swapStep === "review" && (
        <>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 14, color: "#8b949e", marginBottom: 12 }}>You are swapping</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              {fromBal?.iconUrl && (
                <img src={fromBal.iconUrl} alt="" style={{ width: 32, height: 32, borderRadius: "50%" }} />
              )}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18, fontWeight: 600 }}>
                    {swapAmount} {getAssetCode(fromAsset)}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#8b949e" }}>$0.00</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: "#8b949e", margin: "8px 0" }}>≫</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {toBal?.iconUrl && (
                <img src={toBal.iconUrl} alt="" style={{ width: 32, height: 32, borderRadius: "50%" }} />
              )}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18, fontWeight: 600 }}>
                    {swapQuote?.destAmount ?? "0"} {getAssetCode(toAsset)}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#8b949e" }}>$0.00</div>
              </div>
            </div>
          </div>

          <div
            style={{
              background: "#0d1117",
              borderRadius: 8,
              border: "1px solid #30363d",
              padding: 16,
              marginBottom: 16,
              fontSize: 13,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#8b949e" }}>Memo</span>
              <span>None</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#8b949e" }}>Fee</span>
              <span>{BASE_FEE_XLM} XLM</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#8b949e" }}>XDR</span>
              <span style={{ fontFamily: "monospace", fontSize: 11, wordBreak: "break-all" }}>
                {unsignedXdr.slice(0, 24)}...
              </span>
            </div>
          </div>

          <button
            onClick={onConfirmSwap}
            disabled={swapSubmitting}
            style={{ ...sharedStyles.button(true), width: "100%", marginBottom: 8 }}
          >
            {swapSubmitting ? "..." : `Swap ${getAssetCode(fromAsset)} to ${getAssetCode(toAsset)}`}
          </button>
          <button onClick={onSwapCancel} disabled={swapSubmitting} style={{ ...sharedStyles.button(), width: "100%" }}>
            Cancel
          </button>
        </>
      )}

      {swapStep === "swapping" && (
        <>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div
              style={{
                width: 48,
                height: 48,
                border: "3px solid #30363d",
                borderTopColor: "#238636",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 16px",
              }}
            />
            <h3 style={{ margin: "0 0 16px", fontSize: 18 }}>Swapping</h3>
            <div
              style={{
                background: "#0d1117",
                borderRadius: 8,
                border: "1px solid #30363d",
                padding: 16,
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 8 }}>
                {fromBal?.iconUrl && (
                  <img src={fromBal.iconUrl} alt="" style={{ width: 24, height: 24, borderRadius: "50%" }} />
                )}
                <span>≫</span>
                {toBal?.iconUrl && (
                  <img src={toBal.iconUrl} alt="" style={{ width: 24, height: 24, borderRadius: "50%" }} />
                )}
              </div>
              <div style={{ textAlign: "center" }}>
                {swapAmount} {getAssetCode(fromAsset)}
              </div>
              <div style={{ textAlign: "center", fontSize: 13, color: "#8b949e" }}>to</div>
              <div style={{ textAlign: "center" }}>
                {swapQuote?.destAmount ?? "0"} {getAssetCode(toAsset)}
              </div>
            </div>
            <p style={{ fontSize: 13, color: "#8b949e", marginBottom: 16 }}>
              You can close this screen, your transaction should be complete in less than a minute.
            </p>
            <button onClick={onSwapClose} style={sharedStyles.button()}>
              Close
            </button>
          </div>
        </>
      )}

      {swapStep === "success" && (
        <>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#238636",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 32,
                margin: "0 auto 16px",
              }}
            >
              ✓
            </div>
            <h3 style={{ margin: "0 0 16px", fontSize: 18 }}>Swapped!</h3>
            <div
              style={{
                background: "#0d1117",
                borderRadius: 8,
                border: "1px solid #30363d",
                padding: 16,
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 8 }}>
                {fromBal?.iconUrl && (
                  <img src={fromBal.iconUrl} alt="" style={{ width: 24, height: 24, borderRadius: "50%" }} />
                )}
                <span>≫</span>
                {toBal?.iconUrl && (
                  <img src={toBal.iconUrl} alt="" style={{ width: 24, height: 24, borderRadius: "50%" }} />
                )}
              </div>
              <div style={{ textAlign: "center", fontWeight: 600 }}>
                {swapAmount} {getAssetCode(fromAsset)}
              </div>
              <div style={{ textAlign: "center", fontSize: 13, color: "#8b949e" }}>was swapped to</div>
              <div style={{ textAlign: "center", fontWeight: 600 }}>
                {swapQuote?.destAmount ?? "0"} {getAssetCode(toAsset)}
              </div>
            </div>
            <a
              href={`https://stellar.expert/explorer/${network === "mainnet" ? "public" : "testnet"}/tx/${swapHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                ...sharedStyles.button(),
                display: "block",
                width: "100%",
                marginBottom: 8,
                textDecoration: "none",
                textAlign: "center",
              }}
            >
              View transaction
            </a>
            <button onClick={onSwapDone} style={{ ...sharedStyles.button(true), width: "100%" }}>
              Done
            </button>
          </div>
        </>
      )}

      {swapError && <p style={{ ...sharedStyles.error, marginTop: 12 }}>{swapError}</p>}
    </>
  );
}
