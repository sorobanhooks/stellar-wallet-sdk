import { useState, useEffect } from "react";
import { StellarWallet, isAccountNotFoundError, getDisplayMessage } from "stellar-wallet-sdk";
import { sharedStyles } from "./constants/styles";
import { NETWORK_CONFIGS } from "./constants/network";
import type { View } from "./types";
import type { Network } from "./constants/network";
import { useWallet } from "./hooks/useWallet";
import { useBalances } from "./hooks/useBalances";
import { useSwap } from "./hooks/useSwap";
import { AuthPage } from "./pages/AuthPage";
import { ImportPage } from "./pages/ImportPage";
import { CreateResultPage } from "./pages/CreateResultPage";
import { AccountListPage } from "./pages/AccountListPage";
import { AccountDetailPage } from "./pages/AccountDetailPage";
import { SwapPage } from "./pages/SwapPage";
import { SignXdrPage } from "./pages/SignXdrPage";
import { ChooseAssetPage } from "./pages/ChooseAssetPage";
import { ConfirmTrustlinePage } from "./pages/ConfirmTrustlinePage";
import { SendPaymentPage } from "./pages/SendPaymentPage";
import { HistoryPage } from "./pages/HistoryPage";
import { SignMessagePage } from "./pages/SignMessagePage";
import { SignAuthEntryPage } from "./pages/SignAuthEntryPage";
import { PathPaymentPage } from "./pages/PathPaymentPage";
import { AddCollectiblePage } from "./pages/AddCollectiblePage";
import { SessionPage } from "./pages/SessionPage";
import { getStoredSorobanTokens, saveSorobanTokens } from "./utils/soroban-tokens-storage";

export default function App() {
  const { wallet, network, setNetwork } = useWallet();
  const [view, setView] = useState<View>("auth");
  const [password, setPassword] = useState("");
  const [mnemonic, setMnemonic] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasStoredWallet, setHasStoredWallet] = useState(false);
  const [createResult, setCreateResult] = useState<{ publicKey: string; mnemonic: string } | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [funding, setFunding] = useState(false);
  const [xdrInput, setXdrInput] = useState("");
  const [signedXdr, setSignedXdr] = useState("");
  const [submitResult, setSubmitResult] = useState<Awaited<ReturnType<StellarWallet["submitXDR"]>> | null>(null);
  const [signXdrLoading, setSignXdrLoading] = useState(false);
  const [selectedAssetForTrustline, setSelectedAssetForTrustline] = useState<{
    assetCode: string;
    assetIssuer: string;
    domain?: string;
    name?: string;
    image?: string;
  } | null>(null);
  const [selectedAssetForRemove, setSelectedAssetForRemove] = useState<{
    assetCode: string;
    assetIssuer: string;
    domain?: string;
    name?: string;
    image?: string;
  } | null>(null);

  const {
    balances,
    tokenPrices,
    balancesLoading,
    accountNotFound,
    status,
    setStatus,
    loadBalances,
  } = useBalances(wallet, selectedAccount, network);

  const swapState = useSwap(wallet, selectedAccount, balances);

  useEffect(() => {
    StellarWallet.hasStoredWallet().then(setHasStoredWallet);
  }, [view]);

  useEffect(() => {
    if (view === "accountDetail" && selectedAccount) {
      loadBalances();
    }
  }, [view, selectedAccount, network, loadBalances]);

  const handleCreate = async () => {
    if (!password.trim()) {
      setStatus("Please enter a password");
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      const result = await wallet.create(password);
      setCreateResult(result);
      setView("createResult");
    } catch (err) {
      setStatus(`Error: ${getDisplayMessage(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImportMnemonic = async () => {
    if (!mnemonic.trim() || !password.trim()) {
      setStatus("Please enter mnemonic and password");
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      await wallet.importFromMnemonic(mnemonic, password);
      setView("accountList");
      setMnemonic("");
    } catch (err) {
      setStatus(`Error: ${getDisplayMessage(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImportSecretKey = async () => {
    if (!secretKey.trim() || !password.trim()) {
      setStatus("Please enter secret key and password");
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      await wallet.importFromSecretKey(secretKey, password);
      setView("accountList");
      setSecretKey("");
    } catch (err) {
      setStatus(`Error: ${getDisplayMessage(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!password.trim()) {
      setStatus("Please enter a password");
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      await wallet.restore(password);
      setView("accountList");
    } catch (err) {
      setStatus(`Error: ${getDisplayMessage(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateResultAck = () => {
    setCreateResult(null);
    setView("accountList");
  };

  const handleAddAccount = async () => {
    if (!password.trim()) {
      setStatus("Please enter your password to add account");
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      await wallet.addAccount(password);
      setStatus("Account added");
    } catch (err) {
      setStatus(`Error: ${getDisplayMessage(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAccount = (publicKey: string) => {
    wallet.selectAccount(publicKey);
    setSelectedAccount(publicKey);
    setView("accountDetail");
  };

  const handleFundAccount = async () => {
    if (!selectedAccount) return;
    setFunding(true);
    setStatus("");
    try {
      await wallet.fundAccount(selectedAccount);
      setStatus("Account funded! Refreshing...");
      await loadBalances();
    } catch (err) {
      setStatus(`Error: ${getDisplayMessage(err)}`);
    } finally {
      setFunding(false);
    }
  };

  const handleSignOnly = async () => {
    const xdr = xdrInput.trim();
    if (!xdr) {
      setStatus("Please enter XDR");
      return;
    }
    setSignXdrLoading(true);
    setStatus("");
    setSignedXdr("");
    setSubmitResult(null);
    try {
      const signed = await wallet.signXDR(xdr);
      setSignedXdr(signed);
      setStatus("Transaction signed. Copy the signed XDR below.");
    } catch (err) {
      setStatus(`Error: ${getDisplayMessage(err)}`);
    } finally {
      setSignXdrLoading(false);
    }
  };

  const handleSignAndSubmit = async () => {
    const xdr = xdrInput.trim();
    if (!xdr) {
      setStatus("Please enter XDR");
      return;
    }
    setSignXdrLoading(true);
    setStatus("");
    setSignedXdr("");
    setSubmitResult(null);
    try {
      const signed = await wallet.signXDR(xdr);
      const result = await wallet.submitXDR(signed);
      setSubmitResult(result);
      setStatus(result.successful ? "Transaction submitted successfully!" : "Transaction failed.");
    } catch (err) {
      setStatus(`Error: ${getDisplayMessage(err)}`);
    } finally {
      setSignXdrLoading(false);
    }
  };

  const handleBackFromSignXdr = () => {
    setView("accountDetail");
    setXdrInput("");
    setSignedXdr("");
    setSubmitResult(null);
    setStatus("");
  };

  const handleBack = () => {
    setView("accountList");
    setSelectedAccount(null);
  };

  const handleLogout = () => {
    wallet.logout();
    setView("auth");
    setPassword("");
    setMnemonic("");
    setCreateResult(null);
    setSelectedAccount(null);
    setStatus("Logged out");
  };

  const handleEnterSwap = () => {
    swapState.handleEnterSwap();
    setView("swap");
  };

  const handleBackFromSwap = () => {
    setView("accountDetail");
    swapState.setTokenSelectorTarget(null);
    swapState.setSlippageModalOpen(false);
  };

  const handleSetMax = () => {
    const bal = swapState.getBalanceForAsset(swapState.fromAsset);
    if (bal) swapState.setSwapAmount(bal.balance);
  };

  const handleFlipAssets = () => {
    swapState.setFromAsset(swapState.toAsset);
    swapState.setToAsset(swapState.fromAsset);
    if (swapState.swapQuote?.destAmount) {
      swapState.setSwapAmount(swapState.swapQuote.destAmount);
    } else {
      swapState.setSwapAmount("");
    }
    swapState.setSwapQuote(null);
  };

  const handleSelectToken = (canonical: string) => {
    if (swapState.tokenSelectorTarget === "from") {
      swapState.setFromAsset(canonical);
      if (canonical === swapState.toAsset) swapState.setToAsset(swapState.fromAsset);
    } else {
      swapState.setToAsset(canonical);
      if (canonical === swapState.fromAsset) swapState.setFromAsset(swapState.toAsset);
    }
    swapState.setTokenSelectorTarget(null);
  };

  const handleReviewSwap = async () => {
    if (!selectedAccount || !swapState.swapAmount || !swapState.swapQuote) return;
    swapState.setSwapError("");
    swapState.setSwapSubmitting(true);
    try {
      const xdr = await wallet.buildSwapTransaction({
        sourceAsset: swapState.fromAsset,
        destAsset: swapState.toAsset,
        amount: swapState.swapAmount,
        slippagePercent: swapState.slippagePercent,
        sourceAccount: selectedAccount,
      });
      swapState.setUnsignedXdr(xdr);
      swapState.setSwapStep("review");
    } catch (err) {
      swapState.setSwapError(getDisplayMessage(err));
    } finally {
      swapState.setSwapSubmitting(false);
    }
  };

  const handleConfirmSwap = async () => {
    if (!swapState.unsignedXdr) return;
    swapState.setSwapError("");
    swapState.setSwapSubmitting(true);
    try {
      const signed = await wallet.signXDR(swapState.unsignedXdr);
      const result = await wallet.submitXDR(signed);
      swapState.setSwapHash(result.hash);
      swapState.setSwapStep("swapping");
      setTimeout(() => swapState.setSwapStep("success"), 500);
    } catch (err) {
      swapState.setSwapError(getDisplayMessage(err));
    } finally {
      swapState.setSwapSubmitting(false);
    }
  };

  const handleSwapCancel = () => {
    swapState.setSwapStep("input");
    swapState.setUnsignedXdr("");
  };

  const handleSwapClose = () => {
    handleBackFromSwap();
    loadBalances();
  };

  const handleSwapDone = () => {
    handleBackFromSwap();
    loadBalances();
  };

  const handleChooseAsset = () => {
    setSelectedAssetForTrustline(null);
    setView("chooseAsset");
  };

  const handleAddAssetForTrustline = (asset: {
    assetCode: string;
    assetIssuer: string;
    domain?: string;
    name?: string;
    image?: string;
  }) => {
    setSelectedAssetForTrustline(asset);
    setView("confirmTrustline");
  };

  const handleBackFromChooseAsset = () => {
    setView("accountDetail");
  };

  const handleBackFromConfirmTrustline = () => {
    setSelectedAssetForTrustline(null);
    setView("chooseAsset");
  };

  const handleTrustlineSuccess = () => {
    setSelectedAssetForTrustline(null);
    setView("accountDetail");
    loadBalances();
  };

  const handleAddSorobanToken = async (asset: {
    assetCode: string;
    assetIssuer: string;
    name?: string;
    contractId?: string;
  }) => {
    const contractId = asset.contractId ?? asset.assetIssuer;
    const metadata = await wallet.addSorobanToken(contractId);
    const token = { contractId, ...metadata };
    const stored = getStoredSorobanTokens(network);
    const updated = [...stored.filter((t) => t.contractId !== contractId), token];
    saveSorobanTokens(network, updated);
    await loadBalances();
  };

  const handleSend = () => setView("sendPayment");
  const handleHistory = () => setView("history");

  const handleRemoveTrustline = (asset: {
    assetCode: string;
    assetIssuer: string;
    domain?: string;
    name?: string;
    image?: string;
  }) => {
    setSelectedAssetForRemove(asset);
    setView("confirmRemoveTrustline");
  };

  const handleBackFromConfirmRemoveTrustline = () => {
    setSelectedAssetForRemove(null);
    setView("accountDetail");
  };

  const handleRemoveTrustlineSuccess = () => {
    setSelectedAssetForRemove(null);
    setView("accountDetail");
    loadBalances();
  };

  const handleSendSuccess = () => {
    setView("accountDetail");
    loadBalances();
  };

  return (
    <div style={sharedStyles.container}>
      <h1 style={{ margin: "0 0 24px", fontSize: 20, fontWeight: 600 }}>Stellar Wallet SDK</h1>

      {view === "auth" && (
        <AuthPage
          network={network}
          setNetwork={setNetwork}
          password={password}
          setPassword={setPassword}
          loading={loading}
          hasStoredWallet={hasStoredWallet}
          onCreate={handleCreate}
          onImport={() => setView("import")}
          onRestore={handleRestore}
        />
      )}

      {view === "import" && (
        <ImportPage
          network={network}
          setNetwork={setNetwork}
          mnemonic={mnemonic}
          setMnemonic={setMnemonic}
          secretKey={secretKey}
          setSecretKey={setSecretKey}
          password={password}
          setPassword={setPassword}
          loading={loading}
          onImportMnemonic={handleImportMnemonic}
          onImportSecretKey={handleImportSecretKey}
          onBack={() => setView("auth")}
        />
      )}

      {view === "createResult" && createResult && (
        <CreateResultPage mnemonic={createResult.mnemonic} onAck={handleCreateResultAck} />
      )}

      {view === "accountList" && (
        <AccountListPage
          wallet={wallet}
          network={network}
          setNetwork={setNetwork}
          password={password}
          setPassword={setPassword}
          loading={loading}
          onSelectAccount={handleSelectAccount}
          onAddAccount={handleAddAccount}
          onLogout={handleLogout}
        />
      )}

      {view === "accountDetail" && selectedAccount && (
        <AccountDetailPage
          selectedAccount={selectedAccount}
          network={network}
          setNetwork={setNetwork}
          balances={balances}
          tokenPrices={tokenPrices}
          balancesLoading={balancesLoading}
          accountNotFound={accountNotFound}
          onBack={handleBack}
          onRefresh={loadBalances}
          onFundAccount={handleFundAccount}
          funding={funding}
          onSwap={handleEnterSwap}
          onSignXdr={() => setView("signXdr")}
          onChooseAsset={handleChooseAsset}
          onSend={handleSend}
          onHistory={handleHistory}
          onRemoveTrustline={handleRemoveTrustline}
          onSignMessage={() => setView("signMessage")}
          onSignAuthEntry={() => setView("signAuthEntry")}
          onPathPayment={() => setView("pathPayment")}
          onAddCollectible={() => setView("addCollectible")}
          onSession={() => setView("session")}
        />
      )}

      {view === "session" && (
        <SessionPage wallet={wallet} onBack={() => setView("accountDetail")} />
      )}

      {view === "sendPayment" && selectedAccount && (
        <SendPaymentPage
          wallet={wallet}
          selectedAccount={selectedAccount}
          network={network}
          balances={balances}
          onBack={() => setView("accountDetail")}
          onSuccess={handleSendSuccess}
        />
      )}

      {view === "history" && selectedAccount && (
        <HistoryPage
          wallet={wallet}
          selectedAccount={selectedAccount}
          network={network}
          onBack={() => setView("accountDetail")}
        />
      )}

      {view === "signMessage" && (
        <SignMessagePage wallet={wallet} onBack={() => setView("accountDetail")} />
      )}

      {view === "signAuthEntry" && (
        <SignAuthEntryPage wallet={wallet} onBack={() => setView("accountDetail")} />
      )}

      {view === "pathPayment" && selectedAccount && (
        <PathPaymentPage
          wallet={wallet}
          selectedAccount={selectedAccount}
          network={network}
          balances={balances}
          onBack={() => setView("accountDetail")}
          onSuccess={() => {
            setView("accountDetail");
            loadBalances();
          }}
        />
      )}

      {view === "addCollectible" && (
        <AddCollectiblePage
          wallet={wallet}
          network={network}
          onBack={() => setView("accountDetail")}
        />
      )}

      {view === "swap" && selectedAccount && (
        <SwapPage
          network={network}
          swapStep={swapState.swapStep}
          fromAsset={swapState.fromAsset}
          toAsset={swapState.toAsset}
          swapAmount={swapState.swapAmount}
          setSwapAmount={swapState.setSwapAmount}
          slippagePercent={swapState.slippagePercent}
          setSlippagePercent={swapState.setSlippagePercent}
          swapQuote={swapState.swapQuote}
          swapQuoteLoading={swapState.swapQuoteLoading}
          unsignedXdr={swapState.unsignedXdr}
          swapHash={swapState.swapHash}
          swapError={swapState.swapError}
          swapSubmitting={swapState.swapSubmitting}
          tokenSelectorTarget={swapState.tokenSelectorTarget}
          setTokenSelectorTarget={swapState.setTokenSelectorTarget}
          slippageModalOpen={swapState.slippageModalOpen}
          setSlippageModalOpen={swapState.setSlippageModalOpen}
          getBalanceForAsset={swapState.getBalanceForAsset}
          getAssetCode={swapState.getAssetCode}
          formatAsset={swapState.formatAsset}
          getTokenId={swapState.getTokenId}
          tokenPrices={tokenPrices}
          balances={balances}
          getCanonicalFromBalance={swapState.getCanonicalFromBalance}
          onBack={handleBackFromSwap}
          onSetMax={handleSetMax}
          onFlipAssets={handleFlipAssets}
          onSelectToken={handleSelectToken}
          onReviewSwap={handleReviewSwap}
          onConfirmSwap={handleConfirmSwap}
          onSwapCancel={handleSwapCancel}
          onSwapClose={handleSwapClose}
          onSwapDone={handleSwapDone}
        />
      )}

      {view === "signXdr" && selectedAccount && (
        <SignXdrPage
          xdrInput={xdrInput}
          setXdrInput={setXdrInput}
          signedXdr={signedXdr}
          submitResult={submitResult}
          loading={signXdrLoading}
          onBack={handleBackFromSignXdr}
          onSignOnly={handleSignOnly}
          onSignAndSubmit={handleSignAndSubmit}
        />
      )}

      {view === "chooseAsset" && selectedAccount && (
        <ChooseAssetPage
          wallet={wallet}
          selectedAccount={selectedAccount}
          network={network}
          onBack={handleBackFromChooseAsset}
          onAddAsset={handleAddAssetForTrustline}
          onAddSorobanToken={handleAddSorobanToken}
        />
      )}

      {view === "confirmTrustline" && selectedAccount && selectedAssetForTrustline && (
        <ConfirmTrustlinePage
          wallet={wallet}
          selectedAccount={selectedAccount}
          network={network}
          asset={selectedAssetForTrustline}
          mode="add"
          onBack={handleBackFromConfirmTrustline}
          onSuccess={handleTrustlineSuccess}
        />
      )}

      {view === "confirmRemoveTrustline" && selectedAccount && selectedAssetForRemove && (
        <ConfirmTrustlinePage
          wallet={wallet}
          selectedAccount={selectedAccount}
          network={network}
          asset={selectedAssetForRemove}
          mode="remove"
          onBack={handleBackFromConfirmRemoveTrustline}
          onSuccess={handleRemoveTrustlineSuccess}
        />
      )}

      {status && (
        <p style={status.startsWith("Error") ? sharedStyles.error : sharedStyles.success}>{status}</p>
      )}
    </div>
  );
}
