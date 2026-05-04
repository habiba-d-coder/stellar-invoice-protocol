import request from "supertest";
import { app } from "../src/index";
import { invoiceStore } from "../src/store/invoiceStore";

beforeEach(() => invoiceStore.clear());

const validInvoice = {
  owner: "GADDR123",
  amount: 5000,
  currency: "USDC",
  dueDate: new Date(Date.now() + 60 * 86_400_000).toISOString(),
  debtorName: "Acme Corp",
};

describe("POST /api/invoices", () => {
  test("creates invoice and returns 201", async () => {
    const res = await request(app).post("/api/invoices").send(validInvoice);
    expect(res.status).toBe(201);
    expect(res.body.id).toBe("1");
    expect(res.body.status).toBe("pending");
    expect(res.body.riskScore).toBeDefined();
  });

  test("rejects missing fields with 400", async () => {
    const res = await request(app).post("/api/invoices").send({ amount: 100 });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/invoices", () => {
  test("returns all invoices", async () => {
    await request(app).post("/api/invoices").send(validInvoice);
    await request(app).post("/api/invoices").send({ ...validInvoice, amount: 9000 });
    const res = await request(app).get("/api/invoices");
    expect(res.body).toHaveLength(2);
  });
});

describe("GET /api/invoices/:id", () => {
  test("returns invoice by id", async () => {
    await request(app).post("/api/invoices").send(validInvoice);
    const res = await request(app).get("/api/invoices/1");
    expect(res.status).toBe(200);
    expect(res.body.debtorName).toBe("Acme Corp");
  });

  test("returns 404 for unknown id", async () => {
    const res = await request(app).get("/api/invoices/999");
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/invoices/:id/status", () => {
  test("updates status to funded", async () => {
    await request(app).post("/api/invoices").send(validInvoice);
    const res = await request(app)
      .patch("/api/invoices/1/status")
      .send({ status: "funded" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("funded");
  });

  test("rejects invalid status", async () => {
    await request(app).post("/api/invoices").send(validInvoice);
    const res = await request(app)
      .patch("/api/invoices/1/status")
      .send({ status: "hacked" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/risk/score", () => {
  test("returns a score", async () => {
    const res = await request(app).post("/api/risk/score").send({
      amount: 5000,
      dueDate: new Date(Date.now() + 60 * 86_400_000).toISOString(),
    });
    expect(res.status).toBe(200);
    expect(typeof res.body.score).toBe("number");
  });
});
