import React, { useEffect } from "react";
import { DimensionValue, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
	Easing,
} from "react-native-reanimated";
import { radius, spacing, useKTheme } from "../../theme/theme";

interface SkeletonProps {
	width?: DimensionValue;
	height?: number;
	borderRadius?: number;
	style?: StyleProp<ViewStyle>;
}

/** Pulsing placeholder shown while the first page of data loads. */
export const Skeleton: React.FC<SkeletonProps> = ({
	width = "100%",
	height = 14,
	borderRadius = radius.sm,
	style,
}) => {
	const theme = useKTheme();
	const opacity = useSharedValue(0.55);

	useEffect(() => {
		opacity.value = withRepeat(
			withTiming(1, { duration: 750, easing: Easing.inOut(Easing.ease) }),
			-1,
			true
		);
	}, [opacity]);

	const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));

	return (
		<Animated.View
			style={[
				{ width, height, borderRadius, backgroundColor: theme.colors.surfaceVariant },
				animated,
				style,
			]}
		/>
	);
};

/** A few rows shaped like list items. */
export const SkeletonList: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
	<View>
		{Array.from({ length: rows }).map((_, i) => (
			<View key={i} style={styles.row}>
				<Skeleton width={40} height={40} borderRadius={13} />
				<View style={styles.body}>
					<Skeleton width="60%" height={14} />
					<Skeleton width="35%" height={11} style={{ marginTop: 8 }} />
				</View>
				<Skeleton width={72} height={14} />
			</View>
		))}
	</View>
);

const styles = StyleSheet.create({
	row: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.md,
	},
	body: {
		flex: 1,
		marginHorizontal: spacing.md,
	},
});

export default Skeleton;
