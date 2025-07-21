import React, { useState, useEffect } from "react";
import {
	Dialog,
	Portal,
	Button,
	TextInput,
	HelperText,
} from "react-native-paper";

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
		<Portal>
			<Dialog visible={visible} onDismiss={onClose}>
				<Dialog.Title>
					{initialName ? `Edit ${typeLabel}` : `Add ${typeLabel}`}
				</Dialog.Title>
				<Dialog.Content>
					<TextInput
						label={`${typeLabel} Name`}
						value={name}
						onChangeText={setName}
						autoFocus
						error={!!error}
						maxLength={50}
					/>
					<HelperText type="error" visible={!!error}>
						{error}
					</HelperText>
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

export default TypeFormDialog;
