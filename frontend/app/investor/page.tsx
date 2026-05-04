"use client";
import { useEffect, useState } from "react";
import { fetchInvoices, updateInvoiceStatus, Invoice } from "../../lib/api";

export default function InvestorDashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices()
      .then(setInvoices)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function fund(id: string) {
    const updated = await updateInvoiceStatus(id, "funded");
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? updated : inv)));
  }

  const pending = invoices.filter((i) => i.status === "pending");
  const funded = invoices.filter((i) => i.status === "funded");

  return (
    <main>
      <h1>Investor Dashboard</h1>
      {loading && <p>Loading...</p>}

      <section aria-label="Available Invoices">
        <h2>Available Invoices</h2>
        {pending.length === 0 && !loading && <p>No invoices available.</p>}
        <ul>
          {pending.map((inv) => (
            <li key={inv.id}>
              #{inv.id} — {inv.debtorName} — {inv.amount} {inv.currency} — Due:{" "}
              {inv.dueDate}
              {inv.riskScore !== undefined && ` — Risk Score: ${inv.riskScore}`}
              <button onClick={() => fund(inv.id)} aria-label={`Fund invoice ${inv.id}`}>
                Fund
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Funded Invoices">
        <h2>My Funded Invoices</h2>
        {funded.length === 0 && !loading && <p>No funded invoices.</p>}
        <ul>
          {funded.map((inv) => (
            <li key={inv.id}>
              #{inv.id} — {inv.debtorName} — {inv.amount} {inv.currency} —{" "}
              <strong>funded</strong>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
