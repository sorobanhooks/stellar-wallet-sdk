import {
  Contract,
  TransactionBuilder,
  rpc,
  BASE_FEE,
  scValToNative,
  TimeoutInfinite,
  xdr,
} from "@stellar/stellar-sdk";

export interface CollectibleMetadata {
  contractId: string;
  tokenId: string;
  name?: string;
  image?: string;
}

/**
 * Fetch collectible metadata from a Soroban NFT contract.
 * Tries token_uri(token_id) then fetches the JSON from that URL.
 * Returns minimal { contractId, tokenId } if metadata fetch fails.
 */
export async function getCollectibleMetadata(
  contractId: string,
  tokenId: string,
  publicKey: string,
  sorobanRpcUrl: string,
  networkPassphrase: string
): Promise<CollectibleMetadata> {
  const result: CollectibleMetadata = { contractId, tokenId };

  const server = new rpc.Server(sorobanRpcUrl, {
    allowHttp: sorobanRpcUrl.startsWith("http://"),
  });

  const sourceAccount = await server.getAccount(publicKey);
  const contract = new Contract(contractId);

  try {
    // Try token_uri(token_id) - Stellar NFT standard; token_id can be string or symbol
    const tokenIdScVal = xdr.ScVal.scvString(tokenId);
    const tx = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase,
    })
      .addOperation(contract.call("token_uri", tokenIdScVal))
      .setTimeout(TimeoutInfinite)
      .build();

    const sim = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(sim)) {
      return result;
    }
    if (rpc.Api.isSimulationSuccess(sim) && sim.result?.retval !== undefined) {
      const tokenUri = scValToNative(sim.result.retval) as string;
      if (tokenUri && typeof tokenUri === "string") {
        const res = await fetch(tokenUri);
        if (res.ok) {
          const json = (await res.json()) as {
            name?: string;
            image?: string;
            description?: string;
          };
          if (json.name) result.name = json.name;
          if (json.image) result.image = json.image;
        }
      }
    }
  } catch {
    // Return minimal metadata if token_uri or fetch fails
  }

  return result;
}
