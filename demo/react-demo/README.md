# Stellar Wallet SDK – React Demo

[![npm version](https://img.shields.io/npm/v/stellar-wallet-sdk.svg)](https://www.npmjs.com/package/stellar-wallet-sdk)

A reference implementation demonstrating all features of the Stellar Wallet SDK in a React + Vite application.

### Video Demo

The following video demonstrates how the SDK is used to create an entire application:

<video src="public/React%20Demo.mp4" controls width="600px"></video>

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
- **Token Prices** – USD prices and 24h change (when `VITE_API_KEY` is set)
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

## SDK Usage Examples

The demo showcases how to use the core methods of `stellar-wallet-sdk`.

### 1. Initialization
```typescript
import { StellarWallet } from "stellar-wallet-sdk";

const wallet = new StellarWallet({
  rpcUrl: "https://horizon-testnet.stellar.org",
  networkPassphrase: "Test SDF Network ; September 2015",
  indexerUrl: "https://your-indexer.com/api/v1" // Optional for prices
});
```

### 2. Create or Restore Wallet
```typescript
// Create new
const { publicKey, mnemonic } = await wallet.create("user-password");

// Restore from storage
const accounts = await wallet.restore("user-password");
```

### 3. Build & Sign Transaction
```typescript
const xdr = await wallet.buildPaymentTransaction({
  destination: "G...",
  assetCode: "XLM",
  assetIssuer: "",
  amount: "10"
});

const signedXdr = await wallet.signXDR(xdr);
const result = await wallet.submitXDR(signedXdr);
```

### 4. Session Management
```typescript
// Create a 15-minute session
wallet.createSession(15 * 60 * 1000);

// Sign without needing the user password
const signed = wallet.signWithSession(xdr);
```

## Setup

```bash
npm install
```

### Environment

Copy `.env.example` to `.env` and set the following:

```env
VITE_API_KEY=your-api-key
```

## Run

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Project Structure

- `src/App.tsx` – Main app with view routing and state
- `src/pages/` – Page components (Auth, Account, Swap, Send, etc.)
- `src/hooks/` – `useWallet`, `useBalances`, `useSwap`, `useAssetSearch`
- `src/components/` – Reusable UI (TokenCard, AssetSearchInput, etc.)
- `src/constants/` – Network configs, styles
- `src/utils/` – Asset formatting, Soroban token storage

## Dependencies

- [`stellar-wallet-sdk`](https://www.npmjs.com/package/stellar-wallet-sdk)
- React 18, Vite 5, TypeScript 5
