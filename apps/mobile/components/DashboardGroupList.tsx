import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme, List, Card } from "react-native-paper";

interface DashboardGroupListItem {
	label: string;
	value: number;
	currency: string;
}

interface DashboardGroupListProps {
	title: string;
	items: DashboardGroupListItem[];
	icon?: string;
}

const DashboardGroupList: React.FC<DashboardGroupListProps> = ({
	title,
	items,
	icon,
}) => {
	const theme = useTheme();
	return (
		<Card style={styles.card}>
			<Card.Title
				title={title}
				left={
					icon ? (props) => <List.Icon {...props} icon={icon} /> : undefined
				}
				titleStyle={{ fontSize: 15 }}
			/>
			<Card.Content style={{ paddingVertical: 4 }}>
				{items.length === 0 ? (
					<Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
						[No data]
					</Text>
				) : (
					<View>
						{items.map((item, idx) => (
							<List.Item
								key={item.label + idx}
								title={item.label}
								titleStyle={{ fontSize: 13 }}
								right={() => (
									<Text
										style={{
											color: theme.colors.primary,
											fontWeight: "bold",
											fontSize: 13,
										}}
									>
										{item.value === 0 ||
										item.value === null ||
										item.value === undefined
											? "–"
											: item.value.toLocaleString()}{" "}
										{item.currency}
									</Text>
								)}
								style={{ paddingVertical: 2 }}
							/>
						))}
					</View>
				)}
			</Card.Content>
		</Card>
	);
};

const styles = StyleSheet.create({
	card: {
		borderRadius: 10,
		marginBottom: 6,
		elevation: 1,
	},
});

export default DashboardGroupList;
