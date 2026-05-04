const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export interface Invoice {
  id: string;
  owner: string;
  amount: number;
  currency: string;
  dueDate: string;
  debtorName: string;
  riskScore?: number;
  status: "pending" | "funded" | "repaid" | "defaulted";
  createdAt: string;
}

export async function fetchInvoices(): Promise<Invoice[]> {
  const res = await fetch(`${BASE}/api/invoices`);
  if (!res.ok) throw new Error("Failed to fetch invoices");
  return res.json();
}

export async function createInvoice(
  data: Omit<Invoice, "id" | "createdAt" | "status" | "riskScore">
): Promise<Invoice> {
  const res = await fetch(`${BASE}/api/invoices`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create invoice");
  return res.json();
}

export async function updateInvoiceStatus(
  id: string,
  status: Invoice["status"]
): Promise<Invoice> {
  const res = await fetch(`${BASE}/api/invoices/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update status");
  return res.json();
}

export async function getRiskScore(
  amount: number,
  dueDate: string
): Promise<number> {
  const res = await fetch(`${BASE}/api/risk/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, dueDate }),
  });
  if (!res.ok) throw new Error("Failed to get risk score");
  const data = await res.json();
  return data.score;
}
