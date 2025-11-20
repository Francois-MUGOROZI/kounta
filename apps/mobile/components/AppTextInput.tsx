import React, { useState } from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { TextInput, HelperText, useTheme } from "react-native-paper";
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

	// Currency Formatting Logic
	const handleCurrencyChange = (text: string) => {
		// Remove non-numeric characters except decimal point
		const cleanText = text.replace(/[^0-9.]/g, "");
		onChangeText(cleanText);
	};

	const getDisplayValue = () => {
		if (type === "currency" && value) {
			return formatAmount(Number(value), currency);
		}
		if (type === "date" && value) {
			return new Date(value).toLocaleDateString();
		}
		return value;
	};

	// Date Picker Logic
	const handleDateConfirm = (params: { date: Date | undefined }) => {
		setShowDatePicker(false);
		if (params.date) {
			onChangeText(params.date.toISOString());
		}
	};

	const renderInput = () => (
		<TextInput
		    dense
			mode="outlined"
			label={label}
			value={type === "currency" ? value : getDisplayValue()}
			onChangeText={type === "currency" ? handleCurrencyChange : onChangeText}
			error={!!error}
			keyboardType={type === "currency" ? "numeric" : keyboardType}
			secureTextEntry={secureTextEntry}
			style={[
				styles.input,
				{ backgroundColor: theme.colors.surfaceVariant },
				style,
			]}
			theme={{ roundness: 8 }}
			placeholder={placeholder}
			right={
				type === "date" ? (
					<TextInput.Icon
						icon="calendar"
						onPress={() => setShowDatePicker(true)}
					/>
				) : (
					right
				)
			}
			editable={type !== "date"}
			contentStyle={styles.contentStyle}
			multiline={multiline}
			numberOfLines={numberOfLines}
			maxLength={maxLength}
		/>
	);

	if (type === "date") {
		return (
			<View style={styles.container}>
				<TouchableOpacity onPress={() => setShowDatePicker(true)}>
					<View pointerEvents="none">{renderInput()}</View>
				</TouchableOpacity>
				<DatePickerModal
					locale="en"
					mode="single"
					visible={showDatePicker}
					onDismiss={() => setShowDatePicker(false)}
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
			{renderInput()}
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
		fontSize: 14,
	},
	contentStyle: {
		paddingVertical: 0,
	},
});

export default AppTextInput;
