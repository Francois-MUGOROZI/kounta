import {
	MD3LightTheme,
	MD3DarkTheme,
	configureFonts,
} from "react-native-paper";

const fontConfig = {
	fontFamily: "Inter", // Default body font
	// You can define different font weights and styles here if needed
	// For example, for Poppins for headings:
	// headlineLarge: {
	//   fontFamily: 'Poppins',
	//   fontWeight: 'bold',
	// },
	// ...
};

const baseTheme = {
	fonts: configureFonts({ config: fontConfig }),
};

export const LightTheme = {
	...MD3LightTheme,
	...baseTheme,
	colors: {
		...MD3LightTheme.colors,
		primary: "#005248",
		onPrimary: "#FFFFFF",
		secondary: "#B57B00",
		onSecondary: "#FFFFFF",
		error: "#B3261E",
		background: "#FCFDFB",
		surface: "#FFFFFF",
		onBackground: "#191C1B",
		onSurface: "#191C1B",
		onSurfaceVariant: "#414946",
		outline: "#717976",
	},
};

export const DarkTheme = {
	...MD3DarkTheme,
	...baseTheme,
	colors: {
		...MD3DarkTheme.colors,
		primary: "#79D6C4",
		onPrimary: "#00382F",
		secondary: "#FFC24A",
		onSecondary: "#452B00",
		error: "#F2B8B5",
		background: "#191C1B",
		surface: "#242726",
		onBackground: "#E1E3E1",
		onSurface: "#E1E3E1",
		onSurfaceVariant: "#BFC9C5",
		outline: "#8B9390",
	},
};
