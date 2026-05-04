import { getRiskScore, createInvoice, fetchInvoices, updateInvoiceStatus } from "../lib/api";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockInvoice = {
  id: "1",
  owner: "GADDR",
  amount: 5000,
  currency: "USDC",
  dueDate: "2026-12-01",
  debtorName: "Acme",
  riskScore: 75,
  status: "pending" as const,
  createdAt: "2026-01-01T00:00:00.000Z",
};

beforeEach(() => mockFetch.mockReset());

describe("fetchInvoices", () => {
  test("returns invoices on success", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [mockInvoice],
    });
    const result = await fetchInvoices();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  test("throws on error response", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    await expect(fetchInvoices()).rejects.toThrow("Failed to fetch invoices");
  });
});

describe("createInvoice", () => {
  test("posts and returns created invoice", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockInvoice,
    });
    const result = await createInvoice({
      owner: "GADDR",
      amount: 5000,
      currency: "USDC",
      dueDate: "2026-12-01",
      debtorName: "Acme",
    });
    expect(result.id).toBe("1");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/invoices"),
      expect.objectContaining({ method: "POST" })
    );
  });
});

describe("updateInvoiceStatus", () => {
  test("patches status and returns updated invoice", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...mockInvoice, status: "funded" }),
    });
    const result = await updateInvoiceStatus("1", "funded");
    expect(result.status).toBe("funded");
  });
});

describe("getRiskScore", () => {
  test("returns numeric score", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ score: 72 }),
    });
    const score = await getRiskScore(5000, "2026-12-01");
    expect(score).toBe(72);
  });
});
