import React, { useMemo, useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { TextInput, HelperText, useTheme } from "react-native-paper";
import { Dropdown } from "react-native-paper-dropdown";

interface DropdownOption {
	label: string;
	value: string;
}

interface AppDropdownProps {
	label: string;
	value: string;
	onSelect: (value: string | null) => void;
	options: DropdownOption[];
	error?: string | boolean;
	style?: any;
	placeholder?: string;
}

const AppDropdown: React.FC<AppDropdownProps> = ({
	label,
	value,
	onSelect,
	options,
	error,
	style,
	placeholder,
}) => {
	const theme = useTheme();

	// Find the selected label from options
	const selectedLabel = useMemo(() => {
		const selectedOption = options.find((option) => option.value === value);
		return selectedOption?.label || placeholder || "";
	}, [options, value, placeholder]);

	// Memoize the dropdown input renderer to prevent recreation
	const renderDropdownInput = useCallback(
		(props: any) => (
			<TextInput
				{...props}
				value={selectedLabel}
				label={label}
				dense
				style={[
					styles.input,
					{ backgroundColor: theme.colors.surfaceVariant },
					style,
				]}
				mode="outlined"
				theme={{ roundness: 8 }}
				right={<TextInput.Icon icon="chevron-down" />}
				contentStyle={styles.contentStyle}
				error={!!error}
			/>
		),
		[selectedLabel, label, theme.colors.surfaceVariant, style, error]
	);

	// Memoize the error state
	const hasError = useMemo(() => !!error, [error]);

	// Wrapper to convert undefined to null for backward compatibility
	const handleSelect = useCallback(
		(selectedValue?: string) => {
			onSelect(selectedValue ?? null);
		},
		[onSelect]
	);

	return (
		<View style={styles.container}>
			<Dropdown
				label={label}
				value={value}
				onSelect={handleSelect}
				options={options}
				error={hasError}
				CustomMenuHeader={() => null}
				CustomDropdownInput={renderDropdownInput}
			/>
			{typeof error === "string" && error && (
				<HelperText type="error" visible={!!error}>
					{error}
				</HelperText>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		marginBottom: 12,
	},
	input: {
		fontSize: 14,
	},
	contentStyle: {
		paddingVertical: 0,
	},
});

export default AppDropdown;
