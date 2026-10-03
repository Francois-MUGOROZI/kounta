import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import Constants from "expo-constants";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Card from "../components/ui/Card";
import ListItem from "../components/ui/ListItem";
import IconBadge from "../components/ui/IconBadge";
import { SegmentedControl } from "../components/ui/fields";
import type { IconName } from "../components/ui/icons";
import { ThemePreference, usePreferences } from "../contexts/PreferencesContext";
import { CurrencyDisplay, formatAmount } from "../utils/currency";
import { RootStackParamList } from "../types";
import { radius, spacing, useKTheme } from "../theme/theme";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const THEME_SEGMENTS: { value: ThemePreference; label: string; icon: IconName }[] = [
	{ value: "system", label: "Auto", icon: "theme-light-dark" },
	{ value: "light", label: "Light", icon: "white-balance-sunny" },
	{ value: "dark", label: "Dark", icon: "weather-night" },
];

const CURRENCY_SEGMENTS: { value: CurrencyDisplay; label: string }[] = [
	{ value: "standard", label: "Standard" },
	{ value: "short", label: "Short" },
];

const DATA_LINKS: {
	label: string;
	description: string;
	icon: IconName;
	screen: "Categories" | "Types" | "BackupRestore";
}[] = [
	{ label: "Categories", description: "Income & expense categories", icon: "shape-outline", screen: "Categories" },
	{ label: "Types", description: "Account, asset & liability types", icon: "tune-variant", screen: "Types" },
	{ label: "Backup & Restore", description: "Export or import your data", icon: "cloud-sync-outline", screen: "BackupRestore" },
];

const GroupTitle: React.FC<{ children: string }> = ({ children }) => {
	const theme = useKTheme();
	return (
		<Text variant="labelMedium" style={[styles.groupTitle, { color: theme.colors.onSurfaceVariant }]}>
			{children.toUpperCase()}
		</Text>
	);
};

const SettingsScreen: React.FC = () => {
	const theme = useKTheme();
	const navigation = useNavigation<Nav>();
	const { themePreference, setThemePreference, currencyDisplay, setCurrencyDisplayPreference } =
		usePreferences();

	return (
		<ScrollView
			style={{ backgroundColor: theme.colors.background }}
			contentContainerStyle={styles.content}
		>
			<GroupTitle>Preferences</GroupTitle>
			<Card>
				<Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
					Appearance
				</Text>
				<Text variant="bodySmall" style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
					{"Auto follows your phone's light or dark setting."}
				</Text>
				<SegmentedControl
					segments={THEME_SEGMENTS}
					value={themePreference}
					onChange={setThemePreference}
					style={styles.segmented}
				/>

				<View style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />

				<Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
					Currency display
				</Text>
				<Text variant="bodySmall" style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
					Standard shows currency codes; short uses symbols where they exist.
				</Text>
				<SegmentedControl
					segments={CURRENCY_SEGMENTS}
					value={currencyDisplay}
					onChange={setCurrencyDisplayPreference}
					style={styles.segmented}
				/>
				<View style={[styles.preview, { backgroundColor: theme.colors.surfaceVariant }]}>
					<Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
						PREVIEW
					</Text>
					<Text variant="titleSmall" style={{ color: theme.colors.onSurface, marginTop: 2 }}>
						{`${formatAmount(1250000, "RWF")}   ·   ${formatAmount(19.5, "USD")}   ·   ${formatAmount(42, "EUR")}`}
					</Text>
				</View>
			</Card>

			<GroupTitle>Your data</GroupTitle>
			<Card padded={false}>
				{DATA_LINKS.map((item, i) => (
					<ListItem
						key={item.screen}
						title={item.label}
						subtitle={item.description}
						left={<IconBadge icon={item.icon} size={36} />}
						chevron
						onPress={() => navigation.navigate(item.screen)}
						style={
							i > 0 && {
								borderTopWidth: StyleSheet.hairlineWidth,
								borderTopColor: theme.colors.outlineVariant,
							}
						}
					/>
				))}
			</Card>

			<Text variant="bodySmall" style={[styles.version, { color: theme.colors.onSurfaceVariant }]}>
				{`Kounta ${Constants.expoConfig?.version ?? ""} · Your data stays on this phone.`}
			</Text>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	content: {
		padding: spacing.lg,
		paddingBottom: spacing.xxxl * 2,
	},
	groupTitle: {
		marginTop: spacing.lg,
		marginBottom: spacing.sm,
		marginLeft: spacing.xs,
		letterSpacing: 0.8,
	},
	hint: {
		marginTop: 2,
	},
	segmented: {
		marginTop: spacing.md,
		marginBottom: 0,
	},
	divider: {
		height: StyleSheet.hairlineWidth,
		marginVertical: spacing.lg,
	},
	preview: {
		marginTop: spacing.md,
		padding: spacing.md,
		borderRadius: radius.md,
	},
	version: {
		textAlign: "center",
		marginTop: spacing.xxl,
	},
});

export default SettingsScreen;
