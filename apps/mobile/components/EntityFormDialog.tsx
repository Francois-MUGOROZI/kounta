import React, { useState, useEffect } from "react";
import { Button, HelperText, Switch, Text } from "react-native-paper";
import { View } from "react-native";
import AppDialog from "./AppDialog";
import AppTextInput from "./AppTextInput";
import { Entity } from "../types";

interface EntityFormDialogProps {
	visible: boolean;
	onClose: () => void;
	onSubmit: (data: {
		name: string;
		phone_number?: string;
		is_individual: boolean;
		id_number?: string;
		metadata?: string;
	}) => void;
	initialEntity?: Entity | null;
}

const EntityFormDialog: React.FC<EntityFormDialogProps> = ({
	visible,
	onClose,
	onSubmit,
	initialEntity,
}) => {
	const [name, setName] = useState("");
	const [phoneNumber, setPhoneNumber] = useState("");
	const [isIndividual, setIsIndividual] = useState(true);
	const [idNumber, setIdNumber] = useState("");
	const [metadata, setMetadata] = useState("");
	const [error, setError] = useState("");

	useEffect(() => {
		if (initialEntity) {
			setName(initialEntity.name);
			setPhoneNumber(initialEntity.phone_number || "");
			setIsIndividual(!!initialEntity.is_individual);
			setIdNumber(initialEntity.id_number || "");
			setMetadata(initialEntity.metadata || "");
		} else {
			setName("");
			setPhoneNumber("");
			setIsIndividual(true);
			setIdNumber("");
			setMetadata("");
		}
		setError("");
	}, [visible, initialEntity]);

	const handleSave = () => {
		if (!name.trim()) {
			setError("Name is required");
			return;
		}
		onSubmit({
			name: name.trim(),
			phone_number: phoneNumber.trim() || undefined,
			is_individual: isIndividual,
			id_number: idNumber.trim() || undefined,
			metadata: metadata.trim() || undefined,
		});
	};

	return (
		<AppDialog
			visible={visible}
			onDismiss={onClose}
			title={initialEntity ? "Edit Entity" : "Add Entity"}
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
			<AppTextInput
				label="Phone Number (optional)"
				value={phoneNumber}
				onChangeText={setPhoneNumber}
			/>
			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					marginVertical: 8,
				}}
			>
				<Text style={{ flex: 1 }}>Individual</Text>
				<Switch value={isIndividual} onValueChange={setIsIndividual} />
			</View>
			<AppTextInput
				label={isIndividual ? "ID Number (optional)" : "TIN / Reg. Number (optional)"}
				value={idNumber}
				onChangeText={setIdNumber}
			/>
			<AppTextInput
				label="Notes (optional)"
				value={metadata}
				onChangeText={setMetadata}
				multiline
			/>
			<HelperText type="error" visible={!!error}>
				{error}
			</HelperText>
		</AppDialog>
	);
};

export default EntityFormDialog;
