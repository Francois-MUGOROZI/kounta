import React, { useState } from "react";
import { LayoutChangeEvent, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { radius, spacing, useKTheme } from "../../theme/theme";

interface HeroCardProps {
	children: React.ReactNode;
	style?: StyleProp<ViewStyle>;
}

/** Brand gradient card for the headline figure on a screen. */
const HeroCard: React.FC<HeroCardProps> = ({ children, style }) => {
	const theme = useKTheme();
	// The SVG doesn't follow its parent's size changes on its own (e.g. when
	// content grows after a status change), so size it from the measured layout.
	const [size, setSize] = useState({ width: 0, height: 0 });
	const onLayout = (e: LayoutChangeEvent) => {
		const { width, height } = e.nativeEvent.layout;
		if (width !== size.width || height !== size.height) setSize({ width, height });
	};

	return (
		<View
			style={[styles.card, { backgroundColor: theme.custom.heroStart }, style]}
			onLayout={onLayout}
		>
			{size.width > 0 ? (
				<Svg
					width={size.width}
					height={size.height}
					style={StyleSheet.absoluteFill}
				>
					<Defs>
						<LinearGradient id="hero" x1="0" y1="0" x2="1" y2="1">
							<Stop offset="0" stopColor={theme.custom.heroStart} />
							<Stop offset="1" stopColor={theme.custom.heroEnd} />
						</LinearGradient>
					</Defs>
					<Rect width={size.width} height={size.height} fill="url(#hero)" />
					{/* Soft decorative rings */}
					<Circle cx={size.width * 0.92} cy={size.height * 0.08} r="90" fill="#FFFFFF" fillOpacity={0.06} />
					<Circle cx={size.width} cy={size.height} r="70" fill="#FFFFFF" fillOpacity={0.05} />
				</Svg>
			) : null}
			<View style={styles.content}>{children}</View>
		</View>
	);
};

const styles = StyleSheet.create({
	card: {
		borderRadius: radius.xxl,
		overflow: "hidden",
	},
	content: {
		padding: spacing.xl,
	},
});

export default HeroCard;
