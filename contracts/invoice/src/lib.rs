#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol, symbol_short};

#[contracttype]
#[derive(Clone, PartialEq, Debug)]
pub enum InvoiceStatus {
    Pending,
    Funded,
    Repaid,
    Defaulted,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct Invoice {
    pub id: u64,
    pub owner: Address,
    pub amount: i128,
    pub due_date: u64,
    pub status: InvoiceStatus,
    pub risk_score: u32,
    pub ipfs_hash: Symbol,
}

#[contracttype]
pub enum DataKey {
    Invoice(u64),
    InvoiceCount,
}

#[contract]
pub struct InvoiceContract;

#[contractimpl]
impl InvoiceContract {
    /// Create a new invoice. Returns the invoice ID.
    pub fn create_invoice(
        env: Env,
        owner: Address,
        amount: i128,
        due_date: u64,
        risk_score: u32,
        ipfs_hash: Symbol,
    ) -> u64 {
        owner.require_auth();
        assert!(amount > 0, "amount must be positive");
        assert!(risk_score <= 100, "risk_score must be 0-100");

        let id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::InvoiceCount)
            .unwrap_or(0u64)
            + 1;

        let invoice = Invoice {
            id,
            owner,
            amount,
            due_date,
            status: InvoiceStatus::Pending,
            risk_score,
            ipfs_hash,
        };

        env.storage().instance().set(&DataKey::Invoice(id), &invoice);
        env.storage().instance().set(&DataKey::InvoiceCount, &id);
        id
    }

    /// Get invoice by ID.
    pub fn get_invoice(env: Env, id: u64) -> Invoice {
        env.storage()
            .instance()
            .get(&DataKey::Invoice(id))
            .expect("invoice not found")
    }

    /// Update invoice status (called by pool/repayment contracts).
    pub fn set_status(env: Env, caller: Address, id: u64, status: InvoiceStatus) {
        caller.require_auth();
        let mut invoice: Invoice = env
            .storage()
            .instance()
            .get(&DataKey::Invoice(id))
            .expect("invoice not found");
        invoice.status = status;
        env.storage().instance().set(&DataKey::Invoice(id), &invoice);
    }

    pub fn invoice_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::InvoiceCount)
            .unwrap_or(0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env, symbol_short};

    #[test]
    fn test_create_and_get_invoice() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, InvoiceContract);
        let client = InvoiceContractClient::new(&env, &contract_id);

        let owner = Address::generate(&env);
        let id = client.create_invoice(&owner, &1000, &9999999, &75, &symbol_short!("abc123"));

        assert_eq!(id, 1);
        let inv = client.get_invoice(&1);
        assert_eq!(inv.amount, 1000);
        assert_eq!(inv.risk_score, 75);
        assert_eq!(inv.status, InvoiceStatus::Pending);
    }

    #[test]
    fn test_set_status() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, InvoiceContract);
        let client = InvoiceContractClient::new(&env, &contract_id);

        let owner = Address::generate(&env);
        let id = client.create_invoice(&owner, &500, &9999999, &50, &symbol_short!("xyz"));
        client.set_status(&owner, &id, &InvoiceStatus::Funded);

        let inv = client.get_invoice(&id);
        assert_eq!(inv.status, InvoiceStatus::Funded);
    }

    #[test]
    fn test_invoice_count() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, InvoiceContract);
        let client = InvoiceContractClient::new(&env, &contract_id);

        let owner = Address::generate(&env);
        assert_eq!(client.invoice_count(), 0);
        client.create_invoice(&owner, &100, &9999999, &60, &symbol_short!("h1"));
        client.create_invoice(&owner, &200, &9999999, &70, &symbol_short!("h2"));
        assert_eq!(client.invoice_count(), 2);
    }
}
