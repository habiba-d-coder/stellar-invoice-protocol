# Stellar Invoice Protocol — Architecture

## Overview

On-chain invoice financing for SMEs on Stellar/Soroban.

```
Frontend (Next.js)
    │
    ▼
Backend API (Express/TypeScript)
    ├── Risk Engine (scorer)
    ├── Invoice Store (in-memory → DB)
    └── Anchor Integration (fiat ↔ token)
    │
    ▼
Soroban Smart Contracts (Rust/WASM)
    ├── Invoice Contract   — tokenize invoices
    ├── Pool Contract      — investor liquidity
    ├── Repayment Contract — yield distribution
    └── Reputation Contract — SME credit scoring
```

## Contracts

| Contract | Responsibility |
|---|---|
| `invoice` | Mint/track invoice NFTs with status lifecycle |
| `pool` | Investor deposits, fund invoices, withdraw |
| `repayment` | Register funded invoices, process repayment, split yield |
| `reputation` | On-chain SME credit score based on repayment history |

## User Flow

1. SME uploads invoice → backend validates + scores → hash stored on-chain
2. Investors browse pending invoices → fund via pool contract
3. Buyer pays via bank/anchor → anchor converts fiat → repayment contract distributes yield
4. Reputation contract updates SME score after each repayment/default

## Risk Scoring

Score 0–100 (higher = lower risk):
- Base: 50
- Amount: +15 (<10k), +5 (<100k), -10 (≥100k)
- Days to due: +15 (>60d), +5 (>30d), -20 (overdue)
- Repayment history: ±20% weight on deviation from 50
