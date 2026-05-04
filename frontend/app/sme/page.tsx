"use client";
import { useEffect, useState } from "react";
import { fetchInvoices, createInvoice, Invoice } from "../../lib/api";

export default function SMEDashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [form, setForm] = useState({
    owner: "",
    amount: "",
    dueDate: "",
    debtorName: "",
    currency: "USDC",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    fetchInvoices().then(setInvoices).catch(console.error);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const inv = await createInvoice({
        ...form,
        amount: Number(form.amount),
      });
      setInvoices((prev) => [...prev, inv]);
      setForm({ owner: "", amount: "", dueDate: "", debtorName: "", currency: "USDC" });
    } catch {
      setError("Failed to create invoice");
    }
  }

  return (
    <main>
      <h1>SME Dashboard</h1>
      <form onSubmit={handleSubmit} aria-label="Create Invoice">
        <input
          placeholder="Your Stellar address"
          value={form.owner}
          onChange={(e) => setForm({ ...form, owner: e.target.value })}
          required
          aria-label="Owner address"
        />
        <input
          type="number"
          placeholder="Amount"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          required
          aria-label="Amount"
        />
        <input
          type="date"
          value={form.dueDate}
          onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          required
          aria-label="Due date"
        />
        <input
          placeholder="Debtor name"
          value={form.debtorName}
          onChange={(e) => setForm({ ...form, debtorName: e.target.value })}
          required
          aria-label="Debtor name"
        />
        <button type="submit">Submit Invoice</button>
      </form>
      {error && <p role="alert">{error}</p>}
      <section aria-label="My Invoices">
        <h2>My Invoices</h2>
        {invoices.length === 0 && <p>No invoices yet.</p>}
        <ul>
          {invoices.map((inv) => (
            <li key={inv.id}>
              #{inv.id} — {inv.debtorName} — {inv.amount} {inv.currency} —{" "}
              <strong>{inv.status}</strong>
              {inv.riskScore !== undefined && ` — Risk: ${inv.riskScore}`}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
