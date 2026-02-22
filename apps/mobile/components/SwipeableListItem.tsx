import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { Swipeable, RectButton } from "react-native-gesture-handler";
import { IconButton, useTheme, TouchableRipple } from "react-native-paper";

interface SwipeableListItemProps {
	onEdit?: () => void;
	onDelete?: () => void;
	onComplete?: () => void;
	children: React.ReactNode;
	style?: ViewStyle;
}

const SwipeableListItem: React.FC<SwipeableListItemProps> = ({
	onEdit,
	onDelete,
	onComplete,
	children,
	style,
}) => {
	const theme = useTheme();
	const hasActions = Boolean(onEdit || onDelete || onComplete);

	const renderRightActions = () => {
		return (
			<View style={{ flexDirection: "row" }}>
				{onComplete && (
					<RectButton
						style={[
							styles.actionButton,
							{ backgroundColor: theme.colors.primary },
						]}
						onPress={onComplete}
					>
						<IconButton
							icon="check-circle"
							iconColor={theme.colors.onPrimary}
							size={24}
						/>
					</RectButton>
				)}
				{onDelete && (
					<RectButton
						style={[
							styles.actionButton,
							{ backgroundColor: theme.colors.error },
						]}
						onPress={onDelete}
					>
						<IconButton
							icon="delete"
							iconColor={theme.colors.onError}
							size={24}
						/>
					</RectButton>
				)}
			</View>
		);
	};

	if (!hasActions) {
		return <View style={style}>{children}</View>;
	}

	return (
		<Swipeable
			renderRightActions={
				onDelete || onComplete ? renderRightActions : undefined
			}
		>
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
	actionButton: {
		justifyContent: "center",
		alignItems: "center",
		width: 64,
		height: "100%",
	},
});

export default SwipeableListItem;
