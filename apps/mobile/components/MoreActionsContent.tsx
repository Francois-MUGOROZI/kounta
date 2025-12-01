import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Text, useTheme, Card, IconButton, Divider } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";

interface MoreActionsContentProps {
	onClose: () => void;
}

const MoreActionsContent: React.FC<MoreActionsContentProps> = ({ onClose }) => {
	const theme = useTheme();
	const navigation = useNavigation();

	const handleNavigation = (screenName: string) => {
		onClose();
		navigation.navigate(screenName as never); // Type assertion for now, will be properly typed with navigation later
	};

	const actions = [
		{ name: "Assets", icon: "piggy-bank", screen: "Assets" },
		{ name: "Liabilities", icon: "credit-card-minus", screen: "Liabilities" },
		{ name: "Bills", icon: "receipt", screen: "Bills" },
		{ name: "Categories", icon: "shape", screen: "Categories" },
		{ name: "Manage Types", icon: "tune-variant", screen: "Types" },
		{
			name: "Backup & Restore",
			icon: "backup-restore",
			screen: "BackupRestore",
		},
		// Add more actions here as needed
	];

	return (
		<View>
			<View style={styles.container}>
				<Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
					More Actions
				</Text>
			</View>
			<Divider />
			<View style={styles.subContainer}>
				{actions.map((action) => (
					<TouchableOpacity
						key={action.name}
						style={styles.actionButton}
						onPress={() => handleNavigation(action.screen)}
					>
						<Card
							style={[
								styles.actionCard,
								{ backgroundColor: theme.colors.surface },
							]}
						>
							<Card.Content style={styles.actionContent}>
								<IconButton
									icon={action.icon}
									size={22}
									iconColor={theme.colors.primary}
									style={styles.iconButton}
								/>
								<Text
									style={[styles.actionText, { color: theme.colors.onSurface }]}
									numberOfLines={2}
								>
									{action.name}
								</Text>
							</Card.Content>
						</Card>
					</TouchableOpacity>
				))}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 16,
	},
	subContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "flex-start",
		marginTop: 16,
	},
	actionButton: {
		width: "33%", // 3 items per row
		padding: 2,
		alignItems: "center",
	},
	actionCard: {
		width: "100%",
		aspectRatio: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 4,
		borderRadius: 12,
	},
	actionContent: { alignItems: "center", padding: 0 },
	iconButton: {
		margin: 0,
	},
	actionText: {
		fontSize: 12,
		textAlign: "center",
		marginTop: 2,
	},
});

export default MoreActionsContent;
