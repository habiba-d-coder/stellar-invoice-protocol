import { scoreInvoice } from "../src/risk-engine/scorer";

describe("scoreInvoice", () => {
  const futureDate = (days: number) =>
    new Date(Date.now() + days * 86_400_000).toISOString();

  test("small amount + long due date = high score", () => {
    const score = scoreInvoice({ amount: 5000, dueDate: futureDate(90) });
    expect(score).toBeGreaterThan(70);
  });

  test("large amount + short due date = lower score", () => {
    const score = scoreInvoice({ amount: 500_000, dueDate: futureDate(10) });
    expect(score).toBeLessThan(60);
  });

  test("overdue invoice gets penalized", () => {
    const score = scoreInvoice({ amount: 5000, dueDate: futureDate(-10) });
    expect(score).toBeLessThan(50);
  });

  test("good repayment history boosts score", () => {
    const base = scoreInvoice({ amount: 5000, dueDate: futureDate(60) });
    const boosted = scoreInvoice({
      amount: 5000,
      dueDate: futureDate(60),
      repaymentHistory: 100,
    });
    expect(boosted).toBeGreaterThan(base);
  });

  test("score is clamped between 0 and 100", () => {
    const s1 = scoreInvoice({ amount: 1, dueDate: futureDate(365), repaymentHistory: 100 });
    const s2 = scoreInvoice({ amount: 1_000_000, dueDate: futureDate(-100), repaymentHistory: 0 });
    expect(s1).toBeLessThanOrEqual(100);
    expect(s2).toBeGreaterThanOrEqual(0);
  });
});
