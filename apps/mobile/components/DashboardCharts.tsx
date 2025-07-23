import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme, Card, ActivityIndicator } from "react-native-paper";
import { useDashboardChartsData } from "../hooks/dashboard/useDashboardChartsData";
import { BarChart } from "react-native-chart-kit";

const CHART_HEIGHT = 180;
const CHART_WIDTH = 340; // Adjust as needed for your layout

interface DashboardChartsProps {
	currency: string;
	loading?: boolean;
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({
	currency,
	loading: parentLoading,
}) => {
	const theme = useTheme();
	const { expensesByCategory, loading, error } =
		useDashboardChartsData(currency);
	const isLoading = parentLoading || loading;

	// Defensive: fallback to empty array if undefined
	const safeExpensesByCategory = Array.isArray(expensesByCategory)
		? expensesByCategory
		: [];

	// Prepare data for BarChart (react-native-chart-kit)
	const chartData = {
		labels: safeExpensesByCategory.map((d) => d.category),
		datasets: [
			{
				data: safeExpensesByCategory.map((d) => d.total),
			},
		],
	};

	return (
		<View style={styles.container}>
			<Card style={styles.chartCard}>
				<Card.Title title={`Expenses by Category`} titleVariant="titleMedium" />
				<Card.Content>
					{isLoading ? (
						<ActivityIndicator
							animating
							size="small"
							style={{ marginVertical: 16 }}
						/>
					) : error ? (
						<Text style={{ color: theme.colors.error }}>{error}</Text>
					) : chartData.labels.length === 0 ? (
						<Text style={{ color: theme.colors.onSurfaceVariant }}>
							[No expense data]
						</Text>
					) : (
						<View style={styles.chartWrapper}>
							<BarChart
								data={chartData}
								width={CHART_WIDTH}
								height={CHART_HEIGHT}
								yAxisLabel=""
								yAxisSuffix={""}
								chartConfig={{
									backgroundColor: theme.colors.background,
									backgroundGradientFrom: theme.colors.background,
									backgroundGradientTo: theme.colors.background,
									decimalPlaces: 0,
									color: (opacity = 1) => theme.colors.primary,
									labelColor: (opacity = 1) => theme.colors.onSurface,
									propsForBackgroundLines: {
										stroke: theme.colors.outlineVariant,
									},
									formatTopBarValue: (value) => value.toLocaleString(),
								}}
								fromZero
								showValuesOnTopOfBars
							/>
						</View>
					)}
				</Card.Content>
			</Card>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		marginTop: 8,
		marginBottom: 24,
	},
	chartCard: {
		borderRadius: 12,
		marginBottom: 16,
		elevation: 1,
	},
	chartWrapper: {
		alignItems: "center",
		justifyContent: "center",
		height: CHART_HEIGHT + 20,
		width: "100%",
	},
});

export default DashboardCharts;
