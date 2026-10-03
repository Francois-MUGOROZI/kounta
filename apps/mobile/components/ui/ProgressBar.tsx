import React, { useEffect } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
	Easing,
} from "react-native-reanimated";
import { radius, useKTheme } from "../../theme/theme";

interface ProgressBarProps {
	/** 0..1 — values outside are clamped. */
	progress: number;
	color?: string;
	trackColor?: string;
	height?: number;
	style?: StyleProp<ViewStyle>;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
	progress,
	color,
	trackColor,
	height = 8,
	style,
}) => {
	const theme = useKTheme();
	const clamped = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
	const value = useSharedValue(0);

	useEffect(() => {
		value.value = withTiming(clamped, {
			duration: 600,
			easing: Easing.out(Easing.cubic),
		});
	}, [clamped, value]);

	const fill = useAnimatedStyle(() => ({ width: `${value.value * 100}%` }));

	return (
		<View
			style={[
				styles.track,
				{ height, backgroundColor: trackColor ?? theme.colors.surfaceVariant },
				style,
			]}
			accessibilityRole="progressbar"
			accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
		>
			<Animated.View
				style={[
					styles.fill,
					{ backgroundColor: color ?? theme.colors.primary },
					fill,
				]}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	track: {
		borderRadius: radius.pill,
		overflow: "hidden",
		width: "100%",
	},
	fill: {
		height: "100%",
		borderRadius: radius.pill,
	},
});

export default ProgressBar;
