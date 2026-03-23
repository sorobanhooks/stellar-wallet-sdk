import { Asset } from "@stellar/stellar-sdk";
import { InvalidAssetError } from "../errors";

/**
 * Convert canonical asset ID to Stellar Asset.
 * @param canonical - "native" for XLM, or "CODE:ISSUER" for tokens
 */
export function getAssetFromCanonical(canonical: string): Asset {
  if (canonical === "native") {
    return Asset.native();
  }
  if (canonical.includes(":")) {
    const [code, issuer] = canonical.split(":");
    if (!code || !issuer) {
      throw new InvalidAssetError(canonical);
    }
    return new Asset(code, issuer);
  }
  throw new InvalidAssetError(canonical);
}

/**
 * Convert asset to canonical ID string.
 * @param code - Asset code (e.g. "XLM", "USDC")
 * @param issuer - Issuer public key, omit for native XLM
 */
export function getCanonicalFromAsset(code: string, issuer?: string): string {
  if ((code === "XLM" || code === "native") && !issuer) {
    return "native";
  }
  if (!issuer) {
    return code;
  }
  return `${code}:${issuer}`;
}

/**
 * Strip non-numeric characters from amount string for Horizon API.
 * e.g. "1,000.50" -> "1000.50"
 */
export function cleanAmount(amount: string): string {
  return amount.replace(/[^0-9.]/g, "");
}
