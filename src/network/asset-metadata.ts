import { StellarToml } from "@stellar/stellar-sdk";
import type { AccountBalance } from "./horizon";

/** Well-known XLM icon (Stellar symbol) - inline SVG data URL for reliability */
const NATIVE_XLM_ICON_URL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ccircle cx='32' cy='32' r='30' fill='%2300B4B4'/%3E%3Ccircle cx='32' cy='32' r='12' fill='none' stroke='%23fff' stroke-width='4'/%3E%3Ccircle cx='32' cy='32' r='4' fill='%23fff'/%3E%3C/svg%3E";

export interface AssetMetadataInput {
  assetType: AccountBalance["assetType"];
  assetCode?: string;
  assetIssuer?: string;
}

export interface AssetMetadataResult {
  iconUrl?: string;
  name?: string;
  decimals?: number;
}

/**
 * Resolve asset metadata (icon, name, decimals) from stellar.toml.
 * For native XLM, returns a well-known icon. For custom assets, fetches
 * stellar.toml from the issuer's home_domain. Fails gracefully on CORS or
 * missing data.
 */
export async function resolveAssetMetadata(
  asset: AssetMetadataInput,
  getIssuerHomeDomain: (issuer: string) => Promise<string | undefined>
): Promise<AssetMetadataResult> {
  if (asset.assetType === "native") {
    return {
      iconUrl: NATIVE_XLM_ICON_URL,
      name: "Stellar Lumens",
      decimals: 7,
    };
  }

  if (asset.assetType === "liquidity_pool_shares" || !asset.assetIssuer) {
    return {};
  }

  try {
    const homeDomain = await getIssuerHomeDomain(asset.assetIssuer);
    if (!homeDomain) return {};

    const stellarToml = await StellarToml.Resolver.resolve(homeDomain, {
      allowHttp: false,
      timeout: 5000,
    });

    const currencies = stellarToml.CURRENCIES ?? [];
    const code = asset.assetCode ?? "";
    const match = currencies.find(
      (c) =>
        c.code === code &&
        (c.issuer === asset.assetIssuer || !c.issuer)
    );

    if (!match) return {};

    return {
      iconUrl: match.image,
      name: match.name,
      decimals: match.display_decimals,
    };
  } catch {
    return {};
  }
}
