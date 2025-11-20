import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import {
	Text,
	Button,
	HelperText,
	RadioButton,
} from "react-native-paper";
import AppDialog from "./AppDialog";
import AppTextInput from "./AppTextInput";

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
		<AppDialog
			visible={visible}
			onDismiss={onClose}
			title={initialCategory ? "Edit Category" : "Add Category"}
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
			<View>
				<AppTextInput
					label="Name"
					value={name}
					onChangeText={setName}
					error={error && !name.trim() ? "Name is required" : undefined}
				/>
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
							style={{ paddingHorizontal: 0 }}
						/>
					))}
				</RadioButton.Group>
				<HelperText type="error" visible={!!error && !transactionTypeId}>
					{error}
				</HelperText>
			</View>
		</AppDialog>
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
