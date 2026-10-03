import React, { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import Sheet from "./ui/Sheet";
import { AmountField, SelectField, TextField } from "./ui/fields";
import { FormActions, useSheetSession, useSubmit } from "./ui/form";
import { getCurrencyPickerOptions } from "../constants/currencies";
import { getAccountTypeIcon } from "../constants/typeIcons";
import { Account, AccountType } from "../types";
import { formatAmount } from "../utils/currency";
import { radius, spacing, useKTheme } from "../theme/theme";

export interface AccountFormValues {
	name: string;
	account_number?: string;
	account_type_id: number;
	currency: string;
	opening_balance: number;
}

interface AccountFormSheetProps {
	visible: boolean;
	onDismiss: () => void;
	accountTypes: AccountType[];
	/** Present when editing. */
	account?: Account | null;
	/** Persist the values; throw to keep the sheet open with the error shown. */
	onSubmit: (values: AccountFormValues) => Promise<void>;
}

const Body: React.FC<Omit<AccountFormSheetProps, "visible">> = ({
	onDismiss,
	accountTypes,
	account,
	onSubmit,
}) => {
	const theme = useKTheme();
	const editing = !!account;
	const [name, setName] = useState(account?.name ?? "");
	const [number, setNumber] = useState(account?.account_number ?? "");
	const [typeId, setTypeId] = useState<number | null>(account?.account_type_id ?? accountTypes[0]?.id ?? null);
	const [currency, setCurrency] = useState<string | null>(account?.currency ?? "RWF");
	const [opening, setOpening] = useState(account ? String(account.opening_balance) : "");
	const [errors, setErrors] = useState<Record<string, string>>({});

	const typeOptions = useMemo(
		() => accountTypes.map((t) => ({ value: t.id, label: t.name, icon: getAccountTypeIcon(t.name) })),
		[accountTypes]
	);
	const currencies = useMemo(getCurrencyPickerOptions, []);

	const { submit, saving, error } = useSubmit(async () => {
		const e: Record<string, string> = {};
		if (!name.trim()) e.name = "Give the account a name";
		if (!typeId) e.type = "Choose a type";
		if (!editing && !currency) e.currency = "Choose a currency";
		if (!editing && opening !== "" && isNaN(Number(opening))) e.opening = "Enter a valid amount";
		setErrors(e);
		if (Object.keys(e).length) return;
		await onSubmit({
			name: name.trim(),
			account_number: number.trim() || undefined,
			account_type_id: typeId!,
			currency: editing ? account!.currency : currency!,
			opening_balance: editing ? account!.opening_balance : Number(opening || 0),
		});
	});

	return (
		<>
			<TextField label="Account name" value={name} onChangeText={setName} error={errors.name} autoCapitalize="words" />
			<SelectField label="Type" value={typeId} options={typeOptions} onChange={setTypeId} error={errors.type} icon="shape-outline" />
			<TextField
				label="Account number (optional)"
				value={number}
				onChangeText={setNumber}
				keyboardType="default"
				autoCapitalize="none"
			/>
			{editing ? (
				<View style={[styles.locked, { backgroundColor: theme.colors.surfaceVariant }]}>
					<Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
						{`Currency ${account!.currency} · opening balance ${formatAmount(account!.opening_balance, account!.currency)}. These can't change once an account has history.`}
					</Text>
				</View>
			) : (
				<>
					<SelectField
						label="Currency"
						value={currency}
						options={currencies}
						onChange={setCurrency}
						error={errors.currency}
						icon="cash-multiple"
					/>
					<AmountField
						label="Opening balance"
						value={opening}
						onChangeText={setOpening}
						currency={currency ?? "RWF"}
						error={errors.opening}
						helper="What's in the account today. Leave empty for zero."
					/>
				</>
			)}
			<FormActions
				onCancel={onDismiss}
				onSubmit={submit}
				saving={saving}
				error={error}
				submitLabel={editing ? "Save changes" : "Add account"}
			/>
		</>
	);
};

const AccountFormSheet: React.FC<AccountFormSheetProps> = (props) => {
	const session = useSheetSession(props.visible);
	return (
		<Sheet
			visible={props.visible}
			onDismiss={props.onDismiss}
			title={props.account ? "Edit account" : "New account"}
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

export default AccountFormSheet;
