# Stellar Invoice Protocol

On-chain invoice financing for SMEs — powered by Stellar & Soroban.

SMEs tokenize invoices, get instant liquidity from a global investor pool, and repay when their buyers settle. Investors earn yield. Everything settles on-chain.

---

## How It Works

```
SME uploads invoice → risk scored → tokenized on-chain
                                          ↓
                              Investors fund from pool
                                          ↓
                         Buyer pays via bank / anchor
                                          ↓
                    Repayment contract splits yield + fee
                                          ↓
                         SME reputation score updated
```

---

## Stack

| Layer | Tech |
|---|---|
| Smart Contracts | Rust / Soroban (Stellar) |
| Backend API | Node.js / Express / TypeScript |
| Frontend | Next.js 14 / React |
| Off-chain Storage | IPFS (invoice metadata) |
| Fiat Bridge | Stellar Anchors (SEP-24/31) |

---

## Project Structure

```
stellar-invoice-protocol/
├── contracts/
│   ├── invoice/        # Invoice NFT lifecycle (mint, status, get)
│   ├── pool/           # Investor deposits, fund invoices, withdraw
│   ├── repayment/      # Repayment tracking + yield distribution
│   └── reputation/     # On-chain SME credit scoring
├── backend/
│   └── src/
│       ├── api/                  # REST routes (invoices, risk)
│       ├── risk-engine/          # Risk scorer (0–100)
│       ├── store/                # Invoice store (in-memory → DB)
│       └── anchor-integration/   # Fiat ↔ token bridge (SEP-24 stub)
├── frontend/
│   ├── app/
│   │   ├── sme/        # SME dashboard — upload invoices
│   │   └── investor/   # Investor dashboard — browse & fund
│   └── lib/api.ts      # Typed API client
└── docs/
    └── architecture.md
```

---

## Smart Contracts

### Invoice Contract
Tokenizes each invoice on-chain. Stores owner, amount, due date, risk score, and IPFS hash. Tracks status through `Pending → Funded → Repaid / Defaulted`.

```rust
pub fn create_invoice(env, owner, amount, due_date, risk_score, ipfs_hash) -> u64
pub fn get_invoice(env, id) -> Invoice
pub fn set_status(env, caller, id, status)
```

### Pool Contract
Manages investor liquidity. Investors deposit, fund specific invoices, and withdraw.

```rust
pub fn deposit(env, investor, amount)
pub fn fund_invoice(env, funder, invoice_id, amount)
pub fn withdraw(env, investor, amount)
pub fn get_balance(env, investor) -> i128
```

### Repayment Contract
Registers funded invoices and handles repayment. Splits proceeds into investor return and protocol fee (2%).

```rust
pub fn register(env, admin, invoice_id, principal, interest, investor)
pub fn repay(env, payer, invoice_id) -> (investor_amount, protocol_fee)
```

### Reputation Contract
Tracks SME repayment history on-chain. Score starts at 50, increases with on-time repayments, decreases with defaults.

```rust
pub fn record_repayment(env, admin, sme)
pub fn record_default(env, admin, sme)
pub fn get_score(env, sme) -> u32   // 0–100
```

---

## Backend API

Base URL: `http://localhost:3001`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/invoices` | Create invoice (auto risk-scored) |
| `GET` | `/api/invoices` | List all invoices |
| `GET` | `/api/invoices/:id` | Get invoice by ID |
| `PATCH` | `/api/invoices/:id/status` | Update invoice status |
| `POST` | `/api/risk/score` | Score an invoice (amount + dueDate) |

### Risk Scoring

Score 0–100 (higher = lower risk):

- **Amount**: +15 for <$10k, +5 for <$100k, -10 for ≥$100k
- **Due date**: +15 if >60 days, +5 if >30 days, -20 if overdue
- **Repayment history**: weighted bonus/penalty based on past behaviour

---

## Getting Started

### Prerequisites

- Rust + `cargo` (for contracts)
- Node.js 20+ (for backend + frontend)
- [Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools/cli/stellar-cli) (for contract deployment)

### Contracts

```bash
# Run all contract tests
cargo test
```

### Backend

```bash
cd backend
npm install
npm test        # run tests
npm run dev     # start dev server on :3001
```

### Frontend

```bash
cd frontend
npm install
npm test        # run tests
npm run dev     # start on :3000
```

Set `NEXT_PUBLIC_API_URL=http://localhost:3001` in `frontend/.env.local` if needed.

---

## Test Coverage

```
contracts/invoice     3 tests  — create, get, set_status
contracts/pool        4 tests  — deposit, fund, withdraw, insufficient balance
contracts/repayment   2 tests  — register+repay, double-repay guard
contracts/reputation  3 tests  — default score, repayment boost, default penalty
backend/api          13 tests  — all REST endpoints + risk scorer
frontend/lib          5 tests  — API client (fetch, create, update, score)
─────────────────────────────
Total                30 tests  — all passing ✅
```

---

## Roadmap

- [ ] Fractional invoice trading (secondary market)
- [ ] Dynamic interest rates based on risk score
- [ ] Insurance pool for defaults
- [ ] Cross-border FX routing via Stellar path payments
- [ ] DAO governance for risk parameters
- [ ] IPFS integration for invoice metadata
- [ ] Real anchor integration (Circle / MoneyGram)
- [ ] PostgreSQL persistence layer

---

## Why Stellar

Stellar is purpose-built for this use case:

- **Fast & cheap** — 5-second finality, ~$0.00001 per transaction
- **Asset issuance** — native tokenization of real-world assets
- **Anchors** — regulated fiat on/off ramps in 180+ countries
- **Soroban** — full smart contract capability for DeFi logic
- **Mission alignment** — Stellar Foundation actively promotes SME financial inclusion

---

## License

MIT
