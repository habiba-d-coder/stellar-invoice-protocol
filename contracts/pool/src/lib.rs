#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Map};

#[contracttype]
pub enum DataKey {
    Balance(Address),
    TotalLiquidity,
    FundedInvoice(u64),
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct FundedInvoice {
    pub invoice_id: u64,
    pub funder: Address,
    pub amount: i128,
}

#[contract]
pub struct PoolContract;

#[contractimpl]
impl PoolContract {
    /// Investor deposits liquidity into the pool.
    pub fn deposit(env: Env, investor: Address, amount: i128) {
        investor.require_auth();
        assert!(amount > 0, "amount must be positive");

        let current: i128 = env
            .storage()
            .instance()
            .get(&DataKey::Balance(investor.clone()))
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::Balance(investor), &(current + amount));

        let total: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalLiquidity)
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::TotalLiquidity, &(total + amount));
    }

    /// Fund an invoice from pool liquidity.
    pub fn fund_invoice(env: Env, funder: Address, invoice_id: u64, amount: i128) {
        funder.require_auth();
        assert!(amount > 0, "amount must be positive");

        let balance: i128 = env
            .storage()
            .instance()
            .get(&DataKey::Balance(funder.clone()))
            .unwrap_or(0);
        assert!(balance >= amount, "insufficient balance");

        env.storage()
            .instance()
            .set(&DataKey::Balance(funder.clone()), &(balance - amount));

        let total: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalLiquidity)
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::TotalLiquidity, &(total - amount));

        env.storage().instance().set(
            &DataKey::FundedInvoice(invoice_id),
            &FundedInvoice { invoice_id, funder, amount },
        );
    }

    /// Withdraw available balance.
    pub fn withdraw(env: Env, investor: Address, amount: i128) {
        investor.require_auth();
        let balance: i128 = env
            .storage()
            .instance()
            .get(&DataKey::Balance(investor.clone()))
            .unwrap_or(0);
        assert!(balance >= amount, "insufficient balance");
        env.storage()
            .instance()
            .set(&DataKey::Balance(investor.clone()), &(balance - amount));

        let total: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalLiquidity)
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::TotalLiquidity, &(total - amount));
    }

    pub fn get_balance(env: Env, investor: Address) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::Balance(investor))
            .unwrap_or(0)
    }

    pub fn total_liquidity(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::TotalLiquidity)
            .unwrap_or(0)
    }

    pub fn get_funded_invoice(env: Env, invoice_id: u64) -> FundedInvoice {
        env.storage()
            .instance()
            .get(&DataKey::FundedInvoice(invoice_id))
            .expect("invoice not funded")
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    #[test]
    fn test_deposit_and_balance() {
        let env = Env::default();
        env.mock_all_auths();
        let id = env.register_contract(None, PoolContract);
        let client = PoolContractClient::new(&env, &id);

        let investor = Address::generate(&env);
        client.deposit(&investor, &1000);
        assert_eq!(client.get_balance(&investor), 1000);
        assert_eq!(client.total_liquidity(), 1000);
    }

    #[test]
    fn test_fund_invoice() {
        let env = Env::default();
        env.mock_all_auths();
        let id = env.register_contract(None, PoolContract);
        let client = PoolContractClient::new(&env, &id);

        let investor = Address::generate(&env);
        client.deposit(&investor, &2000);
        client.fund_invoice(&investor, &1u64, &500);

        assert_eq!(client.get_balance(&investor), 1500);
        assert_eq!(client.total_liquidity(), 1500);

        let fi = client.get_funded_invoice(&1u64);
        assert_eq!(fi.amount, 500);
    }

    #[test]
    fn test_withdraw() {
        let env = Env::default();
        env.mock_all_auths();
        let id = env.register_contract(None, PoolContract);
        let client = PoolContractClient::new(&env, &id);

        let investor = Address::generate(&env);
        client.deposit(&investor, &1000);
        client.withdraw(&investor, &400);
        assert_eq!(client.get_balance(&investor), 600);
    }

    #[test]
    #[should_panic(expected = "insufficient balance")]
    fn test_fund_invoice_insufficient() {
        let env = Env::default();
        env.mock_all_auths();
        let id = env.register_contract(None, PoolContract);
        let client = PoolContractClient::new(&env, &id);

        let investor = Address::generate(&env);
        client.deposit(&investor, &100);
        client.fund_invoice(&investor, &1u64, &500);
    }
}
