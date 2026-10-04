import React, { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import Sheet from "./ui/Sheet";
import { AmountField, SelectField, TextField } from "./ui/fields";
import { FormActions, useSheetSession, useSubmit } from "./ui/form";
import { getCurrencyPickerOptions } from "../constants/currencies";
import { getLiabilityTypeIcon } from "../constants/typeIcons";
import { Account, Category, Entity, Liability, LiabilityType } from "../types";
import { getCategoryIcon } from "../constants/categoryIcons";
import { formatAmount } from "../utils/currency";
import { radius, spacing, useKTheme } from "../theme/theme";

export interface LiabilityFormValues {
	name: string;
	liability_type_id: number;
	currency: string;
	total_amount: number;
	current_balance: number;
	/** null clears existing notes. */
	notes: string | null;
	entity_id: number | null;
	/** New liability only: the account the loan cash went into, and how much arrived. */
	account_id?: number | null;
	cash_received?: number | null;
	/** Expense category for what's owed above the cash received. */
	charge_category_id?: number | null;
}

interface LiabilityFormSheetProps {
	visible: boolean;
	onDismiss: () => void;
	liabilityTypes: LiabilityType[];
	entities: Entity[];
	/** Accounts the loan can be received into (new liabilities only). */
	accounts?: Account[];
	/** Expense categories the charge (total to repay − cash received) can use. */
	expenseCategories?: Category[];
	/** Present when editing. */
	liability?: Liability | null;
	/** Persist the values; throw to keep the sheet open with the error shown. */
	onSubmit: (values: LiabilityFormValues) => Promise<void>;
}

const Body: React.FC<Omit<LiabilityFormSheetProps, "visible">> = ({
	onDismiss,
	liabilityTypes,
	entities,
	accounts = [],
	expenseCategories = [],
	liability,
	onSubmit,
}) => {
	const theme = useKTheme();
	const editing = !!liability;
	const [name, setName] = useState(liability?.name ?? "");
	const [typeId, setTypeId] = useState<number | null>(
		liability?.liability_type_id ?? liabilityTypes[0]?.id ?? null
	);
	const [currency, setCurrency] = useState<string | null>(liability?.currency ?? "RWF");
	const [total, setTotal] = useState(liability ? String(liability.total_amount) : "");
	const [balance, setBalance] = useState(liability ? String(liability.current_balance) : "");
	const [entityId, setEntityId] = useState<number | null>(liability?.entity_id ?? null);
	const [notes, setNotes] = useState(liability?.notes ?? "");
	const [accountId, setAccountId] = useState<number | null>(null);
	const [cash, setCash] = useState("");
	const [chargeCategoryId, setChargeCategoryId] = useState<number | null>(null);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const typeOptions = useMemo(
		() => liabilityTypes.map((t) => ({ value: t.id, label: t.name, icon: getLiabilityTypeIcon(t.name) })),
		[liabilityTypes]
	);
	const entityOptions = useMemo(
		() =>
			[...entities]
				.sort((a, b) => a.name.localeCompare(b.name))
				.map((e) => ({
					value: e.id,
					label: e.name,
					icon: e.is_individual ? ("account-outline" as const) : ("domain" as const),
				})),
		[entities]
	);
	const currencies = useMemo(getCurrencyPickerOptions, []);
	const accountOptions = useMemo(
		() =>
			accounts
				.filter((a) => a.currency === currency)
				.map((a) => ({
					value: a.id,
					label: a.name,
					trailing: formatAmount(a.current_balance, a.currency),
					icon: "wallet-outline" as const,
				})),
		[accounts, currency]
	);
	const interest = accountId && Number(total) > Number(cash) && Number(cash) > 0 ? Number(total) - Number(cash) : 0;
	const categoryOptions = useMemo(
		() =>
			[...expenseCategories]
				.sort((a, b) => a.name.localeCompare(b.name))
				.map((c) => ({ value: c.id, label: c.name, icon: getCategoryIcon(c.name, "expense") })),
		[expenseCategories]
	);

	const changeCurrency = (next: string | null) => {
		setCurrency(next);
		// The loan account must be in the liability's currency.
		setAccountId(null);
	};

	const { submit, saving, error } = useSubmit(async () => {
		const e: Record<string, string> = {};
		if (!name.trim()) e.name = "Give the liability a name";
		if (!typeId) e.type = "Choose a type";
		if (!editing) {
			if (!currency) e.currency = "Choose a currency";
			if (!total || isNaN(Number(total)) || Number(total) <= 0) e.total = "Enter the total to repay";
			if (accountId) {
				if (!cash || isNaN(Number(cash)) || Number(cash) <= 0) e.cash = "Enter the cash you received";
				else if (!e.total && Number(cash) > Number(total)) e.cash = "Can't be more than the total to repay";
				else if (interest > 0 && !chargeCategoryId) e.chargeCategory = "Choose a category for the extra";
			} else {
				// An empty balance means nothing has been repaid yet.
				const owed = balance === "" ? Number(total) : Number(balance);
				if (balance !== "" && isNaN(owed)) e.balance = "Enter a valid amount";
				else if (!e.total && owed > Number(total)) e.balance = "Can't be more than the total to repay";
			}
		}
		setErrors(e);
		if (Object.keys(e).length) return;
		await onSubmit({
			name: name.trim(),
			liability_type_id: typeId!,
			currency: editing ? liability!.currency : currency!,
			total_amount: editing ? liability!.total_amount : Number(total),
			current_balance: editing
				? liability!.current_balance
				: balance === "" || accountId
				? Number(total)
				: Number(balance),
			notes: notes.trim() || null,
			entity_id: entityId,
			...(editing
				? {}
				: {
						account_id: accountId,
						cash_received: accountId ? Number(cash) : null,
						charge_category_id: interest > 0 ? chargeCategoryId : null,
					}),
		});
	});

	return (
		<>
			<TextField label="Name" value={name} onChangeText={setName} error={errors.name} autoCapitalize="words" />
			<SelectField label="Type" value={typeId} options={typeOptions} onChange={setTypeId} error={errors.type} icon="shape-outline" />
			{editing ? (
				<View style={[styles.locked, { backgroundColor: theme.colors.surfaceVariant }]}>
					<Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
						{`Total to repay ${formatAmount(liability!.total_amount, liability!.currency)} · ${formatAmount(liability!.current_balance, liability!.currency)} still owed. Amounts change through payments, not edits.`}
					</Text>
				</View>
			) : (
				<>
					<SelectField
						label="Currency"
						value={currency}
						options={currencies}
						onChange={changeCurrency}
						error={errors.currency}
						icon="cash-multiple"
					/>
					<AmountField
						label="Total to repay"
						value={total}
						onChangeText={setTotal}
						currency={currency ?? "RWF"}
						error={errors.total}
						helper="Everything you owe, including interest and fees."
					/>
					<SelectField
						label="Received into account (optional)"
						value={accountId}
						options={accountOptions}
						onChange={setAccountId}
						icon="wallet-plus-outline"
						clearable
						helper={accountId ? undefined : "Pick the account the loan money went into, if any."}
						emptyMessage={`No ${currency ?? ""} accounts yet.`}
					/>
					{accountId ? (
						<>
							<AmountField
								label="Cash received"
								value={cash}
								onChangeText={setCash}
								currency={currency ?? "RWF"}
								error={errors.cash}
								helper={
									interest > 0
										? `The extra ${formatAmount(interest, currency ?? "RWF")} is recorded as a charge on this liability.`
										: "The amount that actually reached the account."
								}
							/>
							{interest > 0 ? (
								<SelectField
									label="Charge category"
									value={chargeCategoryId}
									options={categoryOptions}
									onChange={setChargeCategoryId}
									icon="shape-outline"
									error={errors.chargeCategory}
									helper="Interest, fees or anything else owed above the cash received."
									emptyMessage="No expense categories yet."
								/>
							) : null}
						</>
					) : (
						<AmountField
							label="Still owed"
							value={balance}
							onChangeText={setBalance}
							currency={currency ?? "RWF"}
							error={errors.balance}
							helper="Leave empty if you haven't repaid anything yet."
						/>
					)}
				</>
			)}
			<SelectField
				label="Owed to (optional)"
				value={entityId}
				options={entityOptions}
				onChange={setEntityId}
				icon="account-outline"
				clearable
				emptyMessage="No people or organisations yet. Add them under More › Entities."
			/>
			<TextField label="Notes (optional)" value={notes} onChangeText={setNotes} multiline />
			<FormActions
				onCancel={onDismiss}
				onSubmit={submit}
				saving={saving}
				error={error}
				submitLabel={editing ? "Save changes" : "Add liability"}
			/>
		</>
	);
};

const LiabilityFormSheet: React.FC<LiabilityFormSheetProps> = (props) => {
	const session = useSheetSession(props.visible);
	return (
		<Sheet
			visible={props.visible}
			onDismiss={props.onDismiss}
			title={props.liability ? "Edit liability" : "New liability"}
		>
			<Body key={session} {...props} />
		</Sheet>
	);
};

const styles = StyleSheet.create({
	locked: {
		padding: spacing.md,
		borderRadius: radius.md,
		marginBottom: spacing.md,
	},
});

export default LiabilityFormSheet;
