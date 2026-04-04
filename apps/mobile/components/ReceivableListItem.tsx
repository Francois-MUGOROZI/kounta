import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme, Avatar, Chip } from "react-native-paper";
import SwipeableListItem from "./SwipeableListItem";
import { Receivable } from "../types";
import { formatAmount } from "../utils/currency";

interface ReceivableListItemProps {
	receivable: Receivable;
	entityName: string;
	onEdit: () => void;
	onPress?: () => void;
}

const ReceivableListItem: React.FC<ReceivableListItemProps> = ({
	receivable,
	entityName,
	onEdit,
	onPress,
}) => {
	const theme = useTheme();
	const isSettled = receivable.status === "Settled";
	const isWrittenOff = receivable.status === "Written-Off";
	const isPending = receivable.status === "Pending";

	const getIcon = () => {
		if (isSettled) return "check-circle";
		if (isWrittenOff) return "close-circle";
		if (isPending) return "clock-outline";
		return "hand-coin";
	};

	const getStatusColor = () => {
		if (isSettled) return theme.colors.primary;
		if (isWrittenOff) return theme.colors.error;
		if (isPending) return theme.colors.outline;
		return theme.colors.secondary;
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
					icon={getIcon()}
					style={{
						backgroundColor: theme.colors.elevation.level3,
						marginRight: 16,
					}}
					color={getStatusColor()}
				/>
				<View style={styles.info}>
					<Text variant="titleMedium" style={{ fontWeight: "600" }}>
						{receivable.title}
					</Text>
					<Text variant="bodySmall" style={{ color: theme.colors.outline }}>
						{entityName} · {receivable.type}
					</Text>
					{receivable.due_date ? (
						<Text variant="bodySmall" style={{ color: theme.colors.outline }}>
							Due: {new Date(receivable.due_date).toLocaleDateString()}
						</Text>
					) : null}
				</View>
				<View style={styles.balance}>
					<Text
						variant="titleMedium"
						style={{
							fontWeight: "bold",
							color: getStatusColor(),
						}}
					>
						{formatAmount(receivable.current_balance, receivable.currency)}
					</Text>
					<Text variant="bodySmall" style={{ color: theme.colors.outline }}>
						of {formatAmount(receivable.principal, receivable.currency)}
					</Text>
					<Chip
						compact
						textStyle={{ fontSize: 10 }}
						style={{
							marginTop: 4,
							backgroundColor: getStatusColor(),
						}}
					>
						<Text style={{ color: "#fff", fontSize: 10 }}>
							{receivable.status}
						</Text>
					</Chip>
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

export default ReceivableListItem;
