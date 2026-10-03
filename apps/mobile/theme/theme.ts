import { Platform, TextStyle } from "react-native";
import type { MD3TypescaleKey } from "react-native-paper";
import {
	MD3LightTheme,
	MD3DarkTheme,
	configureFonts,
	useTheme,
} from "react-native-paper";

/**
 * Kounta design tokens.
 *
 * Fonts are bundled static files (see theme/fonts.ts). Android picks the face
 * by family name, so every variant names an exact file and keeps fontWeight
 * at "400" — setting a heavier weight on top would trigger faux-bold.
 */
export const fontFamily = {
	regular: "Inter-Regular",
	medium: "Inter-Medium",
	semibold: "Inter-SemiBold",
	bold: "Inter-Bold",
	displayMedium: "Poppins-Medium",
	display: "Poppins-SemiBold",
	displayBold: "Poppins-Bold",
} as const;

const variant = (
	family: string,
	fontSize: number,
	lineHeight: number,
	letterSpacing = 0
) => ({
	fontFamily: family,
	fontSize,
	lineHeight,
	letterSpacing,
	fontWeight: "400" as const,
});

// Letter-spacing stays at 0 below title sizes: Android measures text without it
// and then wraps (and clips) the last word of short labels. Inter is designed
// for zero tracking at these sizes anyway.
const fontConfig = {
	displayLarge: variant(fontFamily.display, 48, 56, -0.5),
	displayMedium: variant(fontFamily.display, 40, 48, -0.5),
	displaySmall: variant(fontFamily.display, 32, 40, -0.25),
	headlineLarge: variant(fontFamily.display, 30, 38, -0.25),
	headlineMedium: variant(fontFamily.display, 26, 34, -0.25),
	headlineSmall: variant(fontFamily.display, 22, 30),
	titleLarge: variant(fontFamily.display, 19, 26),
	titleMedium: variant(fontFamily.semibold, 16, 22),
	titleSmall: variant(fontFamily.semibold, 14, 20),
	labelLarge: variant(fontFamily.semibold, 14, 20),
	labelMedium: variant(fontFamily.medium, 12, 16),
	labelSmall: variant(fontFamily.medium, 11, 14),
	bodyLarge: variant(fontFamily.regular, 16, 24),
	bodyMedium: variant(fontFamily.regular, 14, 20),
	bodySmall: variant(fontFamily.regular, 12, 16),
	default: variant(fontFamily.regular, 14, 20),
};

/**
 * Tabular digits for aligned figures. iOS only: on Android, React Native
 * measures text without font features, so `tnum` digits overflow and truncate.
 */
export const tabularNums: TextStyle =
	Platform.OS === "ios" ? { fontVariant: ["tabular-nums"] } : {};

export const spacing = {
	xxs: 2,
	xs: 4,
	sm: 8,
	md: 12,
	lg: 16,
	xl: 20,
	xxl: 24,
	xxxl: 32,
} as const;

export const radius = {
	sm: 8,
	md: 12,
	lg: 16,
	xl: 20,
	xxl: 28,
	pill: 999,
} as const;

/** Semantic colours that Material 3 does not cover. */
export type CustomColors = {
	income: string;
	incomeContainer: string;
	expense: string;
	expenseContainer: string;
	transfer: string;
	transferContainer: string;
	warning: string;
	warningContainer: string;
	heroStart: string;
	heroEnd: string;
	onHero: string;
	onHeroMuted: string;
	cardBorder: string;
	scrim: string;
};

const lightCustom: CustomColors = {
	income: "#17855A",
	incomeContainer: "#DDF4E8",
	expense: "#C9372C",
	expenseContainer: "#FCE4E1",
	transfer: "#4757C2",
	transferContainer: "#E4E7FA",
	warning: "#9A6400",
	warningContainer: "#FFEFC7",
	heroStart: "#0C4A33",
	heroEnd: "#17795A",
	onHero: "#FFFFFF",
	onHeroMuted: "rgba(255,255,255,0.72)",
	cardBorder: "#E3EAE6",
	scrim: "rgba(10,20,20,0.45)",
};

const darkCustom: CustomColors = {
	income: "#5FD49A",
	incomeContainer: "#133A29",
	expense: "#FF8A80",
	expenseContainer: "#4A1D19",
	transfer: "#A9B4FF",
	transferContainer: "#262E5C",
	warning: "#FFC24A",
	warningContainer: "#4A3600",
	heroStart: "#0B3626",
	heroEnd: "#145C41",
	onHero: "#F2FBFB",
	onHeroMuted: "rgba(242,251,251,0.7)",
	cardBorder: "#242427",
	scrim: "rgba(0,0,0,0.6)",
};

const baseTheme = {
	fonts: configureFonts({ config: fontConfig as any }),
	roundness: 4,
};

export const LightTheme = {
	...MD3LightTheme,
	...baseTheme,
	dark: false,
	colors: {
		...MD3LightTheme.colors,
		primary: "#0F6B4A",
		onPrimary: "#FFFFFF",
		primaryContainer: "#D2F0E0",
		onPrimaryContainer: "#00391F",
		secondary: "#A06A00",
		onSecondary: "#FFFFFF",
		secondaryContainer: "#FFE6AE",
		onSecondaryContainer: "#3A2700",
		tertiary: "#4757C2",
		onTertiary: "#FFFFFF",
		tertiaryContainer: "#E4E7FA",
		onTertiaryContainer: "#141C5E",
		error: "#BA1A1A",
		onError: "#FFFFFF",
		errorContainer: "#FFDAD6",
		onErrorContainer: "#410002",
		background: "#F4F7F5",
		onBackground: "#141C18",
		surface: "#FFFFFF",
		onSurface: "#141C18",
		surfaceVariant: "#ECF2EE",
		onSurfaceVariant: "#55625C",
		outline: "#83908A",
		outlineVariant: "#DAE3DE",
		inverseSurface: "#26302B",
		inverseOnSurface: "#ECF2EE",
		inversePrimary: "#6FDCAE",
		backdrop: "rgba(10,20,20,0.45)",
		surfaceDisabled: "rgba(20,28,24,0.10)",
		onSurfaceDisabled: "rgba(20,28,24,0.38)",
		elevation: {
			level0: "transparent",
			level1: "#FFFFFF",
			level2: "#F7FAF8",
			level3: "#F1F6F3",
			level4: "#EEF4F0",
			level5: "#EAF1ED",
		},
	},
	custom: lightCustom,
};

export const DarkTheme = {
	...MD3DarkTheme,
	...baseTheme,
	dark: true,
	colors: {
		...MD3DarkTheme.colors,
		primary: "#6FDCAE",
		onPrimary: "#00391F",
		primaryContainer: "#124D35",
		onPrimaryContainer: "#BDF4D9",
		secondary: "#FFC24A",
		onSecondary: "#402D00",
		secondaryContainer: "#5C4300",
		onSecondaryContainer: "#FFDFA0",
		tertiary: "#A9B4FF",
		onTertiary: "#13207A",
		tertiaryContainer: "#262E5C",
		onTertiaryContainer: "#DEE1FF",
		error: "#FFB4AB",
		onError: "#690005",
		errorContainer: "#93000A",
		onErrorContainer: "#FFDAD6",
		background: "#0B0B0D",
		onBackground: "#E8E8EA",
		surface: "#161618",
		onSurface: "#E8E8EA",
		surfaceVariant: "#222225",
		onSurfaceVariant: "#A3A3AA",
		outline: "#6E6E76",
		outlineVariant: "#2B2B2F",
		inverseSurface: "#E8E8EA",
		inverseOnSurface: "#232326",
		inversePrimary: "#0F6B4A",
		backdrop: "rgba(0,0,0,0.6)",
		surfaceDisabled: "rgba(232,232,234,0.12)",
		onSurfaceDisabled: "rgba(232,232,234,0.38)",
		elevation: {
			level0: "transparent",
			level1: "#161618",
			level2: "#1B1B1E",
			level3: "#202023",
			level4: "#232326",
			level5: "#27272B",
		},
	},
	custom: darkCustom,
};

export type AppTheme = typeof LightTheme & {
	/** Mirrors the currency display preference so money re-renders when it changes. */
	currencyDisplay?: "standard" | "short";
};

/** Categorical palette for charts — distinct in both themes. */
export const chartPalette = (dark: boolean) =>
	dark
		? ["#6FDCAE", "#FFC24A", "#A9B4FF", "#FF8A80", "#7CC8E0", "#C7A6FF", "#8FA39A"]
		: ["#17795A", "#D79A00", "#4757C2", "#E0604F", "#2E8FB0", "#8A5CC9", "#7B8B85"];

export type TextVariant = `${MD3TypescaleKey}`;

/** Typed theme hook — includes `custom` semantic colours. */
export const useKTheme = () => useTheme<AppTheme>();
