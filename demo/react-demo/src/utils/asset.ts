import type { AccountBalance } from "stellar-wallet-sdk";

export function getCanonicalFromBalance(b: AccountBalance): string {
  if (b.assetType === "native") return "native";
  if (b.assetCode && b.assetIssuer) return `${b.assetCode}:${b.assetIssuer}`;
  return "native";
}

export function getAssetCode(canonical: string): string {
  if (canonical === "native") return "XLM";
  const parts = canonical.split(":");
  return parts[0] || "XLM";
}

export function getTokenId(b: AccountBalance): string {
  if (b.assetType === "native") return "XLM";
  if (b.assetCode && b.assetIssuer) return `${b.assetCode}:${b.assetIssuer}`;
  return "";
}

export function formatAsset(b: AccountBalance): string {
  if (b.name) return b.name;
  if (b.assetType === "native") return "XLM";
  if (b.assetCode && b.assetIssuer) {
    return `${b.assetCode} (${b.assetIssuer.slice(0, 8)}...)`;
  }
  return b.assetCode ?? b.assetType;
}
