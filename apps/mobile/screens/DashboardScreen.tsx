import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, useTheme, Divider, ActivityIndicator } from "react-native-paper";
import AppCard from "../components/AppCard";
import DashboardGroupList from "../components/DashboardGroupList";
import { useDashboardStats } from "../hooks/dashboard/useDashboardStats";
import { useDashboardGroups } from "../hooks/dashboard/useDashboardGroups";
import { formatAmount } from "../utils/currency";

// Define the stat keys as a type
export type StatKey =
	| "netWorth"
	| "totalIncome"
	| "totalExpenses"
	| "accountBalance"
	| "assetValue"
	| "liabilityValue"
	| "totalUnpaidBills";

const STAT_CONFIG: {
	key: StatKey;
	label: string;
	icon: string;
	danger?: boolean;
	warning?: boolean;
}[] = [
	{ key: "netWorth", label: "Net Worth", icon: "scale-balance" },
	{ key: "totalIncome", label: "Total Income", icon: "cash-plus" },
	{
		key: "totalExpenses",
		label: "Total Expenses",
		icon: "cash-minus",
		danger: true,
	},
	{ key: "assetValue", label: "Asset Value", icon: "diamond-stone" },
	{
		key: "liabilityValue",
		label: "Liabilities",
		icon: "account-cash",
		danger: true,
	},
	{ key: "accountBalance", label: "Account Balance", icon: "bank" },
	{
		key: "totalUnpaidBills",
		label: "Bills Due",
		icon: "receipt",
		warning: true,
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
		envelopesByCurrency,
		loading: groupsLoading,
		error: groupsError,
	} = useDashboardGroups(refresh);
	const currencies = Object.keys(stats);
	const [currency, setCurrency] = React.useState<string | null>(null);

	React.useEffect(() => {
		if (currencies.length > 0) {
			setCurrency(currencies[0]);
		}
	}, [currencies]);

	const renderHeroCard = (cur: string) => {
		const netWorth = stats[cur]?.netWorth || 0;
		return (
			<AppCard
				variant="hero"
				style={styles.heroCard}
				title="Total Net Worth"
				subtitle="Combined across all accounts and assets"
			>
				<Text
					variant="headlineSmall"
					style={{ color: theme.colors.onPrimary, fontWeight: "bold" }}
				>
					{formatAmount(netWorth, cur)}
				</Text>
			</AppCard>
		);
	};

	return (
		<ScrollView
			style={{ flex: 1, backgroundColor: theme.colors.background }}
			contentContainerStyle={styles.container}
			showsVerticalScrollIndicator={false}
		>
			<View style={styles.header}>
				<Text variant="titleMedium" style={styles.title}>
					Dashboard
				</Text>
			</View>

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

			{currency && (
				<View key={currency} style={styles.currencySection}>
					{renderHeroCard(currency)}

					<View style={styles.statsGrid}>
						{STAT_CONFIG.filter((s) => s.key !== "netWorth").map(
							(stat, index) => (
								<AppCard
									key={stat.key}
									style={styles.statCard}
									title={stat.label}
								>
									<Text
										variant="titleMedium"
										style={{
											color: stat.danger
												? theme.colors.error
												: stat.warning
												? theme.colors.secondary
												: theme.colors.primary,
											fontWeight: "bold",
										}}
									>
										{formatAmount(stats[currency][stat.key], currency)}
									</Text>
								</AppCard>
							)
						)}
					</View>

					<View style={styles.groupsSection}>
						<Text variant="titleMedium" style={styles.sectionTitle}>
							Breakdown
						</Text>
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
							<View style={{ gap: 16 }}>
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
									title="Envelopes by Currency"
									items={envelopesByCurrency[currency] || []}
									icon="briefcase"
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
		paddingBottom: 100, // Extra padding for bottom scrolling
	},
	header: {
		marginBottom: 24,
		marginTop: 8,
	},
	title: {
		fontWeight: "bold",
	},
	currencySection: {
		marginBottom: 32,
	},
	heroCard: {
		marginBottom: 24,
	},
	statsGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between",
		gap: 8,
		marginBottom: 24,
	},
	statCard: {
		width: "48%", // Two columns
		marginBottom: 0,
	},
	groupsSection: {
		marginTop: 8,
	},
	sectionTitle: {
		marginBottom: 16,
		fontWeight: "600",
	},
});

export default DashboardScreen;
