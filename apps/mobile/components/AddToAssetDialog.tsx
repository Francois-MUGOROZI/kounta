import React, { useState, useEffect } from "react";
import { Button, HelperText } from "react-native-paper";
import AppDialog from "./AppDialog";
import AppNumberInput from "./AppNumberInput";
import { Asset } from "../types";

interface AddToAssetDialogProps {
	visible: boolean;
	onClose: () => void;
	onSubmit: (assetId: number, amount: number) => void;
	asset: Asset;
}

const AddToAssetDialog: React.FC<AddToAssetDialogProps> = ({
	visible,
	onClose,
	onSubmit,
	asset,
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
		onSubmit(asset.id, Number(amount));
	};

	return (
		<AppDialog
			visible={visible}
			onDismiss={onClose}
			title={`Add Value to ${asset.name}`}
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
				label={`Amount (${asset.currency})`}
				value={amount}
				onChangeText={setAmount}
				currency={asset.currency}
				error={error}
			/>
			<HelperText type="error" visible={!!error}>
				{error}
			</HelperText>
		</AppDialog>
	);
};

export default AddToAssetDialog;
