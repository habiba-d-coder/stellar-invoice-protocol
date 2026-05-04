#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

#[contracttype]
#[derive(Clone, Debug)]
pub struct ReputationRecord {
    pub total_invoices: u32,
    pub repaid_on_time: u32,
    pub defaults: u32,
    pub score: u32, // 0-100
}

#[contracttype]
pub enum DataKey {
    Record(Address),
}

#[contract]
pub struct ReputationContract;

#[contractimpl]
impl ReputationContract {
    /// Record a successful on-time repayment for an SME.
    pub fn record_repayment(env: Env, admin: Address, sme: Address) {
        admin.require_auth();
        let mut rec = Self::get_or_default(&env, &sme);
        rec.total_invoices += 1;
        rec.repaid_on_time += 1;
        rec.score = Self::compute_score(&rec);
        env.storage().instance().set(&DataKey::Record(sme), &rec);
    }

    /// Record a default for an SME.
    pub fn record_default(env: Env, admin: Address, sme: Address) {
        admin.require_auth();
        let mut rec = Self::get_or_default(&env, &sme);
        rec.total_invoices += 1;
        rec.defaults += 1;
        rec.score = Self::compute_score(&rec);
        env.storage().instance().set(&DataKey::Record(sme), &rec);
    }

    pub fn get_score(env: Env, sme: Address) -> u32 {
        Self::get_or_default(&env, &sme).score
    }

    pub fn get_record(env: Env, sme: Address) -> ReputationRecord {
        Self::get_or_default(&env, &sme)
    }

    fn get_or_default(env: &Env, sme: &Address) -> ReputationRecord {
        env.storage()
            .instance()
            .get(&DataKey::Record(sme.clone()))
            .unwrap_or(ReputationRecord {
                total_invoices: 0,
                repaid_on_time: 0,
                defaults: 0,
                score: 50, // neutral starting score
            })
    }

    /// Score = 50 base + repayment ratio bonus - default penalty (clamped 0-100)
    fn compute_score(rec: &ReputationRecord) -> u32 {
        if rec.total_invoices == 0 {
            return 50;
        }
        let repay_ratio = (rec.repaid_on_time * 100) / rec.total_invoices;
        let default_penalty = rec.defaults * 10;
        let raw = 50u32 + (repay_ratio / 2);
        if raw < default_penalty {
            0
        } else {
            (raw - default_penalty).min(100)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    #[test]
    fn test_default_score() {
        let env = Env::default();
        env.mock_all_auths();
        let id = env.register_contract(None, ReputationContract);
        let client = ReputationContractClient::new(&env, &id);

        let sme = Address::generate(&env);
        assert_eq!(client.get_score(&sme), 50);
    }

    #[test]
    fn test_repayment_increases_score() {
        let env = Env::default();
        env.mock_all_auths();
        let id = env.register_contract(None, ReputationContract);
        let client = ReputationContractClient::new(&env, &id);

        let admin = Address::generate(&env);
        let sme = Address::generate(&env);

        client.record_repayment(&admin, &sme);
        client.record_repayment(&admin, &sme);
        let score = client.get_score(&sme);
        assert!(score > 50, "score should increase after repayments");
    }

    #[test]
    fn test_default_decreases_score() {
        let env = Env::default();
        env.mock_all_auths();
        let id = env.register_contract(None, ReputationContract);
        let client = ReputationContractClient::new(&env, &id);

        let admin = Address::generate(&env);
        let sme = Address::generate(&env);

        client.record_repayment(&admin, &sme);
        client.record_default(&admin, &sme);
        let score = client.get_score(&sme);
        let record = client.get_record(&sme);
        assert_eq!(record.defaults, 1);
        assert!(score < 100);
    }
}
