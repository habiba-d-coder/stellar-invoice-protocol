#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

/// Basis points for protocol fee (e.g. 200 = 2%)
const PROTOCOL_FEE_BPS: i128 = 200;

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum RepaymentStatus {
    Outstanding,
    Repaid,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct RepaymentRecord {
    pub invoice_id: u64,
    pub principal: i128,
    pub interest: i128,
    pub fee: i128,
    pub investor: Address,
    pub status: RepaymentStatus,
}

#[contracttype]
pub enum DataKey {
    Record(u64),
}

#[contract]
pub struct RepaymentContract;

#[contractimpl]
impl RepaymentContract {
    /// Register a funded invoice for repayment tracking.
    pub fn register(
        env: Env,
        admin: Address,
        invoice_id: u64,
        principal: i128,
        interest: i128,
        investor: Address,
    ) {
        admin.require_auth();
        let fee = (principal * PROTOCOL_FEE_BPS) / 10_000;
        let record = RepaymentRecord {
            invoice_id,
            principal,
            interest,
            fee,
            investor,
            status: RepaymentStatus::Outstanding,
        };
        env.storage()
            .instance()
            .set(&DataKey::Record(invoice_id), &record);
    }

    /// Repay an invoice. Marks it as repaid and returns amounts to distribute.
    /// Returns (investor_amount, protocol_fee).
    pub fn repay(env: Env, payer: Address, invoice_id: u64) -> (i128, i128) {
        payer.require_auth();
        let mut record: RepaymentRecord = env
            .storage()
            .instance()
            .get(&DataKey::Record(invoice_id))
            .expect("record not found");

        assert!(
            record.status == RepaymentStatus::Outstanding,
            "already repaid"
        );

        record.status = RepaymentStatus::Repaid;
        env.storage()
            .instance()
            .set(&DataKey::Record(invoice_id), &record);

        let investor_amount = record.principal + record.interest - record.fee;
        (investor_amount, record.fee)
    }

    pub fn get_record(env: Env, invoice_id: u64) -> RepaymentRecord {
        env.storage()
            .instance()
            .get(&DataKey::Record(invoice_id))
            .expect("record not found")
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    #[test]
    fn test_register_and_repay() {
        let env = Env::default();
        env.mock_all_auths();
        let id = env.register_contract(None, RepaymentContract);
        let client = RepaymentContractClient::new(&env, &id);

        let admin = Address::generate(&env);
        let investor = Address::generate(&env);
        let payer = Address::generate(&env);

        client.register(&admin, &1u64, &1000, &50, &investor);

        let record = client.get_record(&1u64);
        assert_eq!(record.principal, 1000);
        assert_eq!(record.fee, 20); // 2% of 1000
        assert_eq!(record.status, RepaymentStatus::Outstanding);

        let (investor_amt, fee) = client.repay(&payer, &1u64);
        assert_eq!(fee, 20);
        assert_eq!(investor_amt, 1030); // 1000 + 50 - 20

        let record = client.get_record(&1u64);
        assert_eq!(record.status, RepaymentStatus::Repaid);
    }

    #[test]
    #[should_panic(expected = "already repaid")]
    fn test_double_repay_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let id = env.register_contract(None, RepaymentContract);
        let client = RepaymentContractClient::new(&env, &id);

        let admin = Address::generate(&env);
        let investor = Address::generate(&env);
        let payer = Address::generate(&env);

        client.register(&admin, &2u64, &500, &25, &investor);
        client.repay(&payer, &2u64);
        client.repay(&payer, &2u64); // should panic
    }
}
