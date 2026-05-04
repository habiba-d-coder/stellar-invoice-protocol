import { Router } from "express";
import { z } from "zod";
import { invoiceStore } from "../store/invoiceStore";
import { scoreInvoice } from "../risk-engine/scorer";

export const invoiceRouter = Router();

const CreateSchema = z.object({
  owner: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().default("USDC"),
  dueDate: z.string(),
  debtorName: z.string().min(1),
  ipfsHash: z.string().optional(),
});

invoiceRouter.post("/", (req, res) => {
  const parsed = CreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const data = parsed.data;
  const riskScore = scoreInvoice({ amount: data.amount, dueDate: data.dueDate });
  const invoice = invoiceStore.create({ ...data, riskScore });
  return res.status(201).json(invoice);
});

invoiceRouter.get("/", (_req, res) => {
  return res.json(invoiceStore.findAll());
});

invoiceRouter.get("/:id", (req, res) => {
  const inv = invoiceStore.findById(req.params.id);
  if (!inv) return res.status(404).json({ error: "not found" });
  return res.json(inv);
});

invoiceRouter.patch("/:id/status", (req, res) => {
  const { status } = req.body as { status: string };
  const allowed = ["pending", "funded", "repaid", "defaulted"];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: "invalid status" });
  }
  const updated = invoiceStore.update(req.params.id, { status: status as any });
  if (!updated) return res.status(404).json({ error: "not found" });
  return res.json(updated);
});
