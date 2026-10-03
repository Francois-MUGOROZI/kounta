import React from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import Sheet from "./ui/Sheet";
import ListItem from "./ui/ListItem";
import IconBadge from "./ui/IconBadge";
import type { IconName } from "./ui/icons";
import { spacing, useKTheme } from "../theme/theme";

export type Destination = "Assets" | "Liabilities" | "Receivables" | "Bills" | "Entities";

interface Item {
	label: string;
	description: string;
	icon: IconName;
	screen: Destination;
}

const GROUPS: { title: string; items: Item[] }[] = [
	{
		title: "Wealth",
		items: [
			{ label: "Assets", description: "Investments, property & valuables", icon: "diamond-stone", screen: "Assets" },
			{ label: "Liabilities", description: "Loans and debts you owe", icon: "credit-card-clock-outline", screen: "Liabilities" },
			{ label: "Receivables", description: "Money others owe you", icon: "hand-coin-outline", screen: "Receivables" },
			{ label: "Bills", description: "Upcoming and overdue payments", icon: "calendar-clock-outline", screen: "Bills" },
			{ label: "Entities", description: "People & organisations", icon: "account-group-outline", screen: "Entities" },
		],
	},
];

interface MoreSheetProps {
	visible: boolean;
	onDismiss: () => void;
	onNavigate: (screen: Destination) => void;
}

const MoreSheet: React.FC<MoreSheetProps> = ({ visible, onDismiss, onNavigate }) => {
	const theme = useKTheme();

	return (
		<Sheet visible={visible} onDismiss={onDismiss} title="More">
			{GROUPS.map((group) => (
				<View key={group.title} style={styles.group}>
					<Text
						variant="labelMedium"
						style={[styles.groupTitle, { color: theme.colors.onSurfaceVariant }]}
					>
						{group.title.toUpperCase()}
					</Text>
					<View
						style={[
							styles.groupCard,
							{
								backgroundColor: theme.colors.surface,
								borderColor: theme.custom.cardBorder,
							},
						]}
					>
						{group.items.map((item, i) => (
							<ListItem
								key={item.screen}
								title={item.label}
								subtitle={item.description}
								left={<IconBadge icon={item.icon} size={36} />}
								chevron
								onPress={() => onNavigate(item.screen)}
								style={
									i > 0 && {
										borderTopWidth: StyleSheet.hairlineWidth,
										borderTopColor: theme.colors.outlineVariant,
									}
								}
							/>
						))}
					</View>
				</View>
			))}
		</Sheet>
	);
};

const styles = StyleSheet.create({
	group: {
		marginBottom: spacing.lg,
	},
	groupTitle: {
		marginBottom: spacing.sm,
		marginLeft: spacing.xs,
		letterSpacing: 0.8,
	},
	groupCard: {
		borderRadius: 18,
		borderWidth: StyleSheet.hairlineWidth,
		overflow: "hidden",
	},
});

export default MoreSheet;
