# Envelops Feature

## Overview

The envelops feature provides user with ability to create envelope for specific
usage in his financial app like emergency fund, savings, vacation, gifts and
more.

## How it works

1. User creates an envelope by specifying its name, initial amount, and purpose.
2. At any time, user allocates a certain amount of money to the envelope which
   increases the total amount and current balance.
3. When user creates a transaction of type expense, he gets a new field to
   select from which envelope the money should be taken and as a result, the
   envelope's balance is adjusted accordingly.
4. Users can view a summary of all envelopes, including their total amounts,
   current balances on the dashboard and envelope screen.

## Implementation Instructions

1. In the database.ts file, create a new table for envelopes with fields for id,
   name (unique), total_amount, current_balance, and purpose.
2. Create new repository for envelope with functions to create, update, delete,
   and retrieve envelopes use existing repositories as reference example.
3. Create hooks for envelope management referring to the existing hooks as
   examples.
4. Create new envelope screen, form, and components for managing envelopes in
   the UI. (use example of other screens as reference)
5. Update the transaction creation process to include envelope selection and
   adjust envelope balances accordingly.
6. Include envelope information in the dashboard summary.

## Guidelines to follow

1. Keep in mind that most of components and their usage can be found in existing
   implementations, you are not inventing anything new.
2. Follow the established coding conventions and patterns used in the codebase
   to ensure consistency and maintainability.
3. Where we need types, we add them to types.ts file first.
4. Always reach out to the existing implementations like accounts, transactions
   for usage examples.
