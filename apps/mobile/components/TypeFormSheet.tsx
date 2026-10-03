import React, { useState } from "react";
import Sheet from "./ui/Sheet";
import { TextField } from "./ui/fields";
import { FormActions, useSheetSession, useSubmit } from "./ui/form";

interface TypeFormSheetProps {
	visible: boolean;
	onDismiss: () => void;
	/** Singular noun shown in titles, e.g. "account type". */
	typeLabel: string;
	/** Present when editing. */
	initialName?: string;
	/** Persist the name; throw to keep the sheet open with the error shown. */
	onSubmit: (name: string) => Promise<void>;
}

const Body: React.FC<Omit<TypeFormSheetProps, "visible">> = ({
	onDismiss,
	typeLabel,
	initialName,
	onSubmit,
}) => {
	const [name, setName] = useState(initialName ?? "");
	const [nameError, setNameError] = useState<string | undefined>();

	const { submit, saving, error } = useSubmit(async () => {
		if (!name.trim()) {
			setNameError("Enter a name");
			return;
		}
		setNameError(undefined);
		await onSubmit(name.trim());
	});

	return (
		<>
			<TextField
				label="Name"
				value={name}
				onChangeText={setName}
				error={nameError}
				maxLength={50}
				autoCapitalize="words"
				autoFocus
			/>
			<FormActions
				onCancel={onDismiss}
				onSubmit={submit}
				saving={saving}
				error={error}
				submitLabel={initialName ? "Save changes" : `Add ${typeLabel}`}
			/>
		</>
	);
};

const TypeFormSheet: React.FC<TypeFormSheetProps> = (props) => {
	const session = useSheetSession(props.visible);
	return (
		<Sheet
			visible={props.visible}
			onDismiss={props.onDismiss}
			title={props.initialName ? `Edit ${props.typeLabel}` : `New ${props.typeLabel}`}
		>
			<Body key={session} {...props} />
		</Sheet>
	);
};

export default TypeFormSheet;
