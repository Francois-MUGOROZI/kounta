import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme, Avatar } from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import SwipeableListItem from "./SwipeableListItem";
import { Transaction } from "../types";
import { formatTransactionAmount } from "../utils/currency";

interface TransactionListItemProps {
	transaction: Transaction;
	accountName: string;
	accountCurrency: string;
	categoryName: string;
	transactionTypeName: string;
	onEdit?: () => void;
	onPress?: () => void;
	associationCount?: number;
	index?: number;
}

const TransactionListItem: React.FC<TransactionListItemProps> = ({
	transaction,
	accountName,
	accountCurrency,
	categoryName,
	transactionTypeName,
	onEdit,
	onPress,
	associationCount = 0,
	index = 0,
}) => {
	const theme = useTheme();
	const isIncome = transactionTypeName === "Income";
	const isTransfer = transactionTypeName === "Transfer";

	const getIcon = () => {
		if (isTransfer) return "bank-transfer";
		if (isIncome) return "arrow-down-circle";
		return "arrow-up-circle";
	};

	const getIconColor = () => {
		if (isTransfer) return theme.colors.secondary;
		if (isIncome) return theme.colors.primary;
		return theme.colors.error;
	};

	return (
		<View style={styles.container}>
			<SwipeableListItem
				onEdit={onEdit}
				onPress={onPress}
				style={styles.swipeable}
			>
				<View
					style={[styles.content, { backgroundColor: theme.colors.surface }]}
				>
					<View style={styles.iconContainer}>
						<Avatar.Icon
							size={36}
							icon={getIcon()}
							style={{ backgroundColor: theme.colors.elevation.level3 }}
							color={getIconColor()}
						/>
					</View>
					<View style={styles.info}>
						<Text variant="titleMedium" style={styles.description}>
							{transaction.description}
						</Text>
						<Text variant="bodySmall" style={{ color: theme.colors.outline }}>
							{categoryName} • {accountName}
						</Text>
						<View style={styles.dateLine}>
							<Text variant="bodySmall" style={{ color: theme.colors.outline }}>
								{new Date(transaction.date).toLocaleDateString()}
							</Text>
							{associationCount > 0 && (
								<View style={styles.associationBadge}>
									<MaterialCommunityIcons
										name="link-variant"
										size={12}
										color={theme.colors.outline}
									/>
									<Text
										variant="labelSmall"
										style={{
											color: theme.colors.outline,
											marginLeft: 2,
											fontSize: 11,
										}}
									>
										{associationCount}
									</Text>
								</View>
							)}
						</View>
					</View>
					<View style={styles.amount}>
						<Text
							variant="titleMedium"
							style={{
								color: isTransfer
									? theme.colors.secondary
									: isIncome
									? theme.colors.primary
									: theme.colors.error,
								fontWeight: "bold",
							}}
						>
							{formatTransactionAmount(
								transaction.amount,
								accountCurrency,
								isIncome,
								isTransfer
							)}
						</Text>
					</View>
				</View>
			</SwipeableListItem>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		marginBottom: 8,
		borderRadius: 16,
		overflow: "hidden",
	},
	swipeable: {
		borderRadius: 16,
	},
	content: {
		flexDirection: "row",
		alignItems: "center",
		padding: 16,
		borderRadius: 16,
	},
	iconContainer: {
		marginRight: 16,
	},
	info: {
		flex: 1,
	},
	description: {
		fontWeight: "600",
		marginBottom: 2,
	},
	amount: {
		marginLeft: 16,
		alignItems: "flex-end",
	},
	dateLine: {
		flexDirection: "row",
		alignItems: "center",
	},
	associationBadge: {
		flexDirection: "row",
		alignItems: "center",
		marginLeft: 8,
	},
});

export default TransactionListItem;
