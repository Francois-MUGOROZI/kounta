import React, { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import Sheet from "./ui/Sheet";
import { AmountField, SelectField, TextField } from "./ui/fields";
import { FormActions, useSheetSession, useSubmit } from "./ui/form";
import { getCurrencyPickerOptions } from "../constants/currencies";
import { getLiabilityTypeIcon } from "../constants/typeIcons";
import { Entity, Liability, LiabilityType } from "../types";
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
}

interface LiabilityFormSheetProps {
	visible: boolean;
	onDismiss: () => void;
	liabilityTypes: LiabilityType[];
	entities: Entity[];
	/** Present when editing. */
	liability?: Liability | null;
	/** Persist the values; throw to keep the sheet open with the error shown. */
	onSubmit: (values: LiabilityFormValues) => Promise<void>;
}

const Body: React.FC<Omit<LiabilityFormSheetProps, "visible">> = ({
	onDismiss,
	liabilityTypes,
	entities,
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

	const { submit, saving, error } = useSubmit(async () => {
		const e: Record<string, string> = {};
		if (!name.trim()) e.name = "Give the liability a name";
		if (!typeId) e.type = "Choose a type";
		if (!editing) {
			if (!currency) e.currency = "Choose a currency";
			if (!total || isNaN(Number(total)) || Number(total) <= 0) e.total = "Enter the amount borrowed";
			// An empty balance means nothing has been repaid yet.
			const owed = balance === "" ? Number(total) : Number(balance);
			if (balance !== "" && isNaN(owed)) e.balance = "Enter a valid amount";
			else if (!e.total && owed > Number(total)) e.balance = "Can't be more than the amount borrowed";
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
				: balance === ""
				? Number(total)
				: Number(balance),
			notes: notes.trim() || null,
			entity_id: entityId,
		});
	});

	return (
		<>
			<TextField label="Name" value={name} onChangeText={setName} error={errors.name} autoCapitalize="words" />
			<SelectField label="Type" value={typeId} options={typeOptions} onChange={setTypeId} error={errors.type} icon="shape-outline" />
			{editing ? (
				<View style={[styles.locked, { backgroundColor: theme.colors.surfaceVariant }]}>
					<Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
						{`Borrowed ${formatAmount(liability!.total_amount, liability!.currency)} · ${formatAmount(liability!.current_balance, liability!.currency)} still owed. Amounts change through payments, not edits.`}
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
						label="Amount borrowed"
						value={total}
						onChangeText={setTotal}
						currency={currency ?? "RWF"}
						error={errors.total}
					/>
					<AmountField
						label="Still owed"
						value={balance}
						onChangeText={setBalance}
						currency={currency ?? "RWF"}
						error={errors.balance}
						helper="Leave empty if you haven't repaid anything yet."
					/>
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
