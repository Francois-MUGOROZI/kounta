import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import SwipeableListItem from "./SwipeableListItem";
import { Account } from "../types";

interface AccountListItemProps {
	account: Account;
	typeName: string;
	onEdit: () => void;
	onDelete: () => void;
}

const AccountListItem: React.FC<AccountListItemProps> = ({
	account,
	typeName,
	onEdit,
	onDelete,
}) => {
	const theme = useTheme();
	return (
		<SwipeableListItem
			onEdit={onEdit}
			onDelete={onDelete}
			style={styles.container}
		>
			<View style={styles.content}>
				<View style={styles.info}>
					<Text variant="titleMedium">{account.name}</Text>
					{account.account_number ? (
						<Text variant="bodySmall" style={{ color: theme.colors.outline }}>
							{account.account_number}
						</Text>
					) : null}
					<Text variant="bodySmall" style={{ color: theme.colors.outline }}>
						{typeName}
					</Text>
				</View>
				<View style={styles.balance}>
					<Text variant="titleMedium">
						{account.current_balance.toLocaleString()} {account.currency}
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
	balance: {
		marginLeft: 16,
		alignItems: "flex-end",
	},
});

export default AccountListItem;
