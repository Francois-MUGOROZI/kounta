import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme, Avatar } from "react-native-paper";
import SwipeableListItem from "./SwipeableListItem";
import { Liability } from "../types";
import { formatAmount } from "../utils/currency";

interface LiabilityListItemProps {
	liability: Liability;
	typeName: string;
	onEdit: () => void;
	onPress?: () => void;
}

const LiabilityListItem: React.FC<LiabilityListItemProps> = ({
	liability,
	typeName,
	onEdit,
	onPress,
}) => {
	const theme = useTheme();
	const isPaidOff = liability.current_balance === 0;

	const getIcon = (type: string) => {
		if (isPaidOff) return "check-circle";
		switch (type.toLowerCase()) {
			case "credit card":
				return "credit-card";
			case "loan":
				return "bank-transfer";
			case "mortgage":
				return "home-city";
			case "debt":
				return "account-cash";
			default:
				return "alert-circle-outline";
		}
	};

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
					color={isPaidOff ? theme.colors.primary : theme.colors.error}
				/>
				<View style={styles.info}>
					<Text variant="titleMedium" style={{ fontWeight: "600" }}>
						{liability.name}
					</Text>
					<Text variant="bodySmall" style={{ color: theme.colors.outline }}>
						{typeName}
					</Text>
					{liability.notes ? (
						<Text variant="bodySmall" style={{ color: theme.colors.outline }}>
							{liability.notes}
						</Text>
					) : null}
				</View>
				<View style={styles.balance}>
					<Text
						variant="titleMedium"
						style={{
							fontWeight: "bold",
							color: isPaidOff ? theme.colors.primary : theme.colors.error,
						}}
					>
						{formatAmount(liability.current_balance, liability.currency)}
					</Text>
					<Text variant="bodySmall" style={{ color: theme.colors.outline }}>
						of {formatAmount(liability.total_amount, liability.currency)}
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

export default LiabilityListItem;
