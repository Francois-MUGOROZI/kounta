import React from "react";
import { StyleSheet, View } from "react-native";
import {
	Card,
	Text,
	useTheme,
	ActivityIndicator,
	IconButton,
} from "react-native-paper";
import { formatAmount } from "../utils/currency";

interface DashboardStatCardProps {
	label: string;
	value: number | string;
	currency?: string;
	loading?: boolean;
	icon?: string;
	danger?: boolean;
}

const DashboardStatCard: React.FC<DashboardStatCardProps> = ({
	label,
	value,
	currency,
	loading = false,
	icon,
	danger = false,
}) => {
	const theme = useTheme();
	const isMissing = value === null || value === undefined || value === "";
	return (
		<Card style={styles.card} elevation={1}>
			<Card.Content style={styles.content}>
				<View style={styles.row}>
					{icon && (
						<IconButton
							icon={icon}
							size={20}
							style={styles.icon}
							iconColor={danger ? theme.colors.error : theme.colors.primary}
						/>
					)}
					<Text
						variant="labelLarge"
						style={[styles.label, { color: theme.colors.onSurfaceVariant }]}
					>
						{label}
					</Text>
				</View>
				<View style={styles.valueRow}>
					{loading ? (
						<ActivityIndicator
							animating
							size="small"
							style={{ marginRight: 6 }}
						/>
					) : null}
					<Text
						variant="titleSmall"
						style={[
							styles.value,
							{ color: danger ? theme.colors.error : theme.colors.primary },
						]}
					>
						{isMissing
							? "–"
							: typeof value === "number" && currency
							? `${formatAmount(value, currency)}`
							: value}
					</Text>
				</View>
			</Card.Content>
		</Card>
	);
};

const styles = StyleSheet.create({
	card: {
		borderRadius: 10,
		margin: 2,
		width: "45%",
	},
	content: {
		paddingVertical: 6,
		paddingHorizontal: 6,
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 2,
	},
	icon: {
		margin: 0,
	},
	label: {
		flex: 1,
		fontWeight: "500",
		fontSize: 13,
	},
	valueRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 1,
	},
	value: {
		fontWeight: "bold",
	},
});

export default DashboardStatCard;
