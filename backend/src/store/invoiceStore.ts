import { Invoice } from "../types/invoice";

// Simple in-memory store (replace with DB in production)
const store = new Map<string, Invoice>();
let counter = 0;

export const invoiceStore = {
  create(data: Omit<Invoice, "id" | "createdAt" | "status">): Invoice {
    const id = String(++counter);
    const invoice: Invoice = {
      ...data,
      id,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    store.set(id, invoice);
    return invoice;
  },

  findById(id: string): Invoice | undefined {
    return store.get(id);
  },

  findAll(): Invoice[] {
    return Array.from(store.values());
  },

  update(id: string, patch: Partial<Invoice>): Invoice | undefined {
    const inv = store.get(id);
    if (!inv) return undefined;
    const updated = { ...inv, ...patch };
    store.set(id, updated);
    return updated;
  },

  clear(): void {
    store.clear();
    counter = 0;
  },
};
