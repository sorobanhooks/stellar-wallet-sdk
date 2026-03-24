import {
  Keypair,
  TransactionBuilder,
  FeeBumpTransaction,
  Transaction,
  Asset,
  Operation,
  Memo,
  hash,
  BASE_FEE,
  StrKey,
} from "@stellar/stellar-sdk";

import { CryptoEngine } from "./crypto";
import { WalletStorage, type WalletVault } from "./storage";
import { SessionManager } from "./session";
import { HorizonAdapter } from "../network/horizon";
import { generateMnemonic, validateMnemonic, keypairFromMnemonic } from "./mnemonic";
import {
  getTokenPrices as fetchTokenPrices,
  balancesToTokenIds,
  type TokenPriceData,
} from "../network/token-prices";
import type { AccountBalance } from "../network/horizon";
import {
  getSwapQuote as fetchSwapQuote,
  buildSwapTransaction as buildSwapTx,
  computeDestMinWithSlippage,
  type SwapQuote,
  type GetSwapQuoteParams,
  type BuildSwapTransactionParams,
} from "../network/swap";
import { Buffer } from "buffer";
import { getAssetFromCanonical, cleanAmount } from "../network/assets";
import {
  getSorobanTokenMetadata,
  type SorobanTokenMetadata,
} from "../network/soroban-tokens";
import {
  getCollectibleMetadata,
  type CollectibleMetadata,
} from "../network/soroban-collectibles";
import {
  InvalidMnemonicError,
  ApiKeyRequiredError,
  NetworkRequiredError,
  AccountAlreadyImportedError,
  SecretKeyRequiredError,
  InvalidSecretKeyError,
  NoWalletFoundError,
  WalletNotUnlockedError,
  AccountNotFoundError,
  CannotAddAccountError,
  SessionExpiredError,
  SorobanRpcNotConfiguredError,
  TokenMetadataError,
  AssetSearchError,
  SwapPathNotFoundError,
} from "../errors";

import type { NetworkType } from "../types";

export interface WalletConfig {
  rpcUrl: string;
  networkPassphrase: string;
  friendbotUrl?: string;
  /** Base URL for token-prices API (e.g. https://api.example.com/api/v1). When omitted, getTokenPrices returns empty. */
  indexerUrl?: string;
  /** Soroban RPC URL (e.g. https://soroban-testnet.stellar.org). Required for addSorobanToken and addCollectible. */
  sorobanRpcUrl?: string;
}

export interface WalletInitConfig {
  network: NetworkType;
  apiKey: string;
}

export interface SearchAssetResult {
  assetCode: string;
  assetIssuer: string;
  domain?: string;
  name?: string;
  image?: string;
  /** Present when this is a Soroban token (assetIssuer is the contract ID). */
  contractId?: string;
}

/**
 * Returns true if the string is a valid Stellar contract ID (C-prefixed strkey).
 */
export function isContractId(str: string): boolean {
  try {
    StrKey.decodeContract(str);
    return true;
  } catch {
    return false;
  }
}

interface StellarExpertAssetRecord {
  asset: string;
  domain?: string;
  tomlInfo?: { code?: string; issuer?: string; name?: string; image?: string };
}

function parseStellarExpertRecord(
  r: StellarExpertAssetRecord
): SearchAssetResult | null {
  const parts = r.asset.split("-");
  if (parts.length < 3) return null;
  const issuer = parts[parts.length - 2];
  const code = parts.slice(0, -2).join("-");
  if (!code || !issuer || !issuer.startsWith("G")) return null;
  const toml = r.tomlInfo;
  return {
    assetCode: toml?.code ?? code,
    assetIssuer: toml?.issuer ?? issuer,
    domain: r.domain,
    name: toml?.name,
    image: toml?.image,
  };
}

export interface CreateResult {
  publicKey: string;
  mnemonic: string;
}

export interface WalletAccount {
  publicKey: string;
  source: "created" | "imported";
}

export class StellarWallet {
  private keypairs: Map<string, Keypair> = new Map();
  private vault: WalletVault | null = null;
  private selectedPublicKey: string | null = null;
  private sessionManager = new SessionManager();
  private horizon: HorizonAdapter;
  private networkPassphrase: string;
  private config: WalletConfig;

  private static buildWalletConfig({ network, apiKey }: WalletInitConfig): WalletConfig {
    if (!apiKey?.trim()) {
      throw new ApiKeyRequiredError();
    }
    if (!network) {
      throw new NetworkRequiredError();
    }

    return {
      rpcUrl: `https://api.sorobanhooks.xyz/v1/api/${network}/${apiKey}`,
      networkPassphrase:
        network === "testnet"
          ? "Test SDF Network ; September 2015"
          : "Public Global Stellar Network ; September 2015",
      friendbotUrl:
        network === "testnet" ? "https://friendbot.stellar.org" : undefined,
      indexerUrl: `https://api.sorobanhooks.xyz/v1/api/indexer/${apiKey}`,
      sorobanRpcUrl: `https://api.sorobanhooks.xyz/v1/api/${network}/${apiKey}/rpc`,
    };
  }

  constructor(initConfig: WalletInitConfig) {
    const config = StellarWallet.buildWalletConfig(initConfig);
    this.config = config;
    this.horizon = new HorizonAdapter({
      rpcUrl: config.rpcUrl,
      networkPassphrase: config.networkPassphrase,
      friendbotUrl: config.friendbotUrl,
    });
    this.networkPassphrase = config.networkPassphrase;
  }

  setNetworkConfig(initConfig: WalletInitConfig): void {
    const config = StellarWallet.buildWalletConfig(initConfig);
    this.config = config;
    this.horizon = new HorizonAdapter(config);
    this.networkPassphrase = config.networkPassphrase;
  }

  /* -------------------------
     WALLET CREATION & IMPORT
  ------------------------- */

  async create(password: string): Promise<CreateResult> {
    const mnemonic = generateMnemonic(256);
    const keypair = keypairFromMnemonic(mnemonic, 0);

    const encryptedSecret = await CryptoEngine.encryptPrivateKey(
      keypair.secret(),
      password
    );
    const encryptedMnemonic = await CryptoEngine.encryptMnemonic(
      mnemonic,
      password
    );

    const vault: WalletVault = {
      version: 1,
      encryptedMnemonic,
      accounts: [
        {
          publicKey: keypair.publicKey(),
          encryptedSecret,
          source: "created",
          derivationIndex: 0,
          createdAt: Date.now(),
        },
      ],
    };

    await WalletStorage.saveVault(vault, password);

    this.vault = vault;
    this.keypairs.set(keypair.publicKey(), keypair);
    this.selectedPublicKey = keypair.publicKey();

    return { publicKey: keypair.publicKey(), mnemonic };
  }

  async importFromMnemonic(mnemonic: string, password: string): Promise<string> {
    const normalized = mnemonic.trim().toLowerCase().replace(/\s+/g, " ");
    if (!validateMnemonic(normalized)) {
      throw new InvalidMnemonicError();
    }

    const keypair = keypairFromMnemonic(normalized, 0);
    const encryptedSecret = await CryptoEngine.encryptPrivateKey(
      keypair.secret(),
      password
    );

    const existingVault = await WalletStorage.loadVault(password);
    let vault: WalletVault;

    if (existingVault) {
      const exists = existingVault.accounts.some(
        (a) => a.publicKey === keypair.publicKey()
      );
      if (exists) {
        throw new AccountAlreadyImportedError();
      }
      vault = {
        ...existingVault,
        accounts: [
          ...existingVault.accounts,
          {
            publicKey: keypair.publicKey(),
            encryptedSecret,
            source: "imported",
            derivationIndex: 0,
            createdAt: Date.now(),
          },
        ],
      };
    } else {
      vault = {
        version: 1,
        accounts: [
          {
            publicKey: keypair.publicKey(),
            encryptedSecret,
            source: "imported",
            derivationIndex: 0,
            createdAt: Date.now(),
          },
        ],
      };
    }

    await WalletStorage.saveVault(vault, password);

    this.vault = vault;
    this.keypairs.set(keypair.publicKey(), keypair);
    this.selectedPublicKey = keypair.publicKey();

    return keypair.publicKey();
  }

  async importFromSecretKey(secretKey: string, password: string): Promise<string> {
    const trimmed = secretKey.trim();
    if (!trimmed) {
      throw new SecretKeyRequiredError();
    }

    let keypair: Keypair;
    try {
      keypair = Keypair.fromSecret(trimmed);
    } catch {
      throw new InvalidSecretKeyError();
    }

    const encryptedSecret = await CryptoEngine.encryptPrivateKey(
      keypair.secret(),
      password
    );

    const existingVault = await WalletStorage.loadVault(password);
    let vault: WalletVault;

    if (existingVault) {
      const exists = existingVault.accounts.some(
        (a) => a.publicKey === keypair.publicKey()
      );
      if (exists) {
        throw new AccountAlreadyImportedError();
      }
      vault = {
        ...existingVault,
        accounts: [
          ...existingVault.accounts,
          {
            publicKey: keypair.publicKey(),
            encryptedSecret,
            source: "imported",
            derivationIndex: 0,
            createdAt: Date.now(),
          },
        ],
      };
    } else {
      vault = {
        version: 1,
        accounts: [
          {
            publicKey: keypair.publicKey(),
            encryptedSecret,
            source: "imported",
            derivationIndex: 0,
            createdAt: Date.now(),
          },
        ],
      };
    }

    await WalletStorage.saveVault(vault, password);

    this.vault = vault;
    this.keypairs.set(keypair.publicKey(), keypair);
    this.selectedPublicKey = keypair.publicKey();

    return keypair.publicKey();
  }

  async restore(password: string): Promise<string[]> {
    const vault = await WalletStorage.loadVault(password);
    if (!vault || vault.accounts.length === 0) {
      throw new NoWalletFoundError();
    }

    const keypairs = new Map<string, Keypair>();
    for (const acc of vault.accounts) {
      const secret = await CryptoEngine.decryptPrivateKey(
        acc.encryptedSecret,
        password
      );
      keypairs.set(acc.publicKey, Keypair.fromSecret(secret));
    }

    this.vault = vault;
    this.keypairs = keypairs;
    this.selectedPublicKey = vault.accounts[0].publicKey;

    return vault.accounts.map((a) => a.publicKey);
  }

  getAccounts(): WalletAccount[] {
    if (!this.vault) throw new WalletNotUnlockedError();
    return this.vault.accounts.map((a) => ({
      publicKey: a.publicKey,
      source: a.source,
    }));
  }

  selectAccount(publicKey: string): void {
    if (!this.keypairs.has(publicKey)) {
      throw new AccountNotFoundError();
    }
    this.selectedPublicKey = publicKey;
  }

  canAddAccount(): boolean {
    return !!(this.vault?.encryptedMnemonic);
  }

  async addAccount(password: string): Promise<string> {
    if (!this.vault?.encryptedMnemonic) {
      throw new CannotAddAccountError();
    }

    const mnemonic = await CryptoEngine.decryptMnemonic(
      this.vault.encryptedMnemonic,
      password
    );

    const maxIndex = Math.max(
      ...this.vault.accounts
        .filter((a) => a.source === "created" && a.derivationIndex !== undefined)
        .map((a) => a.derivationIndex ?? 0),
      -1
    );
    const nextIndex = maxIndex + 1;

    const keypair = keypairFromMnemonic(mnemonic, nextIndex);
    const encryptedSecret = await CryptoEngine.encryptPrivateKey(
      keypair.secret(),
      password
    );

    const newVault: WalletVault = {
      ...this.vault,
      accounts: [
        ...this.vault.accounts,
        {
          publicKey: keypair.publicKey(),
          encryptedSecret,
          source: "created",
          derivationIndex: nextIndex,
          createdAt: Date.now(),
        },
      ],
    };

    await WalletStorage.saveVault(newVault, password);

    this.vault = newVault;
    this.keypairs.set(keypair.publicKey(), keypair);
    this.selectedPublicKey = keypair.publicKey();

    return keypair.publicKey();
  }

  getAddress(): string {
    if (!this.selectedPublicKey) throw new WalletNotUnlockedError();
    return this.selectedPublicKey;
  }

  static async hasStoredWallet(): Promise<boolean> {
    return WalletStorage.hasVault();
  }

  /* -------------------------
     SIGNING
  ------------------------- */

  async signXDR(xdr: string): Promise<string> {
    const keypair = this.selectedPublicKey
      ? this.keypairs.get(this.selectedPublicKey)
      : null;
    if (!keypair) throw new WalletNotUnlockedError();

    const tx = TransactionBuilder.fromXDR(
      xdr,
      this.networkPassphrase
    ) as Transaction | FeeBumpTransaction;

    tx.sign(keypair);

    return tx.toXDR();
  }

  async submitXDR(xdr: string) {
    return this.horizon.submitXDR(xdr);
  }

  /**
   * Sign a message with SEP-53 style prefix ("Stellar Signed Message:\n").
   * Returns base64-encoded signature (Freighter-compatible).
   */
  signMessage(message: string): string {
    const keypair = this.selectedPublicKey
      ? this.keypairs.get(this.selectedPublicKey)
      : null;
    if (!keypair) throw new WalletNotUnlockedError();

    const SIGN_MESSAGE_PREFIX = "Stellar Signed Message:\n";
    const prefixBytes = Buffer.from(SIGN_MESSAGE_PREFIX, "utf8");
    const messageBytes = Buffer.from(message, "utf8");
    const encodedMessage = Buffer.concat([prefixBytes, messageBytes]);
    const hashed = hash(encodedMessage);
    const signature = keypair.sign(hashed);
    return signature.toString("base64");
  }

  /**
   * Sign a Soroban auth entry (CAP-40) for smart contract authorization.
   * @param authEntryXdr - Base64-encoded HashIdPreimageSorobanAuthorization XDR
   * @returns Base64-encoded signature
   */
  signAuthEntry(authEntryXdr: string): string {
    const keypair = this.selectedPublicKey
      ? this.keypairs.get(this.selectedPublicKey)
      : null;
    if (!keypair) throw new WalletNotUnlockedError();

    const hashed = hash(Buffer.from(authEntryXdr, "base64"));
    const signature = keypair.sign(hashed);
    return signature.toString("base64");
  }

  /* -------------------------
     SESSION KEYS
  ------------------------- */

  createSession(durationMs: number) {
    return this.sessionManager.createSession(durationMs);
  }

  signWithSession(xdr: string): string {
    const session = this.sessionManager.getSession();
    if (!session) throw new SessionExpiredError();

    const tx = TransactionBuilder.fromXDR(
      xdr,
      this.networkPassphrase
    ) as Transaction | FeeBumpTransaction;

    tx.sign(session.keypair);

    return tx.toXDR();
  }

  logout(): void {
    this.vault = null;
    this.keypairs.clear();
    this.selectedPublicKey = null;
    this.sessionManager.clearSession();
  }

  /* -------------------------
     BALANCES
  ------------------------- */

  async getAccountBalances(publicKey: string) {
    return this.horizon.getAccountBalances(publicKey);
  }

  async getAccountBalancesWithMetadata(publicKey: string) {
    return this.horizon.getAccountBalancesWithMetadata(publicKey);
  }

  async fundAccount(publicKey: string): Promise<void> {
    return this.horizon.fundAccount(publicKey);
  }

  /**
   * Fetch token prices for the given balances from the indexer API.
   * Returns empty object if indexerUrl is not configured.
   */
  async getTokenPrices(
    balances: AccountBalance[]
  ): Promise<Record<string, TokenPriceData | null>> {
    if (!this.config.indexerUrl) return {};
    const tokenIds = balancesToTokenIds(balances);
    return fetchTokenPrices(this.config.indexerUrl, tokenIds);
  }

  /* -------------------------
     SWAP
  ------------------------- */

  /**
   * Get swap quote (path and amounts) without building a transaction.
   * Uses Stellar Classic path payments via Horizon.
   */
  async getSwapQuote(params: GetSwapQuoteParams): Promise<SwapQuote | null> {
    const server = this.horizon.getServer();
    return fetchSwapQuote(server, params);
  }

  /**
   * Build unsigned swap transaction XDR.
   * Fetches quote, applies slippage, and builds pathPaymentStrictSend.
   */
  async buildSwapTransaction(params: {
    sourceAsset: string;
    destAsset: string;
    amount: string;
    sourceAccount?: string;
    destination?: string;
    slippagePercent?: number;
    mode?: "strictSend" | "strictReceive";
    fee?: string;
    memo?: string;
    timeoutSeconds?: number;
  }): Promise<string> {
    const {
      sourceAsset,
      destAsset,
      amount,
      sourceAccount,
      destination,
      slippagePercent = 1,
      mode = "strictSend",
      fee,
      memo,
      timeoutSeconds,
    } = params;

    const account = sourceAccount ?? this.getAddress();
    const server = this.horizon.getServer();

    const quote = await fetchSwapQuote(server, {
      sourceAsset,
      destAsset,
      amount,
      mode,
    });

    if (!quote) {
      throw new SwapPathNotFoundError();
    }

    const destMinAmount = computeDestMinWithSlippage(
      quote.destAmount,
      slippagePercent
    );

    const buildParams: BuildSwapTransactionParams = {
      sourceAsset,
      destAsset,
      sourceAmount: quote.sourceAmount,
      destMinAmount,
      path: quote.path,
      sourceAccount: account,
      destination,
      fee,
      memo,
      timeoutSeconds,
    };

    const tx = await buildSwapTx(
      server,
      buildParams,
      this.networkPassphrase
    );
    return tx.toXDR();
  }

  /* -------------------------
     ASSET SEARCH & TRUSTLINE
  ------------------------- */

  /**
   * Search for assets via Stellar Expert API, or Soroban RPC when input is a contract ID.
   * Supports optional AbortSignal for request cancellation.
   */
  async searchAssets(
    search: string,
    options?: { signal?: AbortSignal }
  ): Promise<SearchAssetResult[]> {
    const trimmed = search.trim();
    if (!trimmed) return [];

    if (isContractId(trimmed)) {
      const rpcUrl = this.config.sorobanRpcUrl;
      if (!rpcUrl) {
        throw new SorobanRpcNotConfiguredError(
          "Set sorobanRpcUrl in wallet config to search by contract ID."
        );
      }
      const publicKey = this.getAddress();
      try {
        const metadata = await getSorobanTokenMetadata(
          trimmed,
          publicKey,
          rpcUrl,
          this.networkPassphrase
        );
        return [
          {
            assetCode: metadata.symbol,
            assetIssuer: trimmed,
            contractId: trimmed,
            name: metadata.name ?? metadata.symbol,
          },
        ];
      } catch (err) {
        throw new TokenMetadataError(
          err instanceof Error ? err.message : undefined
        );
      }
    }

    const network =
      this.networkPassphrase.includes("Test SDF") ? "testnet" : "mainnet";
    const baseUrl =
      network === "testnet"
        ? "https://api.stellar.expert/explorer/testnet"
        : "https://api.stellar.expert/explorer/public";
    const url = `${baseUrl}/asset?search=${encodeURIComponent(trimmed)}`;

    const res = await fetch(url, { signal: options?.signal });
    if (!res.ok) {
      throw new AssetSearchError(`${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as {
      _embedded?: { records?: StellarExpertAssetRecord[] };
    };
    const rawRecords = data._embedded?.records ?? [];
    return rawRecords
      .map((r) => parseStellarExpertRecord(r))
      .filter((r): r is SearchAssetResult => r !== null);
  }

  /**
   * Build unsigned changeTrust transaction XDR.
   * @param limit - Max trustline limit. Default "922337203685.4775807" for add. Use "0" to remove.
   */
  async buildTrustlineTransaction(
    assetCode: string,
    assetIssuer: string,
    limit?: string
  ): Promise<string> {
    const account = this.getAddress();
    const server = this.horizon.getServer();
    const sourceAccount = await server.loadAccount(account);

    const asset = new Asset(assetCode, assetIssuer);
    const changeParams = limit !== undefined ? { limit } : {};

    const tx = new TransactionBuilder(sourceAccount, {
      fee: "100",
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(Operation.changeTrust({ asset, ...changeParams }))
      .setTimeout(180)
      .build();

    return tx.toXDR();
  }

  /**
   * Build unsigned payment transaction XDR.
   * Supports native XLM and classic assets.
   */
  async buildPaymentTransaction(params: {
    destination: string;
    assetCode: string;
    assetIssuer: string;
    amount: string;
    memo?: string;
    fee?: string;
    timeoutSeconds?: number;
  }): Promise<string> {
    const {
      destination,
      assetCode,
      assetIssuer,
      amount,
      memo,
      fee,
      timeoutSeconds = 180,
    } = params;

    const account = this.getAddress();
    const server = this.horizon.getServer();
    const sourceAccount = await server.loadAccount(account);

    const isNative =
      (assetCode === "XLM" || assetCode === "native") && !assetIssuer;
    const asset = isNative ? Asset.native() : new Asset(assetCode, assetIssuer);
    const cleanedAmount = cleanAmount(amount);

    const feeStroops = fee
      ? Math.round(parseFloat(fee) * 1e7).toString()
      : BASE_FEE;

    const txBuilder = new TransactionBuilder(sourceAccount, {
      fee: feeStroops,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(Operation.payment({ destination, asset, amount: cleanedAmount }))
      .setTimeout(timeoutSeconds);

    if (memo) {
      txBuilder.addMemo(Memo.text(memo));
    }

    return txBuilder.build().toXDR();
  }

  /**
   * Build unsigned path payment transaction XDR.
   * Uses pathPaymentStrictSend. For path discovery, use getSwapQuote first.
   */
  async buildPathPaymentTransaction(params: {
    sourceAsset: string;
    destAsset: string;
    sendAmount: string;
    destMinAmount?: string;
    destination: string;
    path?: string[];
    memo?: string;
    fee?: string;
    timeoutSeconds?: number;
  }): Promise<string> {
    const {
      sourceAsset,
      destAsset,
      sendAmount,
      destMinAmount,
      destination,
      path = [],
      memo,
      fee,
      timeoutSeconds = 180,
    } = params;

    const account = this.getAddress();
    const server = this.horizon.getServer();
    const sourceAccount = await server.loadAccount(account);

    const source = getAssetFromCanonical(sourceAsset);
    const dest = getAssetFromCanonical(destAsset);
    const pathAssets = path.map((p) => getAssetFromCanonical(p) as Asset);
    const cleanedSendAmount = cleanAmount(sendAmount);
    const minDest = destMinAmount ?? cleanedSendAmount;

    const feeStroops = fee
      ? Math.round(parseFloat(fee) * 1e7).toString()
      : BASE_FEE;

    const operation = Operation.pathPaymentStrictSend({
      sendAsset: source as Asset,
      sendAmount: cleanedSendAmount,
      destination,
      destAsset: dest as Asset,
      destMin: minDest,
      path: pathAssets,
    });

    const txBuilder = new TransactionBuilder(sourceAccount, {
      fee: feeStroops,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(operation)
      .setTimeout(timeoutSeconds);

    if (memo) {
      txBuilder.addMemo(Memo.text(memo));
    }

    return txBuilder.build().toXDR();
  }

  /**
   * Add a Soroban token by contract ID. Fetches metadata (symbol, name, decimals) via Soroban RPC.
   * Storage is caller's responsibility (localStorage, etc.).
   * @throws If sorobanRpcUrl is not configured
   */
  async addSorobanToken(contractId: string): Promise<SorobanTokenMetadata> {
    const rpcUrl = this.config.sorobanRpcUrl;
    if (!rpcUrl) {
      throw new SorobanRpcNotConfiguredError();
    }
    const publicKey = this.getAddress();
    return getSorobanTokenMetadata(
      contractId,
      publicKey,
      rpcUrl,
      this.networkPassphrase
    );
  }

  /**
   * Add a collectible (NFT) by contract ID and token ID. Fetches metadata from token_uri when available.
   * Returns metadata for caller to store. Storage is caller's responsibility.
   * @throws If sorobanRpcUrl is not configured
   */
  async addCollectible(
    contractId: string,
    tokenId: string
  ): Promise<CollectibleMetadata> {
    const rpcUrl = this.config.sorobanRpcUrl;
    if (!rpcUrl) {
      throw new SorobanRpcNotConfiguredError();
    }
    const publicKey = this.getAddress();
    return getCollectibleMetadata(
      contractId,
      tokenId,
      publicKey,
      rpcUrl,
      this.networkPassphrase
    );
  }

  /**
   * Get transaction history for an account.
   */
  async getAccountTransactions(
    publicKey: string,
    options?: { limit?: number; cursor?: string; order?: "asc" | "desc" }
  ) {
    return this.horizon.getAccountTransactions(publicKey, options);
  }

  /**
   * Create (add) a trustline: build, sign, and submit.
   */
  async createTrustline(
    assetCode: string,
    assetIssuer: string,
    limit?: string
  ) {
    const xdr = await this.buildTrustlineTransaction(
      assetCode,
      assetIssuer,
      limit
    );
    const signed = await this.signXDR(xdr);
    return this.submitXDR(signed);
  }

  /**
   * Full swap: quote → build → sign → optionally submit.
   * Returns quote, signed XDR, and hash if submitted.
   */
  async swap(params: {
    sourceAsset: string;
    destAsset: string;
    amount: string;
    mode?: "strictSend" | "strictReceive";
    slippagePercent?: number;
    memo?: string;
    submit?: boolean;
  }): Promise<{ quote: SwapQuote; signedXdr: string; hash?: string }> {
    const { submit = true } = params;

    const quote = await this.getSwapQuote({
      sourceAsset: params.sourceAsset,
      destAsset: params.destAsset,
      amount: params.amount,
      mode: params.mode ?? "strictSend",
    });

    if (!quote) {
      throw new SwapPathNotFoundError();
    }

    const unsignedXdr = await this.buildSwapTransaction({
      sourceAsset: params.sourceAsset,
      destAsset: params.destAsset,
      amount: params.amount,
      slippagePercent: params.slippagePercent,
      mode: params.mode,
      memo: params.memo,
    });

    const signedXdr = await this.signXDR(unsignedXdr);

    let hash: string | undefined;
    if (submit) {
      const result = await this.submitXDR(signedXdr);
      hash = result.hash;
    }

    return { quote, signedXdr, hash };
  }
}
