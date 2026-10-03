import React, { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import Sheet from "./ui/Sheet";
import { AmountField, SelectField, TextField } from "./ui/fields";
import { FormActions, useSheetSession, useSubmit } from "./ui/form";
import { getCurrencyPickerOptions } from "../constants/currencies";
import { Envelope } from "../types";
import { formatAmount } from "../utils/currency";
import { radius, spacing, useKTheme } from "../theme/theme";

export type EnvelopeFormValues = Pick<Envelope, "name" | "purpose"> &
	Partial<Pick<Envelope, "total_amount" | "current_balance" | "currency">>;

interface EnvelopeFormSheetProps {
	visible: boolean;
	onDismiss: () => void;
	envelope?: Envelope | null;
	defaultCurrency?: string;
	onSubmit: (values: EnvelopeFormValues) => Promise<void>;
}

const Body: React.FC<Omit<EnvelopeFormSheetProps, "visible">> = ({
	onDismiss,
	envelope,
	defaultCurrency = "RWF",
	onSubmit,
}) => {
	const theme = useKTheme();
	const editing = !!envelope;
	const [name, setName] = useState(envelope?.name ?? "");
	const [purpose, setPurpose] = useState(envelope?.purpose ?? "");
	const [currency, setCurrency] = useState<string | null>(envelope?.currency ?? defaultCurrency);
	const [total, setTotal] = useState("");
	const [balance, setBalance] = useState("");
	const [balanceTouched, setBalanceTouched] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const currencies = useMemo(getCurrencyPickerOptions, []);

	// A new envelope usually starts full — mirror the budget until the user edits the balance.
	const effectiveBalance = balanceTouched ? balance : total;

	const { submit, saving, error } = useSubmit(async () => {
		const e: Record<string, string> = {};
		if (name.trim().length < 3) e.name = "Use at least 3 characters";
		if (!editing) {
			if (!currency) e.currency = "Choose a currency";
			if (!total || isNaN(Number(total))) e.total = "Enter the amount to set aside";
			if (effectiveBalance === "" || isNaN(Number(effectiveBalance))) e.balance = "Enter the current balance";
			else if (Number(effectiveBalance) > Number(total)) e.balance = "Can't be more than the budget";
		}
		setErrors(e);
		if (Object.keys(e).length) return;
		await onSubmit(
			editing
				? { name: name.trim(), purpose: purpose.trim() }
				: {
						name: name.trim(),
						purpose: purpose.trim(),
						currency: currency!,
						total_amount: Number(total),
						current_balance: Number(effectiveBalance),
				  }
		);
	});

	return (
		<>
			<TextField label="Name" value={name} onChangeText={setName} error={errors.name} autoCapitalize="words" />
			{editing ? (
				<View style={[styles.locked, { backgroundColor: theme.colors.surfaceVariant }]}>
					<Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
						{`Budget ${formatAmount(envelope!.total_amount, envelope!.currency)} · ${formatAmount(envelope!.current_balance, envelope!.currency)} left. Use “Top up” to add money to this envelope.`}
					</Text>
				</View>
			) : (
				<>
					<SelectField label="Currency" value={currency} options={currencies} onChange={setCurrency} error={errors.currency} icon="cash-multiple" />
					<AmountField
						label="Budget"
						value={total}
						onChangeText={setTotal}
						currency={currency ?? "RWF"}
						error={errors.total}
						helper="How much you're setting aside for this purpose."
					/>
					<AmountField
						label="Available now"
						value={effectiveBalance}
						onChangeText={(v) => {
							setBalanceTouched(true);
							setBalance(v);
						}}
						currency={currency ?? "RWF"}
						error={errors.balance}
						helper="Lower it if part of the budget is already spent."
					/>
				</>
			)}
			<TextField label="Purpose (optional)" value={purpose} onChangeText={setPurpose} multiline />
			<FormActions
				onCancel={onDismiss}
				onSubmit={submit}
				saving={saving}
				error={error}
				submitLabel={editing ? "Save changes" : "Create envelope"}
			/>
		</>
	);
};

const EnvelopeFormSheet: React.FC<EnvelopeFormSheetProps> = (props) => {
	const session = useSheetSession(props.visible);
	return (
		<Sheet visible={props.visible} onDismiss={props.onDismiss} title={props.envelope ? "Edit envelope" : "New envelope"}>
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

export default EnvelopeFormSheet;
