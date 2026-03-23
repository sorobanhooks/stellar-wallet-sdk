import type { AccountBalance } from "./horizon";
import { TokenPricesError } from "../errors";

/** Price data for a single token (parsed from API response) */
export interface TokenPriceData {
  currentPrice: number;
  percentagePriceChange24h: number | null;
}

/** Raw API response shape */
interface TokenPriceResponse {
  data: Record<string, { currentPrice: string; percentagePriceChange24h: string | null } | null>;
}

/** Stellar contract IDs start with C and are 56 chars */
function isContractId(issuer: string): boolean {
  return issuer.startsWith("C") && issuer.length === 56;
}

/**
 * Extract canonical token IDs from account balances for the token-prices API.
 * Skips liquidity pool shares and contract-issued assets.
 */
export function balancesToTokenIds(balances: AccountBalance[]): string[] {
  const seen = new Set<string>();

  for (const b of balances) {
    if (b.assetType === "liquidity_pool_shares") continue;

    if (b.assetType === "native") {
      seen.add("XLM");
      continue;
    }

    if (b.assetCode && b.assetIssuer) {
      if (isContractId(b.assetIssuer)) continue;
      seen.add(`${b.assetCode}:${b.assetIssuer}`);
    }
  }

  return [...seen];
}

/**
 * Fetch token prices from the indexer API.
 * @param indexerBaseUrl - Base URL including path (e.g. https://api.example.com/api/v1)
 * @param tokens - Canonical token IDs (XLM, native, or CODE:ISSUER)
 * @returns Map of token ID to price data, or null if unavailable
 */
export async function getTokenPrices(
  indexerBaseUrl: string,
  tokens: string[]
): Promise<Record<string, TokenPriceData | null>> {
  if (tokens.length === 0) return {};

  const base = indexerBaseUrl.replace(/\/$/, "");
  const url = `${base}/token-prices`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tokens }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new TokenPricesError(`${res.status}: ${text || res.statusText}`);
  }

  const json = (await res.json()) as TokenPriceResponse;
  const data = json.data ?? {};
  const result: Record<string, TokenPriceData | null> = {};

  for (const [tokenId, entry] of Object.entries(data)) {
    if (entry === null) {
      result[tokenId] = null;
      continue;
    }
    result[tokenId] = {
      currentPrice: parseFloat(entry.currentPrice),
      percentagePriceChange24h:
        entry.percentagePriceChange24h !== null
          ? parseFloat(entry.percentagePriceChange24h)
          : null,
    };
  }

  return result;
}
