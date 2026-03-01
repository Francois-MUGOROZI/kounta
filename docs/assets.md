# **📈 Kounta: Precise Asset Implementation Guide**

## **1\. The Core Asset Model**

This model tracks the **Cost Basis** (what you put in) vs. **Market Value**
(what it's worth now).

| Field             | Type   | Description                                                   |
| :---------------- | :----- | :------------------------------------------------------------ |
| initial_cost      | number | The first out-of-pocket cash payment.                         |
| contributions     | number | Total of all subsequent manual cash "top-ups."                |
| reinvestments     | number | Total of interest/dividends earned and kept inside the asset. |
| withdrawals       | number | Total value/principal taken back out to bank accounts.        |
| current_valuation | number | The "Market Reality"—the total sellable value today.          |

## **2\. Transaction Flow Logic**

All asset changes (except valuation) **MUST** be triggered by a Transaction.

### **A. Initial Acquisition 🟢**

- **Action:** Transfer (Bank Account ➡️ Asset)
- **Rule:** If Asset is new, set initial_cost \= Amount. Set current_valuation
  \= Amount.

### **B. Manual Top-up (Contribution) ➕**

- **Action:** Transfer (Bank Account ➡️ Asset)
- **Rule:** Increment contributions and current_valuation by Amount.

### **C. Reinvestment (Compounding) 🔄**

- **Action:** Income (Investment Income ➡️ Asset)
- **Rule:** Increment reinvestments and current_valuation by Amount. (Does not
  touch Bank balance).

### **D. Divestment (Sale/Withdrawal) 🔴**

- **Action:** Transfer (Asset ➡️ Bank Account)
- **Rule:** Increment withdrawals by Amount. Decrement current_valuation by
  Amount.

## **3\. The Valuation Event (Market Change) 📊**

This is a **Non-Transaction** event (Manual Update).

- **Action:** User updates "Current Value" manually.
- **Logic:** Updates current_valuation field only.
- **Result:** This creates "Unrealized Gain/Loss" (Market Appreciation).

## **4\. Derived Metrics (For UI Display)**

These are calculated on the fly, not stored in the DB:

- **Total Invested (Skin in the Game):** initial_cost \+ contributions
- **Total Cost Basis:** initial_cost \+ contributions \+ reinvestments \-
  withdrawals
- **Market Appreciation:** current_valuation \- Total Cost Basis
- **Total Wealth Gain:** current_valuation \- Total Invested

## **🛠️ Developer Implementation Checklist**

- \[ \] Update Asset schema in WatermelonDB.
- \[ \] Update TransactionRepository to detect if the target/source is an Asset.
- \[ \] Implement AssetService to recalculate sums whenever a linked transaction
  is saved/deleted.
- \[ \] Add "Valuation History" or a simple "Update Value" modal in the Asset
  Details view.
