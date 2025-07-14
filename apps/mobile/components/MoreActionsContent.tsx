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
							padding: 5,
							alignItems: "center",
						}}
						onPress={() => handleNavigation(action.screen)}
					>
						<Card
							style={{
								width: "100%",
								aspectRatio: 1, // Make cards square
								justifyContent: "center",
								alignItems: "center",
								backgroundColor: theme.colors.surface,
							}}
						>
							<Card.Content style={{ alignItems: "center" }}>
								<IconButton
									icon={action.icon}
									size={30}
									iconColor={theme.colors.primary}
								/>
								<Text style={{ color: theme.colors.onSurface }}>
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
