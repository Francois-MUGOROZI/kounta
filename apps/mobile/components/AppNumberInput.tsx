import React, {
	useMemo,
	useCallback,
	useState,
	useEffect,
	useRef,
} from "react";
import { StyleSheet, View } from "react-native";
import { TextInput, HelperText, useTheme } from "react-native-paper";
import MaskInput, { createNumberMask } from "react-native-mask-input";

interface AppNumberInputProps {
	label: string;
	value: string;
	onChangeText: (text: string) => void;
	error?: string;
	currency?: string;
	style?: any;
	placeholder?: string;
	right?: React.ReactNode;
	editable?: boolean;
}

const AppNumberInput: React.FC<AppNumberInputProps> = ({
	label,
	value,
	onChangeText,
	error,
	currency = "RWF",
	style,
	placeholder,
	right,
	editable = true,
}) => {
	const theme = useTheme();
	const [localValue, setLocalValue] = useState(value ?? "");
	const lastSentValueRef = useRef<string>(value ?? "");

	// Memoize number mask - only recreate if currency changes
	const numberMask = useMemo(
		() =>
			createNumberMask({
				prefix: [],
				delimiter: ",",
				separator: ".",
				precision: 0, // Adjust based on currency if needed, RWF usually 0
			}),
		[currency]
	);

	// Sync local value with prop when it changes externally (not from user typing)
	useEffect(() => {
		if (value !== lastSentValueRef.current) {
			setLocalValue(value ?? "");
			lastSentValueRef.current = value ?? "";
		}
	}, [value]);

	// Memoize input style to prevent recreation on every render
	const inputStyle = useMemo(
		() => [
			styles.input,
			{ backgroundColor: theme.colors.surfaceVariant },
			style,
		],
		[theme.colors.surfaceVariant, style]
	);

	// Memoize onChangeText handler to prevent MaskInput recreation
	const handleChangeText = useCallback(
		(masked: string, unmasked: string) => {
			setLocalValue(unmasked); // Track unmasked value for MaskInput
			lastSentValueRef.current = unmasked;
			onChangeText(unmasked);
		},
		[onChangeText]
	);

	return (
		<View style={styles.container}>
			<TextInput
				mode="outlined"
				label={label}
				value={localValue}
				dense
				error={!!error}
				style={inputStyle}
				theme={{ roundness: 8 }}
				placeholder={placeholder}
				right={right}
				editable={editable}
				contentStyle={styles.contentStyle}
				render={(props) => (
					<MaskInput
						{...props}
						value={localValue}
						onChangeText={handleChangeText}
						mask={numberMask}
						keyboardType="numeric"
					/>
				)}
			/>
			{error && (
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
		backgroundColor: "transparent",
		fontSize: 14,
	},
	contentStyle: {
		paddingVertical: 0,
	},
});

export default AppNumberInput;
