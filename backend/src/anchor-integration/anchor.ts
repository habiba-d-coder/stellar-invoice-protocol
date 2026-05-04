/**
 * Anchor Integration Stub
 *
 * Bridges fiat payments ↔ on-chain tokens via Stellar SEP-24/SEP-31.
 * Replace stubs with real anchor API calls in production.
 */

export interface AnchorDepositResult {
  txId: string;
  amount: number;
  asset: string;
  status: "pending" | "completed" | "failed";
}

export interface AnchorWithdrawResult {
  txId: string;
  amount: number;
  bankRef: string;
  status: "pending" | "completed" | "failed";
}

/**
 * Initiate a fiat → token deposit via anchor.
 * In production: call SEP-24 /transactions/deposit/interactive
 */
export async function initiateDeposit(
  stellarAddress: string,
  amount: number,
  asset: string = "USDC"
): Promise<AnchorDepositResult> {
  // TODO: integrate with real anchor (e.g. Circle, MoneyGram)
  return {
    txId: `stub-deposit-${Date.now()}`,
    amount,
    asset,
    status: "pending",
  };
}

/**
 * Initiate a token → fiat withdrawal via anchor.
 * In production: call SEP-24 /transactions/withdraw/interactive
 */
export async function initiateWithdraw(
  stellarAddress: string,
  amount: number,
  bankAccount: string,
  asset: string = "USDC"
): Promise<AnchorWithdrawResult> {
  // TODO: integrate with real anchor
  return {
    txId: `stub-withdraw-${Date.now()}`,
    amount,
    bankRef: bankAccount,
    status: "pending",
  };
}

/**
 * Check transaction status from anchor.
 */
export async function getTransactionStatus(
  txId: string
): Promise<"pending" | "completed" | "failed"> {
  // TODO: call SEP-24 /transaction?id=txId
  return "pending";
}
