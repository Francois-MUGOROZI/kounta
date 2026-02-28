import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme, Avatar } from "react-native-paper";
import SwipeableListItem from "./SwipeableListItem";
import { Account } from "../types";

interface AccountListItemProps {
	account: Account;
	typeName: string;
	onEdit: () => void;
	onPress?: () => void;
}

const AccountListItem: React.FC<AccountListItemProps> = ({
	account,
	typeName,
	onEdit,
	onPress,
}) => {
	const theme = useTheme();
	const getIcon = (type: string) => {
		switch (type.toLowerCase()) {
			case "bank":
				return "bank";
			case "cash":
				return "cash";
			case "mobile money":
				return "cellphone";
			default:
				return "wallet";
		}
	};

	return (
		<SwipeableListItem
			onEdit={onEdit}
			onPress={onPress}
			style={styles.container}
		>
			<View style={styles.content}>
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
						{account.name}
					</Text>
					{account.account_number ? (
						<Text variant="bodySmall" style={{ color: theme.colors.outline }}>
							{account.account_number} • {typeName}
						</Text>
					) : (
						<Text variant="bodySmall" style={{ color: theme.colors.outline }}>
							{typeName}
						</Text>
					)}
				</View>
				<View style={styles.balance}>
					<Text
						variant="titleMedium"
						style={{
							fontWeight: "bold",
							color:
								account.current_balance >= 0
									? theme.colors.primary
									: theme.colors.error,
						}}
					>
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
