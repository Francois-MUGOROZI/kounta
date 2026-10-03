import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme, View } from "react-native";
import { PaperProvider } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { LightTheme, DarkTheme, AppTheme } from "../theme/theme";
import { CurrencyDisplay, setCurrencyDisplay } from "../utils/currency";

export type ThemePreference = "system" | "light" | "dark";

interface PreferencesValue {
	theme: AppTheme;
	isDark: boolean;
	themePreference: ThemePreference;
	setThemePreference: (preference: ThemePreference) => void;
	currencyDisplay: CurrencyDisplay;
	setCurrencyDisplayPreference: (mode: CurrencyDisplay) => void;
	/** Currency the overview screens are showing; shared so they stay in step. */
	activeCurrency: string | null;
	setActiveCurrency: (currency: string) => void;
}

const PreferencesContext = createContext<PreferencesValue>({
	theme: LightTheme,
	isDark: false,
	themePreference: "system",
	setThemePreference: () => {},
	currencyDisplay: "standard",
	setCurrencyDisplayPreference: () => {},
	activeCurrency: null,
	setActiveCurrency: () => {},
});

export const usePreferences = () => useContext(PreferencesContext);

const THEME_KEY = "appThemePreference";
// Older builds stored an explicit "light" | "dark" under this key.
const LEGACY_THEME_KEY = "appTheme";
const CURRENCY_DISPLAY_KEY = "currencyDisplay";
const ACTIVE_CURRENCY_KEY = "activeCurrency";

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const systemColorScheme = useColorScheme();
	const [themePreference, setThemePreferenceState] = useState<ThemePreference>("system");
	const [currencyDisplay, setCurrencyDisplayState] = useState<CurrencyDisplay>("standard");
	const [activeCurrency, setActiveCurrencyState] = useState<string | null>(null);

	useEffect(() => {
		const load = async () => {
			try {
				const [stored, legacy, display, active] = await Promise.all([
					AsyncStorage.getItem(THEME_KEY),
					AsyncStorage.getItem(LEGACY_THEME_KEY),
					AsyncStorage.getItem(CURRENCY_DISPLAY_KEY),
					AsyncStorage.getItem(ACTIVE_CURRENCY_KEY),
				]);
				if (active) setActiveCurrencyState(active);
				if (stored === "light" || stored === "dark" || stored === "system") {
					setThemePreferenceState(stored);
				} else if (legacy === "light" || legacy === "dark") {
					setThemePreferenceState(legacy);
				}
				if (display === "standard" || display === "short") {
					setCurrencyDisplayState(display);
				}
			} catch {
				// Preferences are cosmetic — fall back to the defaults.
			}
		};
		load();
	}, []);

	const setThemePreference = useCallback((next: ThemePreference) => {
		setThemePreferenceState(next);
		AsyncStorage.setItem(THEME_KEY, next).catch(() => {});
	}, []);

	const setCurrencyDisplayPreference = useCallback((next: CurrencyDisplay) => {
		setCurrencyDisplayState(next);
		AsyncStorage.setItem(CURRENCY_DISPLAY_KEY, next).catch(() => {});
	}, []);

	const setActiveCurrency = useCallback((next: string) => {
		setActiveCurrencyState(next);
		AsyncStorage.setItem(ACTIVE_CURRENCY_KEY, next).catch(() => {});
	}, []);

	// Formatting helpers read this module-level setting; update it before the
	// tree re-renders with the new theme below.
	setCurrencyDisplay(currencyDisplay);

	const isDark =
		themePreference === "system"
			? systemColorScheme === "dark"
			: themePreference === "dark";

	// A new theme object when the currency display changes makes every
	// component that reads the theme (all money displays do) re-render live.
	const theme = useMemo<AppTheme>(
		() => ({ ...(isDark ? DarkTheme : LightTheme), currencyDisplay }),
		[isDark, currencyDisplay]
	);

	useEffect(() => {
		// Paint the native root view so screen transitions never flash white.
		SystemUI.setBackgroundColorAsync(theme.colors.background).catch(() => {});
	}, [theme.colors.background]);

	const value = useMemo(
		() => ({
			theme,
			isDark,
			themePreference,
			setThemePreference,
			currencyDisplay,
			setCurrencyDisplayPreference,
			activeCurrency,
			setActiveCurrency,
		}),
		[theme, isDark, themePreference, setThemePreference, currencyDisplay, setCurrencyDisplayPreference, activeCurrency, setActiveCurrency]
	);

	return (
		<PreferencesContext.Provider value={value}>
			<PaperProvider theme={theme}>
				<StatusBar style={isDark ? "light" : "dark"} />
				<View style={{ flex: 1, backgroundColor: theme.colors.background }}>
					{children}
				</View>
			</PaperProvider>
		</PreferencesContext.Provider>
	);
};

/**
 * The shared overview currency, resolved against the currencies a screen
 * actually has data for (falls back to the first, i.e. most used).
 */
export const useActiveCurrency = (available: string[]) => {
	const { activeCurrency, setActiveCurrency } = usePreferences();
	const currency =
		activeCurrency && available.includes(activeCurrency) ? activeCurrency : available[0] ?? null;
	return [currency, setActiveCurrency] as const;
};
