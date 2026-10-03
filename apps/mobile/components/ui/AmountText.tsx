import React from "react";
import { StyleProp, TextStyle } from "react-native";
import { Text } from "react-native-paper";
import { TextVariant, useKTheme, tabularNums } from "../../theme/theme";
import { formatAmount, formatSignedAmount } from "../../utils/currency";

export type AmountTone =
	| "default"
	| "muted"
	| "income"
	| "expense"
	| "transfer"
	| "auto"
	| "onHero";

interface AmountTextProps {
	amount: number;
	currency: string;
	tone?: AmountTone;
	/** Prefix with "+" / "-". */
	signed?: boolean;
	variant?: TextVariant;
	style?: StyleProp<TextStyle>;
	numberOfLines?: number;
}

/** Money with consistent formatting, tabular digits and semantic colour. */
const AmountText: React.FC<AmountTextProps> = ({
	amount,
	currency,
	tone = "default",
	signed = false,
	variant = "titleSmall",
	style,
	numberOfLines = 1,
}) => {
	const theme = useKTheme();
	const color = (() => {
		switch (tone) {
			case "income":
				return theme.custom.income;
			case "expense":
				return theme.custom.expense;
			case "transfer":
				return theme.custom.transfer;
			case "muted":
				return theme.colors.onSurfaceVariant;
			case "onHero":
				return theme.custom.onHero;
			case "auto":
				return amount < 0 ? theme.custom.expense : theme.colors.onSurface;
			default:
				return theme.colors.onSurface;
		}
	})();

	return (
		<Text
			variant={variant}
			numberOfLines={numberOfLines}
			adjustsFontSizeToFit={numberOfLines === 1}
			minimumFontScale={0.7}
			style={[{ color, ...tabularNums }, style]}
		>
			{signed ? formatSignedAmount(amount, currency) : formatAmount(amount, currency)}
		</Text>
	);
};

export default AmountText;
