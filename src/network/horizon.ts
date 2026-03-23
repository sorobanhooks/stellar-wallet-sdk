import {
  Horizon,
  TransactionBuilder,
  FeeBumpTransaction,
  Transaction,
  NotFoundError,
} from "@stellar/stellar-sdk";

import { resolveAssetMetadata } from "./asset-metadata";
import { FriendbotFailedError, createTransactionFailedError } from "../errors";

export { NotFoundError };

export function isAccountNotFoundError(err: unknown): err is NotFoundError {
  return err instanceof NotFoundError;
}

/** Balance for a single asset (native XLM or token) */
export interface AccountBalance {
  assetType: "native" | "credit_alphanum4" | "credit_alphanum12" | "liquidity_pool_shares";
  balance: string;
  assetCode?: string;
  assetIssuer?: string;
  limit?: string;
  iconUrl?: string;
  name?: string;
  decimals?: number;
}

/** Simplified transaction record for account history */
export interface TransactionRecord {
  id: string;
  hash: string;
  created_at: string;
  source_account: string;
  successful: boolean;
  memo?: string;
  operation_count: number;
  paging_token: string;
}

/** Response from Horizon when submitting a transaction */
export interface SubmitTransactionResult {
  hash: string;
  ledger: number;
  successful: boolean;
  envelope_xdr: string;
  result_xdr: string;
  result_meta_xdr: string;
  paging_token: string;
}

export interface HorizonAdapterConfig {
  rpcUrl: string;
  networkPassphrase: string;
  friendbotUrl?: string;
}

export class HorizonAdapter {
  private server: Horizon.Server;
  private networkPassphrase: string;
  private friendbotUrl: string | undefined;

  constructor(config: string | HorizonAdapterConfig) {
    if (typeof config === "string") {
      this.server = new Horizon.Server(config);
      this.networkPassphrase = "Public Global Stellar Network ; September 2015";
      this.friendbotUrl = undefined;
    } else {
      this.server = new Horizon.Server(config.rpcUrl);
      this.networkPassphrase = config.networkPassphrase;
      this.friendbotUrl = config.friendbotUrl;
    }
  }

  async submitXDR(xdr: string): Promise<SubmitTransactionResult> {
    const tx = TransactionBuilder.fromXDR(
      xdr,
      this.networkPassphrase
    ) as Transaction | FeeBumpTransaction;
    try {
      const result = await this.server.submitTransaction(tx);
      return result as SubmitTransactionResult;
    } catch (err) {
      throw createTransactionFailedError(err);
    }
  }

  /**
   * Get the underlying Horizon Server instance.
   * Useful for swap path finding and other advanced operations.
   */
  getServer(): Horizon.Server {
    return this.server;
  }

  async loadAccount(publicKey: string) {
    return this.server.loadAccount(publicKey);
  }

  async getAccountBalances(publicKey: string): Promise<AccountBalance[]> {
    const account = await this.server.loadAccount(publicKey);
    return account.balances.map((b) => {
      const line = b as {
        balance: string;
        asset_type: string;
        asset_code?: string;
        asset_issuer?: string;
        limit?: string;
      };
      const result: AccountBalance = {
        assetType: line.asset_type as AccountBalance["assetType"],
        balance: line.balance,
      };
      if (line.asset_code) result.assetCode = line.asset_code;
      if (line.asset_issuer) result.assetIssuer = line.asset_issuer;
      if (line.limit) result.limit = line.limit;
      return result;
    });
  }

  async getAccountBalancesWithMetadata(publicKey: string): Promise<AccountBalance[]> {
    const balances = await this.getAccountBalances(publicKey);
    const issuerCache = new Map<string, string | undefined>();

    const getIssuerHomeDomain = async (issuer: string): Promise<string | undefined> => {
      const cached = issuerCache.get(issuer);
      if (cached !== undefined) return cached;
      try {
        const acc = await this.server.loadAccount(issuer);
        const domain = (acc as { home_domain?: string }).home_domain;
        issuerCache.set(issuer, domain);
        return domain;
      } catch {
        issuerCache.set(issuer, undefined);
        return undefined;
      }
    };

    const enriched = await Promise.all(
      balances.map(async (b) => {
        const meta = await resolveAssetMetadata(
          {
            assetType: b.assetType,
            assetCode: b.assetCode,
            assetIssuer: b.assetIssuer,
          },
          getIssuerHomeDomain
        );
        return { ...b, ...meta };
      })
    );

    return enriched;
  }

  async fundAccount(publicKey: string): Promise<void> {
    const url = this.friendbotUrl ?? "https://friendbot.stellar.org";
    const sep = url.includes("?") ? "&" : "?";
    const target = `${url}${sep}addr=${encodeURIComponent(publicKey)}`;
    const res = await fetch(target);
    if (!res.ok) {
      const text = await res.text();
      throw new FriendbotFailedError(`${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`);
    }
  }

  /**
   * Get transaction history for an account.
   */
  async getAccountTransactions(
    publicKey: string,
    options?: { limit?: number; cursor?: string; order?: "asc" | "desc" }
  ): Promise<TransactionRecord[]> {
    const limit = options?.limit ?? 20;
    const order = options?.order ?? "desc";

    let builder = this.server
      .transactions()
      .forAccount(publicKey)
      .limit(limit)
      .order(order);

    if (options?.cursor) {
      builder = builder.cursor(options.cursor);
    }

    const page = await builder.call();
    const records = page.records as Array<{
      id: string;
      hash: string;
      created_at: string;
      source_account: string;
      successful: boolean;
      memo?: string;
      operation_count: number;
      paging_token: string;
    }>;

    return records.map((r) => ({
      id: r.id,
      hash: r.hash,
      created_at: r.created_at,
      source_account: r.source_account,
      successful: r.successful,
      memo: r.memo,
      operation_count: r.operation_count,
      paging_token: r.paging_token,
    }));
  }
}
