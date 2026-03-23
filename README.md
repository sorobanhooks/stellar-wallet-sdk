# Stellar Wallet SDK

Minimal, non-custodial Stellar wallet SDK with encrypted local key storage and session-based signing.

## Features

- **Non-custodial** – Keys never leave the device
- **Encrypted storage** – AES-GCM encryption with PBKDF2 key derivation
- **Mnemonic support** – Create or import wallets from BIP39 mnemonics or secret keys
- **Multi-account** – Multiple accounts, derived or imported
- **Session keys** – Time-limited signing without exposing the main key
- **Transaction signing** – Sign and submit XDR transactions
- **Message signing** – Sign arbitrary messages (SEP-53) and Soroban auth entries (CAP-40)
- **Account balances** – Fetch XLM and token balances via Horizon (with optional metadata)
- **Token prices** – Fetch USD prices for account assets via indexer API (optional)
- **Token swap** – Get quotes, build, and execute path payment swaps via Horizon (Stellar Classic)
- **Asset search** – Search Stellar Expert or add Soroban tokens/collectibles by contract ID
- **Trustlines & payments** – Build payment, path payment, and changeTrust transactions
- **Transaction history** – Fetch account transactions from Horizon
- **Horizon adapter** – Swappable network interface

## Installation

```bash
npm install stellar-wallet-sdk
```

## Usage

```ts
import { StellarWallet } from "stellar-wallet-sdk";

const wallet = new StellarWallet({
  rpcUrl: "https://api.sorobanhooks.xyz/v1/api/testnet/:apiKey",
  networkPassphrase: "Test SDF Network ; September 2015",
  friendbotUrl: "https://friendbot.stellar.org",     // optional, for testnet funding
  indexerUrl: "https://api.sorobanhooks.xyz/v1/api/indexer/:apiKey",      // optional, for token price fetching
  sorobanRpcUrl: "https://api.sorobanhooks.xyz/v1/api/testnet/:apiKey/rpc"  // optional, for addSorobanToken, addCollectible, searchAssets by contract ID
});

// Create new wallet (returns mnemonic - show once!)
const { publicKey, mnemonic } = await wallet.create("strong-password");

// Or import from mnemonic
await wallet.importFromMnemonic("your twelve word mnemonic phrase here...", "strong-password");

// Or import from secret key
await wallet.importFromSecretKey("S...", "strong-password");

// Unlock / restore existing wallet
const publicKeys = await wallet.restore("strong-password");

// Check if wallet exists (e.g. to show Unlock option)
const hasWallet = await StellarWallet.hasStoredWallet();

// List accounts
const accounts = wallet.getAccounts(); // { publicKey, source }[]

// Select active account for signing
wallet.selectAccount(accounts[0].publicKey);

// Add derived account (when wallet was created, not imported)
if (wallet.canAddAccount()) {
  await wallet.addAccount("strong-password");
}

// Get address of selected account
console.log(wallet.getAddress());

// Get balances
const balances = await wallet.getAccountBalances(publicKey);
const balancesWithMeta = await wallet.getAccountBalancesWithMetadata(publicKey);

// Get token prices (requires indexerUrl in config)
const tokenPrices = await wallet.getTokenPrices(balancesWithMeta);
// Returns Record<tokenId, { currentPrice: number; percentagePriceChange24h: number | null } | null>

// Fund account (testnet via Friendbot)
await wallet.fundAccount(publicKey);

// Sign transaction
const signed = await wallet.signXDR(unsignedXdr);

// Submit transaction
await wallet.submitXDR(signed);

// Sign message (SEP-53 style, Freighter-compatible)
const signature = wallet.signMessage("Hello, Stellar!");

// Sign Soroban auth entry (CAP-40)
const authSignature = wallet.signAuthEntry(authEntryXdr);

// Search assets (Stellar Expert or by Soroban contract ID)
const assets = await wallet.searchAssets("USDC");

// Build and submit trustline
const trustlineXdr = await wallet.buildTrustlineTransaction("USDC", issuer);
// Or create trustline in one call:
await wallet.createTrustline("USDC", issuer);

// Build payment transaction
const paymentXdr = await wallet.buildPaymentTransaction({
  destination: "G...",
  assetCode: "XLM",
  assetIssuer: "",
  amount: "10",
  memo: "optional",
});

// Build path payment transaction
const pathXdr = await wallet.buildPathPaymentTransaction({
  sourceAsset: "native",
  destAsset: "USDC:GA5Z...",
  sendAmount: "10",
  destination: "G...",
  path: [],
});

// Add Soroban token (requires sorobanRpcUrl)
const metadata = await wallet.addSorobanToken(contractId);

// Add collectible / NFT (requires sorobanRpcUrl)
const nftMetadata = await wallet.addCollectible(contractId, tokenId);

// Get transaction history
const { records } = await wallet.getAccountTransactions(publicKey, { limit: 20 });

// Create session (15 min) – sign without keeping main key in memory
wallet.createSession(15 * 60 * 1000);
const signedSession = wallet.signWithSession(unsignedXdr);

// Swap (Stellar Classic path payments)
const quote = await wallet.getSwapQuote({
  sourceAsset: "native",
  destAsset: "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
  amount: "10",
  mode: "strictSend",  // or "strictReceive"
});
// quote: { sourceAmount, destAmount, path, sourceAsset, destAsset } | null

const unsignedSwapXdr = await wallet.buildSwapTransaction({
  sourceAsset: "native",
  destAsset: "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
  amount: "10",
  slippagePercent: 1,
  memo: "swap",
});

const { quote, signedXdr, hash } = await wallet.swap({
  sourceAsset: "native",
  destAsset: "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
  amount: "10",
  slippagePercent: 1,
  submit: true,
});

// Change network config
wallet.setNetworkConfig({
  rpcUrl: "",
  networkPassphrase: "Public Global Stellar Network ; September 2015"
});

// Logout
wallet.logout();
```

## API

### StellarWallet

| Method | Description |
|--------|-------------|
| `create(password)` | Create new wallet with mnemonic. Returns `{ publicKey, mnemonic }`. |
| `importFromMnemonic(mnemonic, password)` | Import wallet from BIP39 mnemonic. |
| `importFromSecretKey(secretKey, password)` | Import wallet from secret key. |
| `restore(password)` | Unlock existing wallet. Returns array of public keys. |
| `getAccounts()` | List accounts with `{ publicKey, source }`. |
| `selectAccount(publicKey)` | Set active account for signing. |
| `canAddAccount()` | True if mnemonic is stored (created wallets only). |
| `addAccount(password)` | Add derived account from mnemonic. |
| `getAddress()` | Get selected account's public key. |
| `signXDR(xdr)` | Sign transaction XDR. |
| `submitXDR(xdr)` | Submit signed XDR to Horizon. |
| `signMessage(message)` | Sign message (SEP-53 style). Returns base64 signature. |
| `signAuthEntry(authEntryXdr)` | Sign Soroban auth entry (CAP-40). Returns base64 signature. |
| `getAccountBalances(publicKey)` | Get balances for an account. |
| `getAccountBalancesWithMetadata(publicKey)` | Get balances with asset metadata (icon, name, decimals). |
| `getTokenPrices(balances)` | Fetch USD prices for assets. Returns `{}` if `indexerUrl` not configured. |
| `getSwapQuote(params)` | Get swap quote (path and amounts). Returns `SwapQuote` or `null`. |
| `buildSwapTransaction(params)` | Build unsigned swap XDR. Fetches quote, applies slippage. Supports `sourceAccount`, `destination`, `slippagePercent`, `memo`, etc. |
| `swap(params)` | Full swap: quote → build → sign → optionally submit. Returns `{ quote, signedXdr, hash? }`. |
| `searchAssets(search, options?)` | Search assets via Stellar Expert or by Soroban contract ID. Supports `AbortSignal`. |
| `buildTrustlineTransaction(assetCode, assetIssuer, limit?)` | Build unsigned changeTrust XDR. Use `limit: "0"` to remove. |
| `createTrustline(assetCode, assetIssuer, limit?)` | Build, sign, and submit changeTrust. |
| `buildPaymentTransaction(params)` | Build unsigned payment XDR. |
| `buildPathPaymentTransaction(params)` | Build unsigned path payment XDR. |
| `addSorobanToken(contractId)` | Fetch Soroban token metadata. Requires `sorobanRpcUrl`. |
| `addCollectible(contractId, tokenId)` | Fetch collectible/NFT metadata. Requires `sorobanRpcUrl`. |
| `getAccountTransactions(publicKey, options?)` | Get transaction history. Supports `limit`, `cursor`, `order`. |
| `fundAccount(publicKey)` | Fund account via Friendbot (testnet). |
| `createSession(durationMs)` | Create time-limited session key. |
| `signWithSession(xdr)` | Sign using session key. |
| `setNetworkConfig(config)` | Update RPC URL and network passphrase. |
| `logout()` | Clear in-memory state. |
| `static hasStoredWallet()` | Check if a wallet exists in storage. |

**Exported helpers:** `isContractId(str)` – returns true if string is a valid Stellar contract ID (C-prefixed strkey).

### WalletConfig

```ts
{
  rpcUrl: string;
  networkPassphrase: string;
  friendbotUrl?: string;   // optional, for testnet funding
  indexerUrl?: string;     // optional, base URL for token-prices API (e.g. https://api.example.com/api/v1)
  sorobanRpcUrl?: string;  // optional, required for addSorobanToken, addCollectible, and searchAssets by contract ID
}
```

### Swap Types

```ts
// Asset format: "native" for XLM, "CODE:ISSUER" for tokens
type GetSwapQuoteParams = {
  sourceAsset: string;
  destAsset: string;
  amount: string;
  mode: "strictSend" | "strictReceive";  // fixed send amount vs fixed receive amount
};

type SwapQuote = {
  sourceAmount: string;
  destAmount: string;
  path: string[];
  sourceAsset: string;
  destAsset: string;
};
```

**Exported helpers:** `isContractId`, `getSwapQuote`, `buildSwapTransaction`, `computeDestMinWithSlippage`, `getAssetFromCanonical`, `getCanonicalFromAsset`, `cleanAmount`

