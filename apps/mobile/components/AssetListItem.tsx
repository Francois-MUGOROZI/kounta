import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme, Avatar } from "react-native-paper";
import SwipeableListItem from "./SwipeableListItem";
import { Asset } from "../types";
import { formatAmount } from "../utils/currency";
import { calcPercentChange, formatPercent } from "../utils/percent";

interface AssetListItemProps {
	asset: Asset;
	typeName: string;
	onEdit: () => void;
	onPress?: () => void;
}

const AssetListItem: React.FC<AssetListItemProps> = ({
	asset,
	typeName,
	onEdit,
	onPress,
}) => {
	const theme = useTheme();
	const getIcon = (type: string) => {
		switch (type.toLowerCase()) {
			case "cash":
				return "cash";
			case "bank":
				return "bank";
			case "real estate":
				return "home-city";
			case "vehicle":
				return "car";
			case "investment":
				return "chart-line";
			default:
				return "briefcase";
		}
	};

	const totalInvested = asset.initial_cost + asset.contributions;
	const gainLoss = asset.current_valuation - totalInvested;
	const gainPct = calcPercentChange(asset.current_valuation, totalInvested);
	const gainPctStr = formatPercent(gainPct);
	const isPositive = gainLoss >= 0;

	return (
		<SwipeableListItem
			onEdit={onEdit}
			onPress={onPress}
			style={styles.container}
		>
			<View style={[styles.content, { backgroundColor: theme.colors.surface }]}>
				<Avatar.Icon
					size={36}
					icon={getIcon(typeName)}
					style={{
						backgroundColor: theme.colors.elevation.level3,
						marginRight: 16,
					}}
					color={theme.colors.primary}
				/>
				<View style={styles.info}>
					<Text variant="titleMedium" style={{ fontWeight: "600" }}>
						{asset.name}
					</Text>
					<Text variant="bodySmall" style={{ color: theme.colors.outline }}>
						{typeName}
					</Text>
				</View>
				<View style={styles.value}>
					<Text
						variant="titleMedium"
						style={{
							fontWeight: "bold",
							color: isPositive ? theme.colors.primary : theme.colors.error,
						}}
					>
						{formatAmount(asset.current_valuation, asset.currency)}
					</Text>
					{totalInvested > 0 && gainLoss !== 0 && (
						<View style={styles.percentRow}>
							<Text
								variant="bodySmall"
								style={{
									color: isPositive ? theme.colors.primary : theme.colors.error,
								}}
							>
								{isPositive ? "+" : ""}
								{formatAmount(gainLoss, asset.currency)}
							</Text>
							{gainPctStr && (
								<Text
									variant="labelSmall"
									style={[
										styles.percentBadge,
										{
											backgroundColor: isPositive
												? theme.colors.primaryContainer
												: theme.colors.errorContainer,
											color: isPositive
												? theme.colors.onPrimaryContainer
												: theme.colors.onErrorContainer,
										},
									]}
								>
									{gainPctStr}
								</Text>
							)}
						</View>
					)}
				</View>
			</View>
		</SwipeableListItem>
	);
};

const styles = StyleSheet.create({
	container: {
		marginBottom: 4,
		borderRadius: 8,
		overflow: "hidden",
	},
	content: {
		flexDirection: "row",
		alignItems: "center",
		padding: 16,
	},
	info: {
		flex: 1,
	},
	value: {
		marginLeft: 16,
		alignItems: "flex-end",
	},
	percentRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	percentBadge: {
		paddingHorizontal: 5,
		paddingVertical: 1,
		borderRadius: 4,
		fontSize: 10,
		fontWeight: "bold",
		overflow: "hidden",
	},
});

export default AssetListItem;
