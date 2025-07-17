import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import {
	Portal,
	Text,
	TextInput,
	Button,
	HelperText,
	RadioButton,
	useTheme,
	Dialog,
} from "react-native-paper";

interface CategoryFormModalProps {
	visible: boolean;
	onClose: () => void;
	onSubmit: (data: { name: string; transaction_type_id: number }) => void;
	transactionTypes: { id: number; name: string }[];
	initialCategory?: {
		id?: number;
		name: string;
		transaction_type_id: number;
	} | null;
}

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
	visible,
	onClose,
	onSubmit,
	transactionTypes,
	initialCategory,
}) => {
	const [name, setName] = useState("");
	const [transactionTypeId, setTransactionTypeId] = useState<number | null>(
		null
	);
	const [error, setError] = useState("");

	useEffect(() => {
		if (initialCategory) {
			setName(initialCategory.name);
			setTransactionTypeId(initialCategory.transaction_type_id);
		} else {
			setName("");
			setTransactionTypeId(transactionTypes[0]?.id ?? null);
		}
		setError("");
	}, [visible, initialCategory, transactionTypes]);

	const handleSave = () => {
		if (!name.trim()) {
			setError("Name is required");
			return;
		}
		if (!transactionTypeId) {
			setError("Type is required");
			return;
		}
		onSubmit({ name: name.trim(), transaction_type_id: transactionTypeId });
	};

	return (
		<Portal>
			<Dialog visible={visible} onDismiss={onClose}>
				<Dialog.Title>
					{initialCategory ? "Edit Category" : "Add Category"}
				</Dialog.Title>
				<Dialog.Content>
					<TextInput
						label="Name"
						value={name}
						onChangeText={setName}
						style={styles.input}
						autoFocus
					/>
					<HelperText type="error" visible={!!error}>
						{error}
					</HelperText>
					<Text variant="titleMedium" style={styles.label}>
						Type
					</Text>
					<RadioButton.Group
						onValueChange={(v) => setTransactionTypeId(Number(v))}
						value={transactionTypeId ? String(transactionTypeId) : ""}
					>
						{transactionTypes.map((type) => (
							<RadioButton.Item
								key={type.id}
								label={type.name}
								value={String(type.id)}
							/>
						))}
					</RadioButton.Group>
				</Dialog.Content>
				<Dialog.Actions>
					<Button onPress={onClose}>Cancel</Button>
					<Button mode="contained" onPress={handleSave}>
						Save
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
	label: {
		marginTop: 8,
		marginBottom: 4,
	},
});

export default CategoryFormModal;
