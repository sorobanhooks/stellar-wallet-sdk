import {
  Contract,
  TransactionBuilder,
  rpc,
  BASE_FEE,
  scValToNative,
  TimeoutInfinite,
} from "@stellar/stellar-sdk";
import { SimulationError } from "../errors";

export interface SorobanTokenMetadata {
  symbol: string;
  name?: string;
  decimals: number;
}

/**
 * Fetch token metadata (symbol, name, decimals) from a Soroban token contract.
 * Uses simulateTransaction for each contract call.
 */
export async function getSorobanTokenMetadata(
  contractId: string,
  publicKey: string,
  sorobanRpcUrl: string,
  networkPassphrase: string
): Promise<SorobanTokenMetadata> {
  const server = new rpc.Server(sorobanRpcUrl, {
    allowHttp: sorobanRpcUrl.startsWith("http://"),
  });

  const sourceAccount = await server.getAccount(publicKey);
  const contract = new Contract(contractId);

  const buildAndSimulate = async (method: string): Promise<unknown> => {
    const tx = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase,
    })
      .addOperation(contract.call(method))
      .setTimeout(TimeoutInfinite)
      .build();

    const sim = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(sim)) {
      throw new SimulationError(sim.error ?? `Simulation failed for ${method}`);
    }
    if (rpc.Api.isSimulationSuccess(sim) && sim.result?.retval !== undefined) {
      return scValToNative(sim.result.retval);
    }
    throw new SimulationError(`Failed to simulate ${method}`);
  };

  const [name, symbol, decimals] = await Promise.all([
    buildAndSimulate("name"),
    buildAndSimulate("symbol"),
    buildAndSimulate("decimals"),
  ]);

  return {
    symbol: String(symbol ?? "?"),
    name: name != null ? String(name) : undefined,
    decimals: Number(decimals ?? 7),
  };
}
