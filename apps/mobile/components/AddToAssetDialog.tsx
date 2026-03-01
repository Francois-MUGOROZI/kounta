import React, { useState, useEffect } from "react";
import { Button, HelperText } from "react-native-paper";
import AppDialog from "./AppDialog";
import AppNumberInput from "./AppNumberInput";
import { Asset } from "../types";

interface UpdateValuationDialogProps {
	visible: boolean;
	onClose: () => void;
	onSubmit: (assetId: number, newValuation: number) => void;
	asset: Asset;
}

const AddToAssetDialog: React.FC<UpdateValuationDialogProps> = ({
	visible,
	onClose,
	onSubmit,
	asset,
}) => {
	const [valuation, setValuation] = useState("");
	const [error, setError] = useState("");

	useEffect(() => {
		if (visible) {
			setValuation(asset.current_valuation.toString());
			setError("");
		}
	}, [visible, asset.current_valuation]);

	const handleSave = () => {
		if (!valuation || isNaN(Number(valuation)) || Number(valuation) < 0) {
			setError("Valuation must be a non-negative number");
			return;
		}
		onSubmit(asset.id, Number(valuation));
	};

	return (
		<AppDialog
			visible={visible}
			onDismiss={onClose}
			title={`Update Valuation — ${asset.name}`}
			actions={
				<>
					<Button onPress={onClose} style={{ marginRight: 8 }}>
						Cancel
					</Button>
					<Button mode="contained" onPress={handleSave}>
						Update
					</Button>
				</>
			}
		>
			<AppNumberInput
				label={`Current Market Value (${asset.currency})`}
				value={valuation}
				onChangeText={setValuation}
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
