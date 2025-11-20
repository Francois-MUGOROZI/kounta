import React, { useState, useEffect } from "react";
import {
	Button,
	HelperText,
} from "react-native-paper";
import AppDialog from "./AppDialog";
import AppTextInput from "./AppTextInput";

interface TypeFormDialogProps {
	visible: boolean;
	onClose: () => void;
	onSubmit: (name: string) => void;
	initialName?: string;
	typeLabel?: string;
}

const TypeFormDialog: React.FC<TypeFormDialogProps> = ({
	visible,
	onClose,
	onSubmit,
	initialName = "",
	typeLabel = "Type",
}) => {
	const [name, setName] = useState(initialName);
	const [error, setError] = useState("");

	useEffect(() => {
		setName(initialName);
		setError("");
	}, [visible, initialName]);

	const handleSave = () => {
		if (!name.trim()) {
			setError("Name is required");
			return;
		}
		onSubmit(name.trim());
	};

	return (
		<AppDialog
			visible={visible}
			onDismiss={onClose}
			title={initialName ? `Edit ${typeLabel}` : `Add ${typeLabel}`}
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
				label={`${typeLabel} Name`}
				value={name}
				onChangeText={setName}
				error={error}
				maxLength={50}
			/>
			<HelperText type="error" visible={!!error}>
				{error}
			</HelperText>
		</AppDialog>
	);
};

export default TypeFormDialog;
