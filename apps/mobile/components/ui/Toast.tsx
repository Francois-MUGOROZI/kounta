import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { radius, spacing, useKTheme } from "../../theme/theme";
import { haptics } from "../../utils/haptics";
import type { IconName } from "./icons";

type ToastType = "success" | "error" | "info";

interface ToastOptions {
	type?: ToastType;
	action?: { label: string; onPress: () => void };
	duration?: number;
}

interface ToastState extends ToastOptions {
	id: number;
	message: string;
}

interface ToastContextValue {
	show: (message: string, options?: ToastOptions) => void;
	success: (message: string) => void;
	error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
	show: () => {},
	success: () => {},
	error: () => {},
});

export const useToast = () => useContext(ToastContext);

/** Height above the bottom inset — clears the tab bar and FABs. */
const BOTTOM_OFFSET = 88;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const theme = useKTheme();
	const insets = useSafeAreaInsets();
	const [toast, setToast] = useState<ToastState | null>(null);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const counter = useRef(0);

	const hide = useCallback(() => {
		if (timer.current) clearTimeout(timer.current);
		setToast(null);
	}, []);

	const show = useCallback((message: string, options: ToastOptions = {}) => {
		if (timer.current) clearTimeout(timer.current);
		const type = options.type ?? "info";
		if (type === "success") haptics.success();
		if (type === "error") haptics.error();
		counter.current += 1;
		setToast({ id: counter.current, message, ...options, type });
	}, []);

	useEffect(() => {
		if (!toast) return;
		const duration =
			toast.duration ?? (toast.type === "error" ? 5000 : toast.action ? 4500 : 2600);
		timer.current = setTimeout(() => setToast(null), duration);
		return () => {
			if (timer.current) clearTimeout(timer.current);
		};
	}, [toast]);

	const value = useMemo(
		() => ({
			show,
			success: (message: string) => show(message, { type: "success" }),
			error: (message: string) => show(message, { type: "error" }),
		}),
		[show]
	);

	const icon: IconName =
		toast?.type === "success"
			? "check-circle"
			: toast?.type === "error"
			? "alert-circle"
			: "information";
	const iconColor =
		toast?.type === "success"
			? theme.custom.income
			: toast?.type === "error"
			? theme.colors.error
			: theme.colors.inversePrimary;

	return (
		<ToastContext.Provider value={value}>
			{children}
			<View
				pointerEvents="box-none"
				style={[styles.host, { bottom: insets.bottom + BOTTOM_OFFSET }]}
			>
				{toast ? (
					<Animated.View
						key={toast.id}
						entering={FadeInDown.springify().damping(18)}
						exiting={FadeOutDown.duration(180)}
						style={[styles.toast, { backgroundColor: theme.colors.inverseSurface }]}
						accessibilityRole="alert"
						accessibilityLiveRegion="polite"
					>
						<MaterialCommunityIcons
							name={icon}
							size={20}
							color={toast.type === "error" ? "#FF8A80" : iconColor}
						/>
						<Text
							variant="bodyMedium"
							style={[styles.message, { color: theme.colors.inverseOnSurface }]}
							numberOfLines={3}
						>
							{toast.message}
						</Text>
						{toast.action ? (
							<Pressable
								onPress={() => {
									toast.action?.onPress();
									hide();
								}}
								hitSlop={8}
								accessibilityRole="button"
							>
								<Text
									variant="labelLarge"
									style={{ color: theme.colors.inversePrimary }}
								>
									{toast.action.label}
								</Text>
							</Pressable>
						) : (
							<Pressable onPress={hide} hitSlop={10} accessibilityLabel="Dismiss">
								<MaterialCommunityIcons
									name="close"
									size={18}
									color={theme.colors.inverseOnSurface}
									style={{ opacity: 0.7 }}
								/>
							</Pressable>
						)}
					</Animated.View>
				) : null}
			</View>
		</ToastContext.Provider>
	);
};

const styles = StyleSheet.create({
	host: {
		position: "absolute",
		left: spacing.lg,
		right: spacing.lg,
		alignItems: "center",
	},
	toast: {
		flexDirection: "row",
		alignItems: "center",
		borderRadius: radius.lg,
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.md,
		width: "100%",
		maxWidth: 480,
		gap: spacing.md,
		shadowColor: "#000",
		shadowOpacity: 0.2,
		shadowRadius: 12,
		shadowOffset: { width: 0, height: 4 },
		elevation: 6,
	},
	message: {
		flex: 1,
	},
});
