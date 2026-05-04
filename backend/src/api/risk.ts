import { Router } from "express";
import { z } from "zod";
import { scoreInvoice } from "../risk-engine/scorer";

export const riskRouter = Router();

const ScoreSchema = z.object({
  amount: z.number().positive(),
  dueDate: z.string(),
  repaymentHistory: z.number().min(0).max(100).optional(),
});

riskRouter.post("/score", (req, res) => {
  const parsed = ScoreSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const score = scoreInvoice(parsed.data);
  return res.json({ score });
});
