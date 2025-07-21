import React from "react";
import { View, TouchableOpacity } from "react-native";
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
		{ name: "Liabilities", icon: "credit-card-minus", screen: "Liabilities" },
		{ name: "Categories", icon: "shape", screen: "Categories" },
		{ name: "Manage Types", icon: "tune-variant", screen: "Types" },
		// Add more actions here as needed
	];

	return (
		<>
			<View
				style={{
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: 16,
				}}
			>
				<Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
					More Actions
				</Text>
			</View>
			<Divider />
			<View
				style={{
					flexDirection: "row",
					flexWrap: "wrap",
					justifyContent: "flex-start",
					marginTop: 16,
				}}
			>
				{actions.map((action) => (
					<TouchableOpacity
						key={action.name}
						style={{
							width: "33%", // 3 items per row
							padding: 2,
							alignItems: "center",
						}}
						onPress={() => handleNavigation(action.screen)}
					>
						<Card
							style={{
								width: "100%",
								aspectRatio: 1,
								justifyContent: "center",
								alignItems: "center",
								backgroundColor: theme.colors.surface,
								padding: 4,
							}}
						>
							<Card.Content style={{ alignItems: "center", padding: 0 }}>
								<IconButton
									icon={action.icon}
									size={22}
									iconColor={theme.colors.primary}
									style={{ margin: 0 }}
								/>
								<Text
									style={{
										color: theme.colors.onSurface,
										fontSize: 12,
										textAlign: "center",
										marginTop: 2,
									}}
									numberOfLines={2}
								>
									{action.name}
								</Text>
							</Card.Content>
						</Card>
					</TouchableOpacity>
				))}
			</View>
		</>
	);
};

export default MoreActionsContent;
