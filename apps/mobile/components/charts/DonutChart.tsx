import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { useKTheme } from "../../theme/theme";

export interface DonutSlice {
	value: number;
	color: string;
}

interface DonutChartProps {
	slices: DonutSlice[];
	size?: number;
	thickness?: number;
	children?: React.ReactNode;
}

/** Ring chart drawn with stroke dashes; `children` render in the centre. */
const DonutChart: React.FC<DonutChartProps> = ({
	slices,
	size = 140,
	thickness = 16,
	children,
}) => {
	const theme = useKTheme();
	const r = (size - thickness) / 2;
	const circumference = 2 * Math.PI * r;
	const total = slices.reduce((sum, s) => sum + Math.max(0, s.value), 0);
	// Small gaps between segments read better than touching arcs.
	const gap = slices.length > 1 ? Math.min(4, circumference * 0.01) : 0;

	let offset = 0;
	return (
		<View style={{ width: size, height: size }}>
			<Svg width={size} height={size}>
				<G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
					<Circle
						cx={size / 2}
						cy={size / 2}
						r={r}
						stroke={theme.colors.surfaceVariant}
						strokeWidth={thickness}
						fill="none"
					/>
					{total > 0 &&
						slices.map((slice, i) => {
							const length = (Math.max(0, slice.value) / total) * circumference;
							const visible = Math.max(0, length - gap);
							const dash = `${visible} ${circumference - visible}`;
							const circle = (
								<Circle
									key={i}
									cx={size / 2}
									cy={size / 2}
									r={r}
									stroke={slice.color}
									strokeWidth={thickness}
									strokeDasharray={dash}
									strokeDashoffset={-offset}
									strokeLinecap="butt"
									fill="none"
								/>
							);
							offset += length;
							return circle;
						})}
				</G>
			</Svg>
			<View style={[StyleSheet.absoluteFill, styles.center]}>{children}</View>
		</View>
	);
};

const styles = StyleSheet.create({
	center: {
		alignItems: "center",
		justifyContent: "center",
	},
});

export default DonutChart;
