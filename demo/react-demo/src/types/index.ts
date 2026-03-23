import type { AccountBalance, WalletAccount } from "stellar-wallet-sdk";

export type View =
  | "auth"
  | "createResult"
  | "import"
  | "accountList"
  | "accountDetail"
  | "signXdr"
  | "swap"
  | "chooseAsset"
  | "confirmTrustline"
  | "sendPayment"
  | "history"
  | "confirmRemoveTrustline"
  | "signMessage"
  | "signAuthEntry"
  | "pathPayment"
  | "addSorobanToken"
  | "addCollectible"
  | "session";

export type SwapStep = "input" | "review" | "swapping" | "success";

export type { AccountBalance, WalletAccount };
