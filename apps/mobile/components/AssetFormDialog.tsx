import React, { useState, useEffect } from "react";
import { Button, HelperText } from "react-native-paper";
import { Asset } from "../types";
import { getPopularCurrencyOptions } from "../constants/currencies";
import AppDialog from "./AppDialog";
import AppTextInput from "./AppTextInput";
import AppDropdown from "./AppDropdown";

interface AssetFormDialogProps {
	visible: boolean;
	onClose: () => void;
	onSubmit: (data: {
		name: string;
		asset_type_id: number;
		currency: string;
		notes?: string;
	}) => void;
	assetTypes: { id: number; name: string }[];
	initialAsset?: Asset | null;
}

const AssetFormDialog: React.FC<AssetFormDialogProps> = ({
	visible,
	onClose,
	onSubmit,
	assetTypes,
	initialAsset,
}) => {
	const isEditing = !!initialAsset;
	const [name, setName] = useState("");
	const [typeId, setTypeId] = useState<string>("");
	const [currency, setCurrency] = useState("");
	const [notes, setNotes] = useState("");
	const [error, setError] = useState("");

	useEffect(() => {
		if (initialAsset) {
			setName(initialAsset.name);
			setTypeId(initialAsset.asset_type_id.toString());
			setCurrency(initialAsset.currency);
			setNotes(initialAsset.notes || "");
		} else {
			setName("");
			setTypeId(assetTypes[0]?.id?.toString() ?? "");
			setCurrency("");
			setNotes("");
		}
		setError("");
	}, [visible, initialAsset, assetTypes]);

	const handleSave = () => {
		if (!name.trim()) {
			setError("Name is required");
			return;
		}
		if (!typeId) {
			setError("Type is required");
			return;
		}
		if (!isEditing && !currency.trim()) {
			setError("Currency is required");
			return;
		}
		onSubmit({
			name: name.trim(),
			asset_type_id: Number(typeId),
			currency: isEditing
				? initialAsset!.currency
				: currency.trim().toUpperCase(),
			notes: notes.trim() || undefined,
		});
	};

	return (
		<AppDialog
			visible={visible}
			onDismiss={onClose}
			title={initialAsset ? "Edit Asset" : "Add Asset"}
			actions={
				<>
					<Button onPress={onClose} style={{ marginRight: 8 }}>
						Cancel
					</Button>
					<Button mode="contained" onPress={handleSave}>
						Save
					</Button>
				</>
			}
		>
			<AppTextInput
				label="Name"
				value={name}
				onChangeText={setName}
				error={error && !name.trim() ? "Name is required" : undefined}
			/>
			<AppDropdown
				label="Asset Type"
				value={typeId}
				onSelect={(v) => setTypeId(v ?? "")}
				options={assetTypes.map((type) => ({
					label: type.name,
					value: type.id.toString(),
				}))}
				error={error && !typeId ? "Type is required" : undefined}
			/>
			{!isEditing && (
				<AppDropdown
					label="Currency"
					value={currency}
					onSelect={(v) => setCurrency(v ?? "")}
					options={getPopularCurrencyOptions()}
					error={error && !currency ? "Currency is required" : undefined}
				/>
			)}
			<AppTextInput
				label="Notes (optional)"
				value={notes}
				onChangeText={setNotes}
				multiline
			/>
			<HelperText type="error" visible={!!error}>
				{error}
			</HelperText>
		</AppDialog>
	);
};

export default AssetFormDialog;
