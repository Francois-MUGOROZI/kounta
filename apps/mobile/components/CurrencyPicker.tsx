import React, { useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Dropdown from "./ui/Dropdown";
import { getCurrencyByCode } from "../constants/currencies";
import { radius, spacing, useKTheme } from "../theme/theme";

interface CurrencyPickerProps {
	currencies: string[];
	value: string;
	onChange: (currency: string) => void;
	/** Optional trailing text per currency, e.g. a total. */
	trailing?: (currency: string) => string | undefined;
	/** "hero" sits on the gradient card; "surface" on the page. */
	tone?: "hero" | "surface";
}

/** Compact pill that switches the currency a screen is showing. */
const CurrencyPicker: React.FC<CurrencyPickerProps> = ({
	currencies,
	value,
	onChange,
	trailing,
	tone = "surface",
}) => {
	const theme = useKTheme();
	const anchor = useRef<View>(null);
	const [open, setOpen] = useState(false);
	const onHero = tone === "hero";
	const fg = onHero ? theme.custom.onHero : theme.colors.onSurface;
	return (
		<>
			<Pressable
				ref={anchor}
				onPress={() => setOpen(true)}
				hitSlop={8}
				accessibilityRole="button"
				accessibilityLabel={`Currency ${value}. Change currency`}
				style={[
					styles.pill,
					onHero
						? { backgroundColor: "rgba(255,255,255,0.16)" }
						: {
								backgroundColor: theme.colors.surface,
								borderColor: theme.colors.outlineVariant,
								borderWidth: StyleSheet.hairlineWidth,
						  },
				]}
			>
				<Text variant="labelLarge" style={{ color: fg }}>
					{value}
				</Text>
				<MaterialCommunityIcons name="chevron-down" size={16} color={fg} />
			</Pressable>
			<Dropdown
				visible={open}
				onDismiss={() => setOpen(false)}
				anchor={anchor}
				alignRight
				minWidth={220}
				selected={value}
				options={currencies.map((c) => ({
					value: c,
					label: c,
					description: getCurrencyByCode(c)?.name,
					trailing: trailing?.(c),
				}))}
				onSelect={(c) => {
					setOpen(false);
					if (c) onChange(c);
				}}
			/>
		</>
	);
};

const styles = StyleSheet.create({
	pill: {
		flexDirection: "row",
		alignItems: "center",
		gap: 2,
		paddingHorizontal: spacing.md,
		height: 34,
		borderRadius: radius.pill,
	},
});

export default CurrencyPicker;
