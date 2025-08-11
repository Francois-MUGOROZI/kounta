import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
	Text,
	useTheme,
	Divider,
	ActivityIndicator,
	Menu,
} from "react-native-paper";
import DashboardStatCard from "../components/DashboardStatCard";
// import DashboardCharts from "../components/DashboardCharts";
import DashboardGroupList from "../components/DashboardGroupList";
import { useDashboardStats } from "../hooks/dashboard/useDashboardStats";
import { useDashboardGroups } from "../hooks/dashboard/useDashboardGroups";

// Define the stat keys as a type
export type StatKey =
	| "netWorth"
	| "totalIncome"
	| "totalExpenses"
	| "accountBalance"
	| "assetValue"
	| "liabilityValue";

const STAT_CONFIG: {
	key: StatKey;
	label: string;
	icon: string;
	danger?: boolean;
}[] = [
	{ key: "netWorth", label: "Net Worth", icon: "scale-balance" },
	{ key: "totalIncome", label: "Total Income", icon: "cash-plus" },
	{ key: "accountBalance", label: "Account Balance", icon: "bank" },
	{ key: "assetValue", label: "Asset Value", icon: "diamond-stone" },
	{
		key: "totalExpenses",
		label: "Total Expenses",
		icon: "cash-minus",
		danger: true,
	},
	{
		key: "liabilityValue",
		label: "Liabilities",
		icon: "account-cash",
		danger: true,
	},
];

const DashboardScreen: React.FC = () => {
	const theme = useTheme();
	const { stats, loading, error, refresh } = useDashboardStats();
	const {
		accountsByType,
		assetsByType,
		liabilitiesByType,
		expensesByCategory,
		loading: groupsLoading,
		error: groupsError,
	} = useDashboardGroups(refresh);
	const currencies = Object.keys(stats);
	const [currency, setCurrency] = React.useState<string | null>(null);
	const [menuVisible, setMenuVisible] = React.useState(false);
	// Handle currency selection change
	const handleCurrencyChange = (currency: string) => {
		setCurrency(currency);
	};

	React.useEffect(() => {
		if (currencies.length > 0) {
			setCurrency(currencies[0]);
		}
	}, [currencies, currency]);

	return (
		<ScrollView
			style={{ flex: 1, backgroundColor: theme.colors.background }}
			contentContainerStyle={styles.container}
		>
			<Text
				variant="titleMedium"
				style={[styles.title, { color: theme.colors.primary }]}
			>
				Dashboard
			</Text>
			{loading && (
				<ActivityIndicator
					animating
					size="large"
					style={{ marginVertical: 24 }}
				/>
			)}
			{error && (
				<Text style={{ color: theme.colors.error, marginBottom: 16 }}>
					{error}
				</Text>
			)}
			{currencies.length === 0 && !loading && !error && (
				<Text style={{ textAlign: "center", marginTop: 32 }}>
					No data available.
				</Text>
			)}

			{/* Currency selection menu */}

			{/* <View style={styles.currencyMenu}>
				<Menu
					visible={menuVisible}
					onDismiss={() => setMenuVisible(false)}
					anchor={
						<Text
							style={{ color: theme.colors.secondary }}
							onPress={() => setMenuVisible(true)}
						>
							Currency: {currency || "Select"}
						</Text>
					}
				>
					{currencies.map((cur) => (
						<Menu.Item
							key={cur}
							onPress={() => {
								handleCurrencyChange(cur);
								setMenuVisible(false);
							}}
							title={cur}
						/>
					))}
				</Menu>
			</View> */}

			{currency && (
				<View key={currency} style={styles.currencySection}>
					<Divider style={{ marginVertical: 8 }} />
					<View style={styles.cardRow}>
						{STAT_CONFIG.map((stat) => (
							<DashboardStatCard
								key={stat.key}
								label={stat.label}
								value={stats[currency][stat.key]}
								currency={currency}
								loading={loading}
								icon={stat.icon}
								danger={stat.danger}
							/>
						))}
					</View>
					<View style={styles.groupsSection}>
						{groupsLoading ? (
							<ActivityIndicator
								animating
								size="small"
								style={{ marginVertical: 12 }}
							/>
						) : groupsError ? (
							<Text style={{ color: theme.colors.error, marginBottom: 8 }}>
								{groupsError}
							</Text>
						) : (
							<View>
								<DashboardGroupList
									title="Accounts by Type"
									items={accountsByType[currency] || []}
									icon="bank"
								/>
								<DashboardGroupList
									title="Assets by Type"
									items={assetsByType[currency] || []}
									icon="diamond-stone"
								/>
								<DashboardGroupList
									title="Liabilities by Type"
									items={liabilitiesByType[currency] || []}
									icon="account-cash"
								/>
								<DashboardGroupList
									title="Expenses by Category"
									items={expensesByCategory[currency] || []}
									icon="format-list-bulleted"
								/>
							</View>
						)}
					</View>
				</View>
			)}
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: {
		padding: 16,
		flexGrow: 1,
	},
	title: {
		marginBottom: 16,
		fontWeight: "bold",
	},
	currencySection: {
		marginBottom: 32,
	},
	currencyLabel: {
		marginBottom: 4,
		fontWeight: "600",
	},
	cardRow: {
		display: "flex",
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between",
		gap: 8,
	},
	groupsSection: {
		marginTop: 16,
	},
	currencyMenu: {
		marginBottom: 16,
		justifyContent: "center",
		width: "100%",
		display: "flex",
		alignItems: "flex-end",
	},
});

export default DashboardScreen;
