import {
	MD3LightTheme,
	MD3DarkTheme,
	configureFonts,
} from "react-native-paper";

const fontConfig = {
	fontFamily: "Inter",
	displaySmall: {
		fontFamily: "Poppins",
		fontSize: 36,
		fontWeight: "400",
		letterSpacing: 0,
		lineHeight: 44,
	},
	displayMedium: {
		fontFamily: "Poppins",
		fontSize: 45,
		fontWeight: "400",
		letterSpacing: 0,
		lineHeight: 52,
	},
	displayLarge: {
		fontFamily: "Poppins",
		fontSize: 57,
		fontWeight: "400",
		letterSpacing: 0,
		lineHeight: 64,
	},
	headlineSmall: {
		fontFamily: "Poppins",
		fontSize: 24,
		fontWeight: "400",
		letterSpacing: 0,
		lineHeight: 32,
	},
	headlineMedium: {
		fontFamily: "Poppins",
		fontSize: 28,
		fontWeight: "400",
		letterSpacing: 0,
		lineHeight: 36,
	},
	headlineLarge: {
		fontFamily: "Poppins",
		fontSize: 32,
		fontWeight: "400",
		letterSpacing: 0,
		lineHeight: 40,
	},
	titleSmall: {
		fontFamily: "Poppins",
		fontSize: 14,
		fontWeight: "500",
		letterSpacing: 0.1,
		lineHeight: 20,
	},
	titleMedium: {
		fontFamily: "Poppins",
		fontSize: 16,
		fontWeight: "500",
		letterSpacing: 0.15,
		lineHeight: 24,
	},
	titleLarge: {
		fontFamily: "Poppins",
		fontSize: 22,
		fontWeight: "400",
		letterSpacing: 0,
		lineHeight: 28,
	},
	labelSmall: {
		fontFamily: "Inter",
		fontSize: 11,
		fontWeight: "500",
		letterSpacing: 0.5,
		lineHeight: 16,
	},
	labelMedium: {
		fontFamily: "Inter",
		fontSize: 12,
		fontWeight: "500",
		letterSpacing: 0.5,
		lineHeight: 16,
	},
	labelLarge: {
		fontFamily: "Inter",
		fontSize: 14,
		fontWeight: "500",
		letterSpacing: 0.1,
		lineHeight: 20,
	},
	bodySmall: {
		fontFamily: "Inter",
		fontSize: 12,
		fontWeight: "400",
		letterSpacing: 0.4,
		lineHeight: 16,
	},
	bodyMedium: {
		fontFamily: "Inter",
		fontSize: 14,
		fontWeight: "400",
		letterSpacing: 0.25,
		lineHeight: 20,
	},
	bodyLarge: {
		fontFamily: "Inter",
		fontSize: 16,
		fontWeight: "400",
		letterSpacing: 0.15,
		lineHeight: 24,
	},
};

const baseTheme = {
	fonts: configureFonts({ config: fontConfig }),
	roundness: 12,
};

export const LightTheme = {
	...MD3LightTheme,
	...baseTheme,
	colors: {
		...MD3LightTheme.colors,
		primary: "#00ACC1", // Darker Cyan for better contrast on light backgrounds
		onPrimary: "#FFFFFF",
		primaryContainer: "#E0F7FA",
		onPrimaryContainer: "#006064",
		secondary: "#FF6F00", // Amber/Orange to complement Cyan
		onSecondary: "#FFFFFF",
		secondaryContainer: "#FFECB3",
		onSecondaryContainer: "#3E2723",
		tertiary: "#00838F", // Teal-ish
		onTertiary: "#FFFFFF",
		error: "#D32F2F",
		background: "#F5F7F6",
		surface: "#FFFFFF",
		surfaceVariant: "#E0E0E0",
		onSurface: "#191C1B",
		onSurfaceVariant: "#404944",
		outline: "#B0BEC5",
		elevation: {
			level0: "transparent",
			level1: "#F5F7F6",
			level2: "#EDF2F0",
			level3: "#E5EDE9",
			level4: "#E2EBE7",
			level5: "#DEE8E3",
		},
	},
};

export const DarkTheme = {
	...MD3DarkTheme,
	...baseTheme,
	colors: {
		...MD3DarkTheme.colors,
		primary: "#00ECFD", // The requested vibrant Cyan
		onPrimary: "#00363A", // Dark text on bright cyan
		primaryContainer: "#004D40", // Dark Teal container
		onPrimaryContainer: "#00ECFD",
		secondary: "#FFCA28", // Vibrant Amber
		onSecondary: "#3E2723",
		secondaryContainer: "#FF6F00",
		onSecondaryContainer: "#FFFFFF",
		tertiary: "#4DD0E1",
		onTertiary: "#00363A",
		// error: "#f71313ff", // Vibrant Red (Red A200)
		background: "#0F172A", // Navy/Slate Blue Dark
		surface: "#1E293B", // Lighter Slate
		surfaceVariant: "#334155",
		onSurface: "#E2E8F0",
		onSurfaceVariant: "#CBD5E1",
		outline: "#475569",
		elevation: {
			level0: "transparent",
			level1: "#1E293B",
			level2: "#253045",
			level3: "#2D3850",
			level4: "#34405A",
			level5: "#3C4865",
		},
	},
};
