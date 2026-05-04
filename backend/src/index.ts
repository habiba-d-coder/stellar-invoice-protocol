import express from "express";
import { invoiceRouter } from "./api/invoices";
import { riskRouter } from "./api/risk";

export const app = express();
app.use(express.json());
app.use("/api/invoices", invoiceRouter);
app.use("/api/risk", riskRouter);

if (require.main === module) {
  app.listen(3001, () => console.log("Backend running on :3001"));
}
