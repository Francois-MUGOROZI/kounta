import React, { useState } from "react";
import Sheet from "./ui/Sheet";
import { AmountField } from "./ui/fields";
import { FormActions, useSheetSession, useSubmit } from "./ui/form";
import { Envelope } from "../types";
import { formatAmount } from "../utils/currency";

interface EnvelopeTopUpSheetProps {
	visible: boolean;
	onDismiss: () => void;
	envelope: Envelope | null;
	onSubmit: (envelope: Envelope, amount: number) => Promise<void>;
}

const Body: React.FC<Omit<EnvelopeTopUpSheetProps, "visible"> & { envelope: Envelope }> = ({
	onDismiss,
	envelope,
	onSubmit,
}) => {
	const [amount, setAmount] = useState("");
	const [fieldError, setFieldError] = useState<string | null>(null);
	const value = Number(amount);
	const { submit, saving, error } = useSubmit(async () => {
		if (!amount || isNaN(value) || value <= 0) {
			setFieldError("Enter an amount greater than zero");
			return;
		}
		setFieldError(null);
		await onSubmit(envelope, value);
	});
	return (
		<>
			<AmountField
				size="hero"
				label="Add to envelope"
				value={amount}
				onChangeText={setAmount}
				currency={envelope.currency}
				error={fieldError}
				helper={
					value > 0
						? `New balance ${formatAmount(envelope.current_balance + value, envelope.currency)} of ${formatAmount(envelope.total_amount + value, envelope.currency)}`
						: `Currently ${formatAmount(envelope.current_balance, envelope.currency)} left`
				}
				autoFocus
			/>
			<FormActions onCancel={onDismiss} onSubmit={submit} saving={saving} error={error} submitLabel="Top up" submitIcon="plus" />
		</>
	);
};

/** Adds money to an envelope's budget and balance. */
const EnvelopeTopUpSheet: React.FC<EnvelopeTopUpSheetProps> = (props) => {
	const session = useSheetSession(props.visible);
	return (
		<Sheet visible={props.visible} onDismiss={props.onDismiss} title={props.envelope ? `Top up ${props.envelope.name}` : "Top up"}>
			{props.envelope ? <Body key={session} {...props} envelope={props.envelope} /> : null}
		</Sheet>
	);
};

export default EnvelopeTopUpSheet;
