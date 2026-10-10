# **🏦 Kounta: Liabilities (Loans and Debts)**

A liability is money you owe: a loan, or money you are keeping for someone. Receiving it and paying it back only move money between an account and the debt, so neither one changes net worth. Charges — interest, fees or penalties the lender adds — are what owing costs you, so they are the only part recorded as an expense.

## **⚙️ The three liability transactions**

| Event | Transaction | Effect |
| :---- | :---- | :---- |
| Money arrives (only when the liability is created) | **Transfer**, `liability_id` + `to_account_id` | Account ⬆️, liability `current_balance` ⬆️ and `total_amount` ⬆️. Net worth unchanged. |
| Charge added (interest, fee, penalty) | **Expense**, `liability_id`, **no account** — paid from the debt itself | Liability `current_balance` ⬆️ and `total_amount` ⬆️. Counts as an expense in the category you choose. Pays nothing; you pay it later with **Pay back**. |
| Pay back | **Transfer**, `liability_id` + `from_account_id` | Account ⬇️, liability `current_balance` ⬇️. Net worth unchanged. |

* `total_amount` is everything ever owed on the liability: the money received plus any charges. `current_balance` is the amount still owed.
* Money received for a liability is never Income, and paying it back is never an Expense.
* A payment can't be larger than `current_balance`. If you pay more than you owe, use **Add charge** on the liability for the extra first.
* Liabilities are only linked from their own screen: **Pay back** opens a payment, **Add charge** opens a charge with the liability locked; you choose the category (fresh installs include an "Interest & Charges" category you can use, rename or ignore — the app never looks it up by name). The general transaction form doesn't link liabilities, except for "Pay back a liability" under Transfer.
* The account and the liability must use the same currency.
* Any other combination is rejected. That includes Income linked to a liability, an Expense linked to a liability that also uses an account, and a liability transfer with zero or two accounts.

## **📝 Creating a liability**

* **With "Received into account":** you enter the *Total to repay* and the *Cash received*. The app saves three things in one step: the liability, a Transfer of the cash into the account, and a charge for *Total to repay − Cash received* in the category you pick on the form. The result is exactly what you typed; don't add a separate transfer for the same money. The charge is dated the day you create the loan, so fixed-fee loans (for example, quick bank loans) show their full cost from day one.
* **More money from the same lender** is a new liability, not an addition to an old one.
* **Without an account:** the liability is recorded as an opening balance only. Use this for debts that existed before you started tracking.
* **Charges added later** (credit-card interest, late fees, penalties): use **Add charge** on the liability. Payments stay plain transfers.
