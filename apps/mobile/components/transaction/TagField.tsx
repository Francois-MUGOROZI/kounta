import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { TextField } from "../ui/fields";
import type { IconName } from "../ui/icons";
import { radius, spacing, useKTheme } from "../../theme/theme";
import { normalizeTagName } from "../../repositories/TagRepository";

const MAX_SUGGESTIONS = 6;
const MAX_LENGTH = 30;

const has = (list: string[], name: string) => list.some((n) => n.toLowerCase() === name.toLowerCase());

interface TagFieldProps {
	value: string[];
	onChange: (tags: string[]) => void;
	/** Existing tag names, most used first. */
	suggestions: string[];
	/** Names a tag can't take, e.g. category names — tags add to a category, not repeat it. */
	reserved: string[];
}

const TagChip: React.FC<{
	label: string;
	icon: IconName;
	selected?: boolean;
	onPress: () => void;
	accessibilityLabel: string;
}> = ({ label, icon, selected, onPress, accessibilityLabel }) => {
	const theme = useKTheme();
	const fg = selected ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant;
	return (
		<Pressable
			onPress={onPress}
			accessibilityRole="button"
			accessibilityLabel={accessibilityLabel}
			style={[
				styles.chip,
				{ backgroundColor: selected ? theme.colors.primaryContainer : theme.colors.surfaceVariant },
			]}
		>
			{selected ? null : <MaterialCommunityIcons name={icon} size={14} color={fg} />}
			<Text variant="labelMedium" style={{ color: fg }} numberOfLines={1}>
				{label}
			</Text>
			{selected ? <MaterialCommunityIcons name={icon} size={14} color={fg} /> : null}
		</Pressable>
	);
};

/**
 * Optional tags: pick from ones already used or type new ones (return key or
 * comma adds). Suggestions sit above the input so the keyboard doesn't hide them.
 */
const TagField: React.FC<TagFieldProps> = ({ value, onChange, suggestions, reserved }) => {
	const [text, setText] = useState("");
	const [error, setError] = useState<string | null>(null);

	// Adds the given names, skipping blanks, duplicates and category names.
	const add = (raws: string[], rest = "") => {
		const next = [...value];
		let blocked: string | null = null;
		for (const raw of raws) {
			const name = normalizeTagName(raw);
			if (!name || has(next, name)) continue;
			if (has(reserved, name)) {
				blocked = name;
				continue;
			}
			// Reuse an existing tag's spelling so "Online" and "online" stay one tag.
			next.push(suggestions.find((n) => n.toLowerCase() === name.toLowerCase()) ?? name);
		}
		if (next.length !== value.length) onChange(next);
		setError(blocked ? `"${blocked}" is already a category — tags add detail to a category.` : null);
		setText(blocked && !rest ? blocked : rest);
	};

	const changeText = (next: string) => {
		setError(null);
		if (!next.includes(",")) {
			setText(next);
			return;
		}
		// A comma ends a tag: add everything before the last one.
		const parts = next.split(",");
		const rest = parts.pop() ?? "";
		add(parts, rest);
	};

	const typed = normalizeTagName(text);
	const matches = useMemo(() => {
		const q = typed.toLowerCase();
		return suggestions
			.filter((n) => !has(value, n) && (!q || n.toLowerCase().includes(q)))
			.slice(0, MAX_SUGGESTIONS);
	}, [suggestions, value, typed]);
	const canCreate = !!typed && !has(suggestions, typed) && !has(value, typed) && !has(reserved, typed);

	return (
		<View style={styles.wrap}>
			{value.length > 0 ? (
				<View style={[styles.row, styles.selected]}>
					{value.map((name) => (
						<TagChip
							key={name}
							label={name}
							icon="close"
							selected
							onPress={() => onChange(value.filter((n) => n !== name))}
							accessibilityLabel={`Remove tag ${name}`}
						/>
					))}
				</View>
			) : null}
			{matches.length > 0 || canCreate ? (
				<View style={[styles.row, styles.suggestions]}>
					{canCreate ? (
						<TagChip label={`Add "${typed}"`} icon="plus" onPress={() => add([typed])} accessibilityLabel={`Add new tag ${typed}`} />
					) : null}
					{matches.map((name) => (
						<TagChip key={name} label={name} icon="tag-outline" onPress={() => add([name])} accessibilityLabel={`Add tag ${name}`} />
					))}
				</View>
			) : null}
			<TextField
				label="Tags (optional)"
				value={text}
				onChangeText={changeText}
				onSubmitEditing={() => add([text])}
				left="tag-outline"
				autoCapitalize="none"
				maxLength={MAX_LENGTH}
				error={error}
				helper={value.length || text ? undefined : "e.g. online, driving, a project or trip name."}
				style={{ marginBottom: spacing.sm }}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	wrap: {
		marginBottom: spacing.md,
	},
	row: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: spacing.sm,
	},
	selected: {
		marginBottom: spacing.sm,
	},
	suggestions: {
		marginBottom: spacing.sm,
	},
	chip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		paddingHorizontal: spacing.md,
		paddingVertical: 6,
		borderRadius: radius.pill,
		maxWidth: "100%",
	},
});

export default TagField;
