/**
 * Centralized error handling for the Stellar Wallet SDK.
 * All SDK modules should throw these custom errors for consistent, meaningful error propagation.
 */

/** Base class for SDK errors with a code for programmatic handling */
export abstract class SdkError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// --- Wallet & Auth ---

export class InvalidMnemonicError extends SdkError {
  readonly code = "INVALID_MNEMONIC";
  constructor() {
    super("Invalid mnemonic phrase");
  }
}

export class AccountAlreadyImportedError extends SdkError {
  readonly code = "ACCOUNT_ALREADY_IMPORTED";
  constructor() {
    super("Account already imported");
  }
}

export class SecretKeyRequiredError extends SdkError {
  readonly code = "SECRET_KEY_REQUIRED";
  constructor() {
    super("Secret key is required");
  }
}

export class InvalidSecretKeyError extends SdkError {
  readonly code = "INVALID_SECRET_KEY";
  constructor() {
    super("Invalid secret key");
  }
}

export class NoWalletFoundError extends SdkError {
  readonly code = "NO_WALLET_FOUND";
  constructor() {
    super("No wallet found");
  }
}

export class WalletNotUnlockedError extends SdkError {
  readonly code = "WALLET_NOT_UNLOCKED";
  constructor() {
    super("Wallet not unlocked");
  }
}

export class AccountNotFoundError extends SdkError {
  readonly code = "ACCOUNT_NOT_FOUND";
  constructor() {
    super("Account not found");
  }
}

export class CannotAddAccountError extends SdkError {
  readonly code = "CANNOT_ADD_ACCOUNT";
  constructor() {
    super("Cannot add account: no mnemonic stored (imported wallets only)");
  }
}

export class SessionExpiredError extends SdkError {
  readonly code = "SESSION_EXPIRED";
  constructor() {
    super("Session expired or not created");
  }
}

// --- Crypto & Storage ---

export class WebCryptoUnavailableError extends SdkError {
  readonly code = "WEB_CRYPTO_UNAVAILABLE";
  constructor() {
    super("WebCrypto API is not available (crypto.subtle)");
  }
}

export class DecryptionFailedError extends SdkError {
  readonly code = "DECRYPTION_FAILED";
  constructor(detail?: string) {
    super(
      detail
        ? `Decryption failed. Wrong password or corrupted payload. (${detail})`
        : "Decryption failed. Wrong password or corrupted payload."
    );
  }
}

export class LocalStorageUnavailableError extends SdkError {
  readonly code = "LOCAL_STORAGE_UNAVAILABLE";
  constructor() {
    super(
      "localStorage is not available. Stellar Wallet SDK requires a browser environment."
    );
  }
}

export class StorageSaveError extends SdkError {
  readonly code = "STORAGE_SAVE_ERROR";
  constructor(detail?: string) {
    super(detail ? `Failed to save wallet to storage: ${detail}` : "Failed to save wallet to storage");
  }
}

export class StorageLoadError extends SdkError {
  readonly code = "STORAGE_LOAD_ERROR";
  constructor(detail?: string) {
    super(detail ? `Failed to load wallet from storage: ${detail}` : "Failed to load wallet from storage");
  }
}

export class StorageClearError extends SdkError {
  readonly code = "STORAGE_CLEAR_ERROR";
  constructor(detail?: string) {
    super(detail ? `Failed to clear wallet from storage: ${detail}` : "Failed to clear wallet from storage");
  }
}

// --- Network & API ---

export class FriendbotFailedError extends SdkError {
  readonly code = "FRIENDBOT_FAILED";
  constructor(detail: string) {
    super(`Friendbot failed: ${detail}`);
  }
}

export class SorobanRpcNotConfiguredError extends SdkError {
  readonly code = "SOROBAN_RPC_NOT_CONFIGURED";
  constructor(context?: string) {
    super(
      context
        ? `Soroban RPC not configured. ${context}`
        : "Soroban RPC not configured. Set sorobanRpcUrl in wallet config."
    );
  }
}

export class TokenMetadataError extends SdkError {
  readonly code = "TOKEN_METADATA_ERROR";
  constructor(detail?: string) {
    super(detail ?? "Failed to fetch token metadata");
  }
}

export class AssetSearchError extends SdkError {
  readonly code = "ASSET_SEARCH_ERROR";
  constructor(detail: string) {
    super(`Asset search failed: ${detail}`);
  }
}

export class SimulationError extends SdkError {
  readonly code = "SIMULATION_ERROR";
  constructor(detail: string) {
    super(detail);
  }
}

export class InvalidAssetError extends SdkError {
  readonly code = "INVALID_ASSET";
  constructor(canonical: string) {
    super(`Invalid asset canonical id: ${canonical}`);
  }
}

export class TokenPricesError extends SdkError {
  readonly code = "TOKEN_PRICES_ERROR";
  constructor(detail: string) {
    super(`Token prices API error: ${detail}`);
  }
}

export class SwapPathNotFoundError extends SdkError {
  readonly code = "SWAP_PATH_NOT_FOUND";
  constructor() {
    super("No path found for swap.");
  }
}

export class ApiKeyRequiredError extends SdkError {
  readonly code = "API_KEY_REQUIRED";
  constructor() {
    super("API key is required. Get your API key from https://sorobanhooks.xyz");
  }
}

export class NetworkRequiredError extends SdkError {
  readonly code = "NETWORK_REQUIRED";
  constructor() {
    super("Network is required. Use 'TESTNET' or 'PUBLIC'.");
  }
}

/** Horizon transaction submission failure with optional result codes */
export class TransactionFailedError extends SdkError {
  readonly code = "TRANSACTION_FAILED";
  readonly resultCodes?: { transaction: string; operations: string[] };

  constructor(message: string, resultCodes?: { transaction: string; operations: string[] }) {
    super(message);
    this.resultCodes = resultCodes;
  }
}

// --- Result code to user message mapping (reference: freighter-wallet parseTransaction) ---
const RESULT_CODE_MESSAGES: Record<string, string> = {
  tx_failed: "Transaction failed",
  tx_insufficient_fee: "Insufficient fee. Please try using the suggested fee and try again.",
  op_invalid_limit: "Invalid trustline limit",
  op_low_reserve: "Account minimum balance is too low. To create a new account you need to send at least 1 XLM.",
  op_under_dest_min: "Conversion rate changed. Please check the new rate and try again.",
  op_underfunded: "Insufficient balance for this transaction.",
  op_no_destination: "Destination account doesn't exist. Make sure it is a funded Stellar account.",
  op_no_trust: "Destination account does not accept this asset. The destination must opt to accept this asset before receiving it.",
};

export function parseHorizonResultCodes(err: unknown): { transaction: string; operations: string[] } | undefined {
  const errObj = err as { response?: { extras?: { result_codes?: { transaction?: string; operations?: string[] } } } };
  const extras = errObj?.response?.extras;
  const resultCodes = extras?.result_codes;
  if (!resultCodes) return undefined;
  return {
    transaction: resultCodes.transaction ?? "",
    operations: Array.isArray(resultCodes.operations) ? resultCodes.operations : [],
  };
}

function getMessageFromResultCodes(resultCodes: { transaction: string; operations: string[] }): string {
  const opErrors = resultCodes.operations;
  const txError = resultCodes.transaction;
  const firstOp = opErrors[0];
  const code = firstOp || txError;
  return RESULT_CODE_MESSAGES[code] ?? "Transaction failed. One or more operations failed.";
}

/**
 * Extracts a user-friendly display message from any error.
 * Use this in the UI to show SDK errors consistently.
 */
export function getDisplayMessage(err: unknown): string {
  if (err instanceof SdkError) {
    return err.message;
  }
  if (err instanceof Error) {
    const resultCodes = parseHorizonResultCodes(err);
    if (resultCodes) {
      return getMessageFromResultCodes(resultCodes);
    }
    return err.message;
  }
  if (typeof err === "string") {
    return err;
  }
  return "An unexpected error occurred";
}

/**
 * Type guard for SDK error classes.
 */
export function isSdkError(err: unknown): err is SdkError {
  return err instanceof SdkError;
}

/**
 * Creates a TransactionFailedError from a Horizon submitTransaction error.
 * Use when catching Horizon submission failures to throw a meaningful SDK error.
 */
export function createTransactionFailedError(err: unknown): TransactionFailedError {
  const resultCodes = parseHorizonResultCodes(err);
  const message = resultCodes
    ? getMessageFromResultCodes(resultCodes)
    : err instanceof Error
      ? err.message
      : "Transaction failed";
  return new TransactionFailedError(message, resultCodes);
}
