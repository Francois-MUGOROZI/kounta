import React, { useState, useEffect } from "react";
import { StyleSheet } from "react-native";
import {
	Portal,
	Dialog,
	TextInput,
	Button,
	HelperText,
} from "react-native-paper";
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
		<Portal>
			<Dialog visible={visible} onDismiss={onClose}>
				<Dialog.Title>Add to {envelope.name}</Dialog.Title>
				<Dialog.Content
					style={{ display: "flex", flexDirection: "column", gap: 2 }}
				>
					<TextInput
						label={`Amount (${envelope.currency})`}
						value={amount}
						onChangeText={setAmount}
						style={styles.input}
						keyboardType="numeric"
						autoFocus
					/>
					<HelperText type="error" visible={!!error}>
						{error}
					</HelperText>
				</Dialog.Content>
				<Dialog.Actions>
					<Button onPress={onClose}>Cancel</Button>
					<Button mode="contained" onPress={handleSave}>
						Add
					</Button>
				</Dialog.Actions>
			</Dialog>
		</Portal>
	);
};

const styles = StyleSheet.create({
	input: {
		marginBottom: 8,
	},
});

export default AddToEnvelopeDialog;
