# Stellar Wallet Browser Extension Demo

[![npm version](https://img.shields.io/npm/v/stellar-wallet-sdk.svg)](https://www.npmjs.com/package/stellar-wallet-sdk)

A demonstration of building a browser extension wallet using the **Stellar Wallet SDK**.

## Features

### Authentication & Wallet Setup

- **Create Wallet** – Generate a new wallet with BIP39 mnemonic (shown once for backup)
- **Import from Mnemonic** – Restore a wallet from a 12/24-word mnemonic phrase
- **Import from Secret Key** – Import an existing account using its secret key
- **Unlock (Restore)** – Unlock an existing stored wallet with password
- **Logout** – Clear in-memory wallet state

### Account Management

- **Multi-Account** – Support for multiple accounts per wallet
- **Add Derived Account** – Create new accounts from mnemonic (created wallets only)
- **Add Imported Account** – Import additional accounts via mnemonic or secret key
- **Account Switching** – Select active account for signing and operations
- **Network Switching** – Toggle between Testnet and Mainnet

### Balances & Assets

- **Balance Display** – View XLM, classic assets, and Soroban token balances
- **Token Metadata** – Asset icons, names, and decimals from Horizon and Soroban
- **Token Prices** – USD prices and 24h change (when `VITE_INDEXER_URL` is set)
- **Add Classic Asset** – Search and add trustlines for Stellar Classic assets
- **Add Soroban Token** – Add Soroban tokens by contract ID
- **Add Collectible** – Add NFTs by contract ID and token ID
- **Remove Trustline** – Remove classic asset trustlines

### Payments & Swaps

- **Send Payment** – Send XLM or tokens to any address
- **Path Payment** – Send via path payment (e.g. XLM → USDC)
- **Swap** – Get quotes, set slippage, review, and execute path payment swaps
- **Fund Account** – Fund testnet accounts via Friendbot

### Signing

- **Sign & Submit XDR** – Sign raw transactions (sign only or sign + submit)
- **Sign Message** – Sign arbitrary messages (SEP-53 style, Freighter-compatible)
- **Sign Auth Entry** – Sign Soroban auth entries (CAP-40) for smart contract authorization

### History

- **Transaction History** – View past transactions for the selected account

## Setup & Usage

1. **Install**: `npm install`
2. **Build**: `npm run build`
3. **Load**: Open `chrome://extensions/`, enable Developer Mode, and **Load unpacked** from the `dist` folder.

## SDK Usage Examples

The extension uses the SDK to manage keys and sign transactions within a popup.

### 1. Initialization
```typescript
import { StellarWallet } from "stellar-wallet-sdk";

const wallet = new StellarWallet({
  rpcUrl: "https://horizon-testnet.stellar.org",
  networkPassphrase: "Test SDF Network ; September 2015"
});
```

### 2. Multi-Account Management
```typescript
// Get all accounts in the vault
const accounts = wallet.getAccounts();

// Select an account for operations
wallet.selectAccount(accounts[0].publicKey);
```

### 3. Transaction Building (Swaps)
```typescript
const xdr = await wallet.buildSwapTransaction({
  sourceAsset: "XLM",
  destAsset: "USDC:G...",
  amount: "100",
  slippagePercent: 1
});
```

### 4. Soroban Support
```typescript
// Fetch metadata for a Soroban Token
const metadata = await wallet.addSorobanToken("C...");

// Sign a Soroban Auth Entry (CAP-40)
const signature = wallet.signAuthEntry(authEntryXdr);
```

## Project Structure

- `public/manifest.json`: Extension configuration (v3).
- `src/constants/styles.ts`: Optimized for 400x600px popup dimensions.
- `dist/`: Build output ready for browser loading.

## Dependencies

- [`stellar-wallet-sdk`](https://www.npmjs.com/package/stellar-wallet-sdk)
- React 18, Vite 5, TypeScript 5
