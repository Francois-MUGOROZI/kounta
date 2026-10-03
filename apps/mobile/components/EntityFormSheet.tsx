import React, { useState } from "react";
import Sheet from "./ui/Sheet";
import { SegmentedControl, TextField } from "./ui/fields";
import { FormActions, useSheetSession, useSubmit } from "./ui/form";
import { Entity } from "../types";

/* ───────────── Form ───────────── */

export interface EntityFormValues {
	name: string;
	phone_number: string | null;
	is_individual: boolean;
	id_number: string | null;
	metadata: string | null;
}

interface EntityFormSheetProps {
	visible: boolean;
	onDismiss: () => void;
	/** Present when editing. */
	entity?: Entity | null;
	/** Persist the values; throw to keep the sheet open with the error shown. */
	onSubmit: (values: EntityFormValues) => Promise<void>;
}

type Kind = "person" | "organisation";

const Body: React.FC<Omit<EntityFormSheetProps, "visible">> = ({ onDismiss, entity, onSubmit }) => {
	const editing = !!entity;
	const [kind, setKind] = useState<Kind>(entity && !entity.is_individual ? "organisation" : "person");
	const [name, setName] = useState(entity?.name ?? "");
	const [phone, setPhone] = useState(entity?.phone_number ?? "");
	const [idNumber, setIdNumber] = useState(entity?.id_number ?? "");
	const [notes, setNotes] = useState(entity?.metadata ?? "");
	const [nameError, setNameError] = useState<string | null>(null);

	const { submit, saving, error } = useSubmit(async () => {
		if (!name.trim()) {
			setNameError("Enter a name");
			return;
		}
		setNameError(null);
		await onSubmit({
			name: name.trim(),
			phone_number: phone.trim() || null,
			is_individual: kind === "person",
			id_number: idNumber.trim() || null,
			metadata: notes.trim() || null,
		});
	});

	return (
		<>
			<SegmentedControl<Kind>
				value={kind}
				onChange={setKind}
				segments={[
					{ value: "person", label: "Person", icon: "account-outline" },
					{ value: "organisation", label: "Organisation", icon: "domain" },
				]}
			/>
			<TextField
				label={kind === "person" ? "Full name" : "Organisation name"}
				value={name}
				onChangeText={setName}
				error={nameError}
				autoCapitalize="words"
			/>
			<TextField
				label="Phone number (optional)"
				value={phone}
				onChangeText={setPhone}
				keyboardType="phone-pad"
				autoCapitalize="none"
			/>
			<TextField
				label={kind === "person" ? "ID number (optional)" : "TIN / registration number (optional)"}
				value={idNumber}
				onChangeText={setIdNumber}
				autoCapitalize="characters"
			/>
			<TextField label="Notes (optional)" value={notes} onChangeText={setNotes} multiline />
			<FormActions
				onCancel={onDismiss}
				onSubmit={submit}
				saving={saving}
				error={error}
				submitLabel={editing ? "Save changes" : kind === "person" ? "Add person" : "Add organisation"}
			/>
		</>
	);
};

const EntityFormSheet: React.FC<EntityFormSheetProps> = (props) => {
	const session = useSheetSession(props.visible);
	return (
		<Sheet
			visible={props.visible}
			onDismiss={props.onDismiss}
			title={props.entity ? "Edit details" : "New person or organisation"}
		>
			<Body key={session} {...props} />
		</Sheet>
	);
};

export default EntityFormSheet;
