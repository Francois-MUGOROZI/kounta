import React, { useState, useCallback, useRef, useEffect } from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import {
	TextInput,
	HelperText,
	useTheme,
	TextInputProps,
} from "react-native-paper";
import { DatePickerModal } from "react-native-paper-dates";
import { formatAmount } from "../utils/currency";

interface AppTextInputProps {
	label: string;
	value: string;
	onChangeText: (text: string) => void;
	error?: string;
	keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
	secureTextEntry?: boolean;
	type?: "text" | "currency" | "date";
	currency?: string;
	style?: any;
	placeholder?: string;
	right?: React.ReactNode;
	multiline?: boolean;
	numberOfLines?: number;
	maxLength?: number;
}

const AppTextInput: React.FC<AppTextInputProps> = ({
	label,
	value,
	onChangeText,
	error,
	keyboardType = "default",
	secureTextEntry,
	type = "text",
	currency = "RWF",
	style,
	placeholder,
	right,
	multiline,
	numberOfLines,
	maxLength,
}) => {
	const theme = useTheme();
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [localValue, setLocalValue] = useState(value ?? "");
	const lastSentValueRef = useRef<string>(value ?? "");

	// Sync local value with prop when it changes externally (not from user typing)
	useEffect(() => {
		// If the incoming value matches what we just sent, it's from our onChangeText - ignore it
		// If it's different, it's an external change - sync it
		if (value !== lastSentValueRef.current) {
			setLocalValue(value ?? "");
			lastSentValueRef.current = value ?? "";
		}
	}, [value]);

	// Currency Formatting Logic
	const handleCurrencyChange = useCallback(
		(text: string) => {
			// Remove non-numeric characters except decimal point
			const cleanText = text.replace(/[^0-9.]/g, "");
			setLocalValue(cleanText);
			lastSentValueRef.current = cleanText;
			onChangeText(cleanText);
		},
		[onChangeText]
	);

	// Date Picker Logic
	const handleDateConfirm = useCallback(
		(params: { date: Date | undefined }) => {
			setShowDatePicker(false);
			if (params.date) {
				onChangeText(params.date.toISOString());
			}
		},
		[onChangeText]
	);

	const handleDateDismiss = useCallback(() => {
		setShowDatePicker(false);
	}, []);

	// Determine display value - use localValue for text inputs to preserve cursor position
	const displayValue = React.useMemo(() => {
		if (type === "date" && value) {
			try {
				return new Date(value).toLocaleDateString();
			} catch {
				return value;
			}
		}
		// Use localValue for text/currency inputs to prevent cursor jumping
		return type === "date" ? value ?? "" : localValue;
	}, [type, value, localValue]);

	const inputStyle = React.useMemo(
		() => [
			styles.input,
			{ backgroundColor: theme.colors.surfaceVariant },
			style,
		],
		[theme.colors.surfaceVariant, style]
	);

	const inputRight =
		type === "date" ? (
			<TextInput.Icon icon="calendar" onPress={() => setShowDatePicker(true)} />
		) : (
			right
		);

	// Memoize onChangeText handler to prevent TextInput recreation
	const handleChangeText = React.useCallback(
		(text: string) => {
			if (type === "currency") {
				handleCurrencyChange(text);
			} else {
				setLocalValue(text);
				lastSentValueRef.current = text;
				onChangeText(text);
			}
		},
		[type, handleCurrencyChange, onChangeText]
	);

	const renderTextInput = () => (
		<TextInput
			dense
			mode="outlined"
			label={label}
			value={displayValue}
			onChangeText={handleChangeText}
			error={!!error}
			keyboardType={type === "currency" ? "numeric" : keyboardType}
			secureTextEntry={secureTextEntry}
			style={inputStyle}
			theme={{ roundness: 8 }}
			placeholder={placeholder}
			right={inputRight}
			editable={type !== "date"}
			contentStyle={styles.contentStyle}
			multiline={multiline}
			numberOfLines={numberOfLines}
			maxLength={maxLength}
			autoCapitalize="none"
			autoComplete="off"
		/>
	);

	if (type === "date") {
		return (
			<View style={styles.container}>
				<TouchableOpacity onPress={() => setShowDatePicker(true)}>
					<View pointerEvents="none">{renderTextInput()}</View>
				</TouchableOpacity>
				<DatePickerModal
					locale="en"
					mode="single"
					visible={showDatePicker}
					onDismiss={handleDateDismiss}
					date={value ? new Date(value) : undefined}
					onConfirm={handleDateConfirm}
				/>
				{error && (
					<HelperText type="error" visible={!!error}>
						{error}
					</HelperText>
				)}
			</View>
		);
	}

	return (
		<View style={styles.container}>
			{renderTextInput()}
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
		marginBottom: 4,
	},
	input: {
		fontSize: 14,
	},
	contentStyle: {
		paddingVertical: 0,
	},
});

export default AppTextInput;
