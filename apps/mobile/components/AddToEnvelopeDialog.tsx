import React, { useState, useEffect } from "react";
import { Button, HelperText } from "react-native-paper";
import AppDialog from "./AppDialog";
import AppNumberInput from "./AppNumberInput";
import { Envelope } from "@/types";

interface AddToEnvelopeDialogProps {
	visible: boolean;
	onClose: () => void;
	onSubmit: (envelopeId: number, amount: number) => void;
	envelope: Envelope;
}

const AddToEnvelopeDialog: React.FC<AddToEnvelopeDialogProps> = ({
	visible,
	onClose,
	onSubmit,
	envelope,
}) => {
	const [amount, setAmount] = useState("");
	const [error, setError] = useState("");

	useEffect(() => {
		if (visible) {
			setAmount("");
			setError("");
		}
	}, [visible]);

	const handleSave = () => {
		if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
			setError("Amount must be a positive number");
			return;
		}
		onSubmit(envelope.id, Number(amount));
	};

	return (
		<AppDialog
			visible={visible}
			onDismiss={onClose}
			title={`Add to ${envelope.name}`}
			actions={
				<>
					<Button onPress={onClose} style={{ marginRight: 8 }}>
						Cancel
					</Button>
					<Button mode="contained" onPress={handleSave}>
						Add
					</Button>
				</>
			}
		>
			<AppNumberInput
				label={`Amount (${envelope.currency})`}
				value={amount}
				onChangeText={setAmount}
				currency={envelope.currency}
				error={error}
			/>
			<HelperText type="error" visible={!!error}>
				{error}
			</HelperText>
		</AppDialog>
	);
};

export default AddToEnvelopeDialog;
