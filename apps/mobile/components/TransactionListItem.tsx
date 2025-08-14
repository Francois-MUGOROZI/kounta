import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import SwipeableListItem from "./SwipeableListItem";
import { Transaction } from "../types";
import { formatTransactionAmount } from "../utils/currency";

interface TransactionListItemProps {
	transaction: Transaction;
	accountName: string;
	accountCurrency: string;
	categoryName: string;
	transactionTypeName: string;
	onEdit: () => void;
	onDelete: () => void;
}

const TransactionListItem: React.FC<TransactionListItemProps> = ({
	transaction,
	accountName,
	accountCurrency,
	categoryName,
	transactionTypeName,
	onEdit,
	onDelete,
}) => {
	const theme = useTheme();
	const isIncome = transactionTypeName === "Income";
	const isTransfer = transactionTypeName === "Transfer";

	return (
		<SwipeableListItem
			onEdit={onEdit}
			onDelete={onDelete}
			style={styles.container}
		>
			<View style={[styles.content, { backgroundColor: theme.colors.surface }]}>
				<View style={styles.info}>
					<Text variant="titleMedium">{transaction.description}</Text>
					<Text variant="bodySmall" style={{ color: theme.colors.outline }}>
						{categoryName} • {accountName}
					</Text>
					<Text variant="bodySmall" style={{ color: theme.colors.outline }}>
						{new Date(transaction.date).toLocaleDateString()}
					</Text>
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
					<Text variant="bodySmall" style={{ color: theme.colors.outline }}>
						{transactionTypeName}
					</Text>
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
	amount: {
		marginLeft: 16,
		alignItems: "flex-end",
	},
});

export default TransactionListItem;
