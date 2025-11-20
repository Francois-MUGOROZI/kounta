import React from "react";
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

	const numberMask = createNumberMask({
		prefix: [],
		delimiter: ",",
		separator: ".",
		precision: 0, // Adjust based on currency if needed, RWF usually 0
	});

	return (
		<View style={styles.container}>
			<TextInput
				mode="outlined"
				label={label}
				value={value}
				dense
				error={!!error}
				style={[
					styles.input,
					{ backgroundColor: theme.colors.surfaceVariant },
					style,
				]}
				theme={{ roundness: 8 }}
				placeholder={placeholder}
				right={right}
				editable={editable}
				contentStyle={styles.contentStyle}
				render={(props) => (
					<MaskInput
						{...props}
						value={value}
						onChangeText={(masked, unmasked) => {
							onChangeText(unmasked);
						}}
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
