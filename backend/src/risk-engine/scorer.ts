interface ScoreInput {
  amount: number;
  dueDate: string;
  repaymentHistory?: number; // 0-100
}

/**
 * Simple deterministic risk scorer (0-100, higher = lower risk).
 * Production: replace with ML model or credit bureau API.
 */
export function scoreInvoice(input: ScoreInput): number {
  let score = 50;

  // Smaller invoices are lower risk
  if (input.amount < 10_000) score += 15;
  else if (input.amount < 100_000) score += 5;
  else score -= 10;

  // Longer time to due date = lower urgency risk
  const daysUntilDue =
    (new Date(input.dueDate).getTime() - Date.now()) / 86_400_000;
  if (daysUntilDue > 60) score += 15;
  else if (daysUntilDue > 30) score += 5;
  else if (daysUntilDue < 0) score -= 20; // overdue

  // Repayment history bonus
  if (input.repaymentHistory !== undefined) {
    score += Math.round((input.repaymentHistory - 50) * 0.4);
  }

  return Math.max(0, Math.min(100, score));
}
