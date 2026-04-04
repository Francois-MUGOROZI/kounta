# **🏛️ Kounta V2: Receivable** 

This document outlines the finalized logic for Entities, Receivables, and the Unified Transaction Engine.

## **👥 1\. The Entity Model (The "Who")**

Instead of separate tables for Debtors and Creditors, we use a unified **Entity** table. This acts as the "Counterparty" for every obligation. Entity can be referenced by liabilities, Receivables, etc. Consider this as an individual or organization.

| Field | Type | Description |
| :---- | :---- | :---- |
| id | UUID | Primary Key. |
| name | String | e.g., "Eric", "MTN Rwanda", "KCB Bank". |
| phone\_number | string | A phone number for contact |
| is\_individual | Boolean | Differentiates people from organizations. |
| metadata | JSON | Stores role-specific info (TIN, Phone, Address). |

**Decision:** A single entity can be both a debtor and a creditor, allowing for "Net Position" reporting.

## **📝 2\. The Receivable Model (The "I am Owed")**

Receivables are "Asset Accounts" representing money owed to you. They are separate from volatile Assets (Stocks) to protect calculation integrity.

| Field | Type | Description |
| :---- | :---- | :---- |
| id | UUID | Primary Key. |
| entity\_id | FK | Links to the **Entity**. |
| title | String | e.g., "January Salary", "Laptop Loan". |
| type | Enum | SALARY, PERSONAL-LOAN, REFUND, DEPOSIT, IOU, INTEREST. |
| principal | Decimal | The original amount lent/earned. |
| interest\_rate | Decimal  | Optional onetime(simple) interest rate on principle |
| requires\_outflow | Boolean | True if activation requires an outbound transfer (e.g., loans). |
| status | Enum | PENDING, ACTIVE, SETTLED, WRITTEN\_OFF. |
| due\_date | Date? | Expected payment date. |

## **📂 3\. The "Events" Model (The Manual Budget)**

We replaced automated monthly caps with **Event Containers**. This handles high-intent planning (Vacations, Weddings) without the clutter of daily budgeting.

* **Event:** A container with a title and date range.  
* **Event Item:** A "Paper List" of planned costs (e.g., "Catering: 500k").  
* **Tracking:** Transactions are optionally linked to an event\_item\_id to track Planned vs. Actual.

## **⚙️ 4\. The Unified Transaction Engine**

Kounta uses a **Point-to-Point** mapping logic. Transactions are the "Bridge" between different IDs.

### **🧩 Logic Matrix**

Receivables are by default transfer transaction types.

A transaction record is essentially a "Bridge" between entities. The logic is determined by which IDs are present.

**Scenario A: Lending Money (The Transfer Out)**

* `account_id`: `BANK_ID`  
* `receivable_id`: `LOAN_ID`  
* `amount`: `100,000`  
* **Result:** System sees two IDs. It knows money left the Bank and entered the Receivable. Net Worth \= No Change.

**Scenario B: Receiving Salary (The Repayment)**

* `account_id`: `BANK_ID`  
* `receivable_id`: `SALARY_JAN_ID`  
* `amount`: `500,000`  
* **Result:** Money leaves the Receivable (debt decreases) and enters the Bank. Net Worth \= No Change.

**Scenario C: Writing Off Bad Debt (The Leak)**

* `receivable_id`: `LOAN_ID`  
* `category_id`: `EXPENSE_BAD_DEBT`  
* `account_id`: `NULL`  
* **Result:** The system sees a Receivable ID but **no** Account ID. This is a "Value Adjustment." The debt decreases, but no cash enters your bank. Net Worth \= ⬇️.

Scenario D: A payment which is extra than the principle is considered interest and is recorded as income instead of a transfer

### 

### **🥊 5\. Key Financial Logic Decisions**

### **💰 The Salary Delay Solution**

When a salary is delayed:

1. **Creation:** Create a Receivable (Type: SALARY). This adds the amount to your Net Worth immediately.  
2. **Liquidation:** When the cash hits your bank, record a transaction linking account\_id and receivable\_id. Your cash goes up, the receivable closes.

### **📈 Handling Interest (The Profit Split)**

Interest is never a transfer; it is a "Value Creation."

* **Principal Portion:** Transaction links Account \+ Receivable (Transfer).  
* **Interest Portion:** Transaction links Account \+ Category: Interest (Income).

### **✂️ Partial Payments (Balance Decrement)**

For **Receivables**, partial payments are handled by:

1. Keeping the original receivable record intact.
2. Decrementing the `current_balance` by the amount paid.
3. Recording the payment in the `transactions` history.
4. Setting status to `SETTLED` only when `current_balance` reaches 0.

## **🛡️ Stress-Tested Principles**

1. **No Double Counting:** A transaction either moves money (Transfer) or creates/destroys it (Income/Expense). It cannot do both in one "leg."  
2. **Historical Integrity:** If a limit or rule changes, the history remains locked.  
3. **Net Worth Truth:** NW \= Cash \+ Assets \+ Receivables \- Liabilities.