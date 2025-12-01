import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { Swipeable, RectButton } from "react-native-gesture-handler";
import { IconButton, useTheme, TouchableRipple } from "react-native-paper";

interface SwipeableListItemProps {
	onEdit: () => void;
	onDelete?: () => void;
	children: React.ReactNode;
	style?: ViewStyle;
}

const SwipeableListItem: React.FC<SwipeableListItemProps> = ({
	onEdit,
	onDelete,
	children,
	style,
}) => {
	const theme = useTheme();

	const renderRightActions = () => {
		if (!onDelete) return null;
		return (
			<RectButton
				style={[styles.deleteButton, { backgroundColor: theme.colors.error }]}
				onPress={onDelete}
			>
				<IconButton icon="delete" iconColor={theme.colors.onError} size={24} />
			</RectButton>
		);
	};

	return (
		<Swipeable renderRightActions={onDelete ? renderRightActions : undefined}>
			<View style={style}>
				<View style={{ flex: 1 }}>
					<TouchableRipple
						onLongPress={onEdit}
						rippleColor={theme.colors.primary + "22"}
					>
						<View style={{ flex: 1 }}>{children}</View>
					</TouchableRipple>
				</View>
			</View>
		</Swipeable>
	);
};

const styles = StyleSheet.create({
	deleteButton: {
		justifyContent: "center",
		alignItems: "center",
		width: 64,
		height: "100%",
	},
});

export default SwipeableListItem;
