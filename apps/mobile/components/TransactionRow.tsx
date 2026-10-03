import React, { memo } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ListItem from "./ui/ListItem";
import IconBadge from "./ui/IconBadge";
import { Transaction } from "../types";
import { TransactionView } from "../hooks/transaction/useTransactionPresenter";
import { formatTransactionAmount } from "../utils/currency";
import { formatShortDate } from "../utils/date";
import { useKTheme, tabularNums } from "../theme/theme";

interface TransactionRowProps {
	transaction: Transaction;
	view: TransactionView;
	onPress?: (transaction: Transaction) => void;
	/** Prefix the subtitle with the date (lists that aren't grouped by day). */
	showDate?: boolean;
}

const TransactionRow: React.FC<TransactionRowProps> = ({
	transaction,
	view,
	onPress,
	showDate,
}) => {
	const theme = useKTheme();
	const palette = {
		income: { fg: theme.custom.income, bg: theme.custom.incomeContainer },
		expense: { fg: theme.custom.expense, bg: theme.custom.expenseContainer },
		transfer: { fg: theme.custom.transfer, bg: theme.custom.transferContainer },
	}[view.kind];
	const amountColor =
		view.kind === "income"
			? theme.custom.income
			: view.kind === "transfer"
			? theme.colors.onSurfaceVariant
			: theme.colors.onSurface;
	const amount = formatTransactionAmount(
		transaction.amount,
		view.currency,
		view.kind === "income",
		view.kind === "transfer"
	);

	const subtitle = showDate
		? `${formatShortDate(transaction.date)} · ${view.subtitle}`
		: view.subtitle;

	return (
		<ListItem
			title={view.title}
			subtitle={subtitle}
			left={<IconBadge icon={view.icon} color={palette.fg} background={palette.bg} />}
			onPress={onPress ? () => onPress(transaction) : undefined}
			accessibilityLabel={`${view.title}, ${view.typeName} ${amount}, ${subtitle}${
				view.linkCount ? `, linked to ${view.linkCount}` : ""
			}`}
			right={
				<View style={styles.right}>
					<Text
						variant="titleSmall"
						numberOfLines={1}
						style={{ color: amountColor, ...tabularNums }}
					>
						{amount}
					</Text>
					{view.linkCount > 0 ? (
						<View style={[styles.links, { backgroundColor: theme.colors.surfaceVariant }]}>
							<MaterialCommunityIcons name="link-variant" size={11} color={theme.colors.onSurfaceVariant} />
							<Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 3 }}>
								{view.linkCount}
							</Text>
						</View>
					) : null}
				</View>
			}
		/>
	);
};

const styles = StyleSheet.create({
	right: {
		alignItems: "flex-end",
	},
	links: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 4,
		paddingHorizontal: 6,
		paddingVertical: 1,
		borderRadius: 999,
	},
});

export default memo(TransactionRow);
