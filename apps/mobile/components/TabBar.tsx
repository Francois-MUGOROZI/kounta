import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { radius, spacing, useKTheme } from "../theme/theme";
import { haptics } from "../utils/haptics";
import type { IconName } from "./ui/icons";

export interface TabMeta {
	label: string;
	icon: IconName;
	activeIcon: IconName;
}

interface TabBarProps extends BottomTabBarProps {
	meta: Record<string, TabMeta>;
	/** Tabs that open something instead of navigating (e.g. the More sheet). */
	onCustomPress?: (routeName: string) => boolean;
}

const TabItem: React.FC<{
	meta: TabMeta;
	focused: boolean;
	onPress: () => void;
	onLongPress: () => void;
}> = ({ meta, focused, onPress, onLongPress }) => {
	const theme = useKTheme();
	const pill = useAnimatedStyle(() => ({
		opacity: withTiming(focused ? 1 : 0, { duration: 180 }),
		transform: [{ scaleX: withTiming(focused ? 1 : 0.6, { duration: 220 }) }],
	}));
	const color = focused ? theme.colors.onSecondaryContainer : theme.colors.onSurfaceVariant;
	return (
		<Pressable
			onPress={onPress}
			onLongPress={onLongPress}
			style={styles.item}
			accessibilityRole="tab"
			accessibilityState={{ selected: focused }}
			accessibilityLabel={meta.label}
		>
			<View style={styles.iconWrap}>
				<Animated.View
					style={[
						StyleSheet.absoluteFill,
						styles.pill,
						{ backgroundColor: theme.colors.primaryContainer },
						pill,
					]}
				/>
				<MaterialCommunityIcons
					name={focused ? meta.activeIcon : meta.icon}
					size={22}
					color={focused ? theme.colors.onPrimaryContainer : color}
				/>
			</View>
			<Text
				variant="labelMedium"
				numberOfLines={1}
				style={{
					color: focused ? theme.colors.onSurface : theme.colors.onSurfaceVariant,
					marginTop: 4,
				}}
			>
				{meta.label}
			</Text>
		</Pressable>
	);
};

/** Material 3 style navigation bar with an animated active indicator. */
const TabBar: React.FC<TabBarProps> = ({
	state,
	navigation,
	meta,
	onCustomPress,
}) => {
	const theme = useKTheme();
	const insets = useSafeAreaInsets();
	return (
		<View
			style={[
				styles.bar,
				{
					backgroundColor: theme.colors.surface,
					borderTopColor: theme.colors.outlineVariant,
					paddingBottom: Math.max(insets.bottom, spacing.sm),
				},
			]}
		>
			{state.routes.map((route, index) => {
				const focused = state.index === index;
				const routeMeta = meta[route.name];
				if (!routeMeta) return null;
				const onPress = () => {
					haptics.selection();
					if (onCustomPress?.(route.name)) return;
					const event = navigation.emit({
						type: "tabPress",
						target: route.key,
						canPreventDefault: true,
					});
					if (!focused && !event.defaultPrevented) {
						navigation.navigate(route.name, route.params);
					}
				};
				const onLongPress = () =>
					navigation.emit({ type: "tabLongPress", target: route.key });
				return (
					<TabItem
						key={route.key}
						meta={routeMeta}
						focused={focused}
						onPress={onPress}
						onLongPress={onLongPress}
					/>
				);
			})}
		</View>
	);
};

const styles = StyleSheet.create({
	bar: {
		flexDirection: "row",
		borderTopWidth: StyleSheet.hairlineWidth,
		paddingTop: spacing.sm,
	},
	item: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 2,
	},
	iconWrap: {
		width: 60,
		height: 32,
		alignItems: "center",
		justifyContent: "center",
	},
	pill: {
		borderRadius: radius.pill,
	},
});

export default TabBar;
