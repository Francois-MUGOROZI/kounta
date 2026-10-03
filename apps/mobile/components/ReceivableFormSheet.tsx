import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Switch, Text } from "react-native-paper";
import Sheet from "./ui/Sheet";
import { AmountField, DateField, SelectField, TextField } from "./ui/fields";
import { FormActions, useSheetSession, useSubmit } from "./ui/form";
import type { Option } from "./ui/Dropdown";
import { RECEIVABLE_TYPES } from "./ReceivableRow";
import { getCurrencyPickerOptions } from "../constants/currencies";
import { Entity, Receivable, ReceivableType } from "../types";
import { formatAmount } from "../utils/currency";
import { toDayKey } from "../utils/date";
import { radius, spacing, useKTheme } from "../theme/theme";

/* ───────────────────────────── Form ───────────────────────────── */

export interface ReceivableFormValues {
	entity_id: number;
	title: string;
	type: ReceivableType;
	currency: string;
	principal: number;
	interest_rate: number;
	requires_outflow: boolean;
	due_date: string | null;
	notes: string | null;
}

interface ReceivableFormSheetProps {
	visible: boolean;
	onDismiss: () => void;
	entities: Entity[];
	/** Present when editing. */
	receivable?: Receivable | null;
	/** Pre-selects the person/organisation for a new receivable. */
	presetEntityId?: number;
	/** Persist the values; throw to keep the sheet open with the error shown. */
	onSubmit: (values: ReceivableFormValues) => Promise<void>;
}

// Lending-like types usually start Pending until money is transferred out.
const LENDING_TYPES: ReceivableType[] = ["IOU", "Personal-Loan"];

const Body: React.FC<Omit<ReceivableFormSheetProps, "visible">> = ({
	onDismiss,
	entities,
	receivable,
	presetEntityId,
	onSubmit,
}) => {
	const theme = useKTheme();
	const editing = !!receivable;
	const [entityId, setEntityId] = useState<number | null>(
		receivable?.entity_id ?? presetEntityId ?? null
	);
	const [title, setTitle] = useState(receivable?.title ?? "");
	const [type, setType] = useState<ReceivableType | null>(receivable?.type ?? null);
	const [currency, setCurrency] = useState<string | null>(receivable?.currency ?? "RWF");
	const [principal, setPrincipal] = useState(receivable ? String(receivable.principal) : "");
	const [interest, setInterest] = useState(
		receivable && receivable.interest_rate ? String(receivable.interest_rate) : ""
	);
	const [requiresOutflow, setRequiresOutflow] = useState(!!receivable?.requires_outflow);
	const [dueDate, setDueDate] = useState(receivable?.due_date ? toDayKey(receivable.due_date) : "");
	const [notes, setNotes] = useState(receivable?.notes ?? "");
	const [errors, setErrors] = useState<Record<string, string>>({});

	const entityOptions = useMemo<Option<number>[]>(
		() =>
			[...entities]
				.sort((a, b) => a.name.localeCompare(b.name))
				.map((e) => ({
					value: e.id,
					label: e.name,
					description: e.is_individual ? "Person" : "Organisation",
					icon: e.is_individual ? "account-outline" : "domain",
				})),
		[entities]
	);
	const currencies = useMemo(getCurrencyPickerOptions, []);

	const changeType = (next: ReceivableType | null) => {
		setType(next);
		if (!editing && next) setRequiresOutflow(LENDING_TYPES.includes(next));
	};

	const { submit, saving, error } = useSubmit(async () => {
		const e: Record<string, string> = {};
		if (!entityId) e.entity = "Choose who owes you";
		if (!title.trim()) e.title = "Give it a short title";
		if (!type) e.type = "Choose a type";
		if (!editing) {
			if (!currency) e.currency = "Choose a currency";
			if (!principal || isNaN(Number(principal)) || Number(principal) <= 0)
				e.principal = "Enter an amount greater than zero";
		}
		if (interest && (isNaN(Number(interest)) || Number(interest) < 0))
			e.interest = "Enter a valid rate, e.g. 5";
		setErrors(e);
		if (Object.keys(e).length) return;
		await onSubmit({
			entity_id: entityId!,
			title: title.trim(),
			type: type!,
			// Currency, principal and the lending flag are fixed once created.
			currency: editing ? receivable!.currency : currency!,
			principal: editing ? receivable!.principal : Number(principal),
			interest_rate: Number(interest) || 0,
			requires_outflow: editing ? !!receivable!.requires_outflow : requiresOutflow,
			due_date: dueDate || null,
			notes: notes.trim() || null,
		});
	});

	return (
		<>
			<SelectField
				label="Who owes you"
				value={entityId}
				options={entityOptions}
				onChange={setEntityId}
				error={errors.entity}
				icon="account-outline"
				disabled={editing}
				helper={editing ? "The person can't change after creation." : undefined}
				emptyMessage="No people or organisations yet. Add one under More › Entities."
			/>
			<TextField label="Title" value={title} onChangeText={setTitle} error={errors.title} placeholder="e.g. Loan to Eric for school fees" />
			<SelectField label="Type" value={type} options={RECEIVABLE_TYPES} onChange={changeType} error={errors.type} icon="shape-outline" />

			{editing ? (
				<View style={[styles.locked, { backgroundColor: theme.colors.surfaceVariant }]}>
					<Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
						{`Principal ${formatAmount(receivable!.principal, receivable!.currency)} · ${
							receivable!.requires_outflow ? "funded by a lending transfer" : "already owed"
						}. These can't change once created.`}
					</Text>
				</View>
			) : (
				<>
					<SelectField label="Currency" value={currency} options={currencies} onChange={setCurrency} error={errors.currency} icon="cash-multiple" />
					<AmountField
						label="Principal"
						value={principal}
						onChangeText={setPrincipal}
						currency={currency ?? "RWF"}
						error={errors.principal}
					/>
					<Pressable
						onPress={() => setRequiresOutflow((v) => !v)}
						style={[styles.switchRow, { borderColor: theme.colors.outlineVariant }]}
						accessibilityRole="switch"
						accessibilityState={{ checked: requiresOutflow }}
					>
						<View style={{ flex: 1 }}>
							<Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
								{"I'm lending this money"}
							</Text>
							<Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
								{requiresOutflow
									? "Stays pending until you record the lending transfer from an account."
									: "Active right away — the money is already owed to you."}
							</Text>
						</View>
						<Switch value={requiresOutflow} onValueChange={setRequiresOutflow} />
					</Pressable>
				</>
			)}

			<TextField
				label="Interest rate % (optional)"
				value={interest}
				onChangeText={setInterest}
				keyboardType="decimal-pad"
				error={errors.interest}
			/>
			<DateField label="Due date (optional)" value={dueDate} onChange={setDueDate} style={{ marginBottom: dueDate ? spacing.xs : spacing.md }} />
			{dueDate ? (
				<Pressable onPress={() => setDueDate("")} style={styles.clear} accessibilityRole="button" hitSlop={8}>
					<Text variant="labelMedium" style={{ color: theme.colors.primary }}>
						Remove due date
					</Text>
				</Pressable>
			) : null}
			<TextField label="Notes (optional)" value={notes} onChangeText={setNotes} multiline />
			<FormActions
				onCancel={onDismiss}
				onSubmit={submit}
				saving={saving}
				error={error}
				submitLabel={editing ? "Save changes" : "Add receivable"}
			/>
		</>
	);
};

const ReceivableFormSheet: React.FC<ReceivableFormSheetProps> = (props) => {
	const session = useSheetSession(props.visible);
	return (
		<Sheet
			visible={props.visible}
			onDismiss={props.onDismiss}
			title={props.receivable ? "Edit receivable" : "New receivable"}
			subtitle={props.receivable ? undefined : "Money someone owes you"}
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
	switchRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.md,
		borderWidth: 1,
		borderRadius: 14,
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.md,
		marginBottom: spacing.md,
	},
	clear: {
		alignSelf: "flex-start",
		marginBottom: spacing.md,
		marginLeft: spacing.xs,
	},
});

export default ReceivableFormSheet;
