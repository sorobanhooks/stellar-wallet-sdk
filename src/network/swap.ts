import {
  Horizon,
  Asset,
  Operation,
  TransactionBuilder,
  Memo,
  BASE_FEE,
  Transaction,
} from "@stellar/stellar-sdk";

import { getAssetFromCanonical, getCanonicalFromAsset, cleanAmount } from "./assets";

export interface SwapQuote {
  sourceAmount: string;
  destAmount: string;
  path: string[];
  sourceAsset: string;
  destAsset: string;
}

export interface GetSwapQuoteParams {
  sourceAsset: string;
  destAsset: string;
  amount: string;
  mode: "strictSend" | "strictReceive";
}

export interface BuildSwapTransactionParams {
  sourceAsset: string;
  destAsset: string;
  sourceAmount: string;
  destMinAmount: string;
  path: string[];
  sourceAccount: string;
  destination?: string;
  fee?: string;
  memo?: string;
  timeoutSeconds?: number;
}

/** Horizon path record shape */
interface PathRecord {
  source_amount?: string;
  destination_amount?: string;
  path?: Array<{ asset_type?: string; asset_code?: string; asset_issuer?: string }>;
}

/**
 * Compute minimum destination amount after slippage.
 * @param destAmount - Expected destination amount
 * @param slippagePercent - Slippage tolerance (e.g. 1 for 1%)
 */
export function computeDestMinWithSlippage(
  destAmount: string,
  slippagePercent: number
): string {
  const mult = 1 - slippagePercent / 100;
  const result = parseFloat(destAmount) * mult;
  return result.toFixed(7);
}

/**
 * Get swap quote (path and amounts) from Horizon.
 * @returns SwapQuote or null if no path found
 */
export async function getSwapQuote(
  server: Horizon.Server,
  params: GetSwapQuoteParams
): Promise<SwapQuote | null> {
  const { sourceAsset, destAsset, amount, mode } = params;
  const source = getAssetFromCanonical(sourceAsset);
  const dest = getAssetFromCanonical(destAsset);
  const cleanedAmount = cleanAmount(amount);

  let record: PathRecord | undefined;

  if (mode === "strictSend") {
    const response = await server
      .strictSendPaths(source as Asset, cleanedAmount, [dest as Asset])
      .call();
    record = response.records[0] as PathRecord | undefined;
  } else {
    const response = await server
      .strictReceivePaths(
        [source as Asset],
        dest as Asset,
        cleanedAmount
      )
      .call();
    record = response.records[0] as PathRecord | undefined;
  }

  if (!record) {
    return null;
  }

  const sourceAmount =
    mode === "strictSend"
      ? (record.source_amount ?? cleanedAmount)
      : (record.source_amount ?? "");
  const destAmount =
    mode === "strictReceive"
      ? (record.destination_amount ?? cleanedAmount)
      : (record.destination_amount ?? "");

  if (!sourceAmount || !destAmount) {
    return null;
  }

  const path: string[] = [];
  for (const p of record.path ?? []) {
    if (!p.asset_code && !p.asset_issuer) {
      path.push(p.asset_type ?? "native");
    } else {
      path.push(getCanonicalFromAsset(p.asset_code ?? "", p.asset_issuer));
    }
  }

  return {
    sourceAmount,
    destAmount,
    path,
    sourceAsset,
    destAsset,
  };
}

/**
 * Build unsigned path payment strict send transaction.
 * @returns Built Transaction (call .toXDR() for XDR string)
 */
export async function buildSwapTransaction(
  server: Horizon.Server,
  params: BuildSwapTransactionParams,
  networkPassphrase: string
): Promise<Transaction> {
  const {
    sourceAsset,
    destAsset,
    sourceAmount,
    destMinAmount,
    path,
    sourceAccount,
    destination,
    fee,
    memo,
    timeoutSeconds = 180,
  } = params;

  const dest = destination ?? sourceAccount;
  const feeStroops = fee
    ? Math.round(parseFloat(fee) * 1e7).toString()
    : BASE_FEE;

  const account = await server.loadAccount(sourceAccount);
  const source = getAssetFromCanonical(sourceAsset);
  const destAssetObj = getAssetFromCanonical(destAsset);
  const pathAssets = path.map((p) => getAssetFromCanonical(p) as Asset);

  const operation = Operation.pathPaymentStrictSend({
    sendAsset: source as Asset,
    sendAmount: sourceAmount,
    destination: dest,
    destAsset: destAssetObj as Asset,
    destMin: destMinAmount,
    path: pathAssets,
  });

  const txBuilder = new TransactionBuilder(account, {
    fee: feeStroops,
    networkPassphrase,
  })
    .addOperation(operation)
    .setTimeout(timeoutSeconds);

  if (memo) {
    txBuilder.addMemo(Memo.text(memo));
  }

  return txBuilder.build();
}
