import React, { useMemo, useState } from "react";
import Sheet from "./ui/Sheet";
import { AmountField, SelectField } from "./ui/fields";
import { FormActions, useSheetSession, useSubmit } from "./ui/form";
import { Envelope } from "../types";
import { formatAmount } from "../utils/currency";

interface EnvelopeMoveSheetProps {
	visible: boolean;
	onDismiss: () => void;
	envelope: Envelope | null;
	/** Envelopes that can receive the money (same currency, not the source). */
	targets: Envelope[];
	onSubmit: (from: Envelope, to: Envelope, amount: number) => Promise<void>;
}

const Body: React.FC<Omit<EnvelopeMoveSheetProps, "visible"> & { envelope: Envelope }> = ({
	onDismiss,
	envelope,
	targets,
	onSubmit,
}) => {
	const [amount, setAmount] = useState("");
	const [targetId, setTargetId] = useState<number | null>(targets.length === 1 ? targets[0].id : null);
	const [errors, setErrors] = useState<{ amount?: string; target?: string }>({});
	const value = Number(amount);
	const available = Math.max(envelope.current_balance, 0);
	const target = targets.find((t) => t.id === targetId) ?? null;
	const options = useMemo(
		() =>
			targets.map((t) => ({
				value: t.id,
				label: t.name,
				trailing: formatAmount(t.current_balance, t.currency),
			})),
		[targets]
	);

	const { submit, saving, error } = useSubmit(async () => {
		const next: typeof errors = {};
		if (!amount || isNaN(value) || value <= 0) next.amount = "Enter an amount greater than zero";
		else if (value > available) next.amount = `Only ${formatAmount(available, envelope.currency)} available`;
		if (!target) next.target = "Choose an envelope";
		setErrors(next);
		if (next.amount || next.target) return;
		await onSubmit(envelope, target!, value);
	});

	const valid = value > 0 && value <= available;
	const helper = valid
		? `${envelope.name} ${formatAmount(envelope.current_balance, envelope.currency)} → ${formatAmount(envelope.current_balance - value, envelope.currency)}` +
			(target
				? ` · ${target.name} ${formatAmount(target.current_balance, target.currency)} → ${formatAmount(target.current_balance + value, target.currency)}`
				: "")
		: `${formatAmount(available, envelope.currency)} available to move`;

	return (
		<>
			<AmountField
				size="hero"
				label="Amount to move"
				value={amount}
				onChangeText={(text) => {
					setAmount(text);
					setErrors((e) => ({ ...e, amount: undefined }));
				}}
				currency={envelope.currency}
				error={errors.amount}
				helper={helper}
				autoFocus
			/>
			<SelectField
				label="To envelope"
				value={targetId}
				options={options}
				onChange={(id) => {
					setTargetId(id);
					setErrors((e) => ({ ...e, target: undefined }));
				}}
				icon="email-outline"
				error={errors.target}
			/>
			<FormActions
				onCancel={onDismiss}
				onSubmit={submit}
				saving={saving}
				error={error}
				submitLabel="Move"
				submitIcon="swap-horizontal"
			/>
		</>
	);
};

/** Moves available money from one envelope to another in the same currency. */
const EnvelopeMoveSheet: React.FC<EnvelopeMoveSheetProps> = (props) => {
	const session = useSheetSession(props.visible);
	return (
		<Sheet
			visible={props.visible}
			onDismiss={props.onDismiss}
			title={props.envelope ? `Move from ${props.envelope.name}` : "Move money"}
		>
			{props.envelope ? <Body key={session} {...props} envelope={props.envelope} /> : null}
		</Sheet>
	);
};

export default EnvelopeMoveSheet;
