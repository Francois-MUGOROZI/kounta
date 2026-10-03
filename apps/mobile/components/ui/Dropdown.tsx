import React, { useEffect, useMemo, useState } from "react";
import {
	Keyboard,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	StatusBar,
	StyleSheet,
	TextInput,
	View,
	useWindowDimensions,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import IconBadge from "./IconBadge";
import type { IconName } from "./icons";
import { fontFamily, radius, spacing, tabularNums, useKTheme } from "../../theme/theme";
import { haptics } from "../../utils/haptics";

export interface Option<V extends string | number> {
	value: V;
	label: string;
	description?: string;
	/** Short trailing text, e.g. a balance. */
	trailing?: string;
	icon?: IconName;
	/** Tint for the icon (menus); defaults to the tinted badge style. */
	destructive?: boolean;
	disabled?: boolean;
}

/** A view the dropdown positions itself against. */
export type Anchor = React.RefObject<View | null>;

interface DropdownProps<V extends string | number> {
	visible: boolean;
	onDismiss: () => void;
	anchor: Anchor;
	options: Option<V>[];
	onSelect: (value: V | null) => void;
	selected?: V | null;
	/** Adds a "None" row that clears the value. */
	clearable?: boolean;
	/** Search box; on by default for long lists. */
	searchable?: boolean;
	emptyMessage?: string;
	/** "menu" = compact action list (no selection marks, plain icons). */
	variant?: "select" | "menu";
	/** Align the popover's right edge with the anchor's (e.g. header menus). */
	alignRight?: boolean;
	minWidth?: number;
}

const SEARCH_THRESHOLD = 8;
const STATUS_BAR_OFFSET = Platform.OS === "android" ? StatusBar.currentHeight ?? 0 : 0;
const MAX_HEIGHT = 380;
const GAP = 6;
const EDGE = 12;

interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}

/**
 * Anchored dropdown: opens next to the control that triggered it, flips above
 * when there isn't room below, and offers search for long lists.
 */
function Dropdown<V extends string | number>({
	visible,
	onDismiss,
	anchor,
	options,
	onSelect,
	selected = null,
	clearable,
	searchable,
	emptyMessage = "Nothing to choose from yet.",
	variant = "select",
	alignRight,
	minWidth = 200,
}: DropdownProps<V>) {
	const theme = useKTheme();
	const insets = useSafeAreaInsets();
	const window = useWindowDimensions();
	const [rect, setRect] = useState<Rect | null>(null);
	const [query, setQuery] = useState("");
	const [keyboardHeight, setKeyboardHeight] = useState(0);
	const showSearch = searchable ?? options.length > SEARCH_THRESHOLD;

	useEffect(() => {
		if (!visible) {
			setRect(null);
			return;
		}
		setQuery("");
		Keyboard.dismiss();
		// On Android, view coordinates start below the status bar while the
		// translucent modal draws from the top of the screen.
		anchor.current?.measureInWindow((x, y, width, height) =>
			setRect({ x, y: y + STATUS_BAR_OFFSET, width, height })
		);
	}, [visible, anchor]);

	useEffect(() => {
		if (!visible) return;
		const show = Keyboard.addListener("keyboardDidShow", (e) => setKeyboardHeight(e.endCoordinates.height));
		const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboardHeight(0));
		return () => {
			show.remove();
			hide.remove();
			setKeyboardHeight(0);
		};
	}, [visible]);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return options;
		return options.filter(
			(o) => o.label.toLowerCase().includes(q) || o.description?.toLowerCase().includes(q)
		);
	}, [options, query]);

	const choose = (value: V | null) => {
		haptics.selection();
		onSelect(value);
	};

	// Placement: below the anchor when it fits, otherwise above.
	const placement = useMemo(() => {
		if (!rect) return null;
		const top = Math.max(insets.top, STATUS_BAR_OFFSET) + EDGE;
		const bottom = window.height - Math.max(insets.bottom, EDGE) - keyboardHeight;
		const spaceBelow = bottom - (rect.y + rect.height + GAP);
		const spaceAbove = rect.y - GAP - top;
		const below = spaceBelow >= Math.min(MAX_HEIGHT, 240) || spaceBelow >= spaceAbove;
		const maxHeight = Math.max(120, Math.min(MAX_HEIGHT, below ? spaceBelow : spaceAbove));
		const width = Math.min(Math.max(rect.width, minWidth), window.width - EDGE * 2);
		let left = alignRight ? rect.x + rect.width - width : rect.x;
		left = Math.max(EDGE, Math.min(left, window.width - width - EDGE));
		return below
			? { left, width, maxHeight, top: rect.y + rect.height + GAP }
			: { left, width, maxHeight, bottom: window.height - rect.y + GAP };
	}, [rect, insets, window, keyboardHeight, minWidth, alignRight]);

	const isMenu = variant === "menu";

	const renderRow = (key: string, label: string, isSelected: boolean, onPress: () => void, option?: Option<V>) => {
		const fg = option?.destructive
			? theme.colors.error
			: isSelected
			? theme.colors.onPrimaryContainer
			: theme.colors.onSurface;
		return (
			<Pressable
				key={key}
				onPress={onPress}
				disabled={option?.disabled}
				android_ripple={{ color: theme.colors.surfaceDisabled }}
				accessibilityRole={isMenu ? "menuitem" : "button"}
				accessibilityState={{ selected: isSelected, disabled: option?.disabled }}
				style={[
					styles.row,
					isMenu && styles.menuRow,
					isSelected && { backgroundColor: theme.colors.primaryContainer },
					option?.disabled && { opacity: 0.45 },
				]}
			>
				{option?.icon ? (
					isMenu ? (
						<MaterialCommunityIcons name={option.icon} size={20} color={fg} style={styles.menuIcon} />
					) : (
						<View style={styles.icon}>
							<IconBadge icon={option.icon} size={32} />
						</View>
					)
				) : null}
				<View style={styles.body}>
					<Text variant={isMenu ? "bodyLarge" : "bodyMedium"} numberOfLines={1} style={{ color: fg }}>
						{label}
					</Text>
					{option?.description ? (
						<Text variant="bodySmall" numberOfLines={2} style={{ color: theme.colors.onSurfaceVariant }}>
							{option.description}
						</Text>
					) : null}
				</View>
				{option?.trailing ? (
					<Text
						variant="labelMedium"
						numberOfLines={1}
						style={{ color: theme.colors.onSurfaceVariant, marginLeft: spacing.sm, ...tabularNums }}
					>
						{option.trailing}
					</Text>
				) : null}
				{isSelected ? (
					<MaterialCommunityIcons name="check" size={18} color={theme.colors.primary} style={{ marginLeft: spacing.sm }} />
				) : null}
			</Pressable>
		);
	};

	return (
		<Modal
			visible={visible}
			transparent
			animationType="none"
			statusBarTranslucent
			navigationBarTranslucent
			onRequestClose={onDismiss}
		>
			<Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} accessibilityLabel="Close menu" />
			{placement ? (
				<Animated.View
					entering={FadeIn.duration(120)}
					style={[
						styles.popover,
						{
							left: placement.left,
							width: placement.width,
							maxHeight: placement.maxHeight,
							top: placement.top,
							bottom: placement.bottom,
							backgroundColor: theme.colors.elevation.level2,
							borderColor: theme.custom.cardBorder,
						},
					]}
				>
					{showSearch ? (
						<View style={[styles.search, { backgroundColor: theme.colors.surfaceVariant }]}>
							<MaterialCommunityIcons name="magnify" size={18} color={theme.colors.onSurfaceVariant} />
							<TextInput
								value={query}
								onChangeText={setQuery}
								placeholder="Search"
								placeholderTextColor={theme.colors.onSurfaceVariant}
								autoCapitalize="none"
								autoCorrect={false}
								style={[styles.searchInput, { color: theme.colors.onSurface }]}
								accessibilityLabel="Search options"
							/>
						</View>
					) : null}
					<ScrollView keyboardShouldPersistTaps="handled" bounces={false} contentContainerStyle={styles.list}>
						{clearable && !query ? renderRow("__none", "None", selected === null, () => choose(null)) : null}
						{filtered.map((o) => renderRow(String(o.value), o.label, !isMenu && o.value === selected, () => choose(o.value), o))}
						{filtered.length === 0 ? (
							<Text variant="bodySmall" style={[styles.empty, { color: theme.colors.onSurfaceVariant }]}>
								{query ? `No matches for “${query}”.` : emptyMessage}
							</Text>
						) : null}
					</ScrollView>
				</Animated.View>
			) : null}
		</Modal>
	);
}

const styles = StyleSheet.create({
	popover: {
		position: "absolute",
		borderRadius: radius.lg,
		borderWidth: StyleSheet.hairlineWidth,
		overflow: "hidden",
		shadowColor: "#000",
		shadowOpacity: 0.18,
		shadowRadius: 16,
		shadowOffset: { width: 0, height: 6 },
		elevation: 8,
	},
	list: {
		paddingVertical: spacing.xs,
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: spacing.md,
		paddingVertical: 10,
		minHeight: 44,
		marginHorizontal: spacing.xs,
		borderRadius: radius.sm,
	},
	menuRow: {
		paddingVertical: spacing.md,
		paddingRight: spacing.xl,
	},
	icon: {
		marginRight: spacing.md,
	},
	menuIcon: {
		marginRight: spacing.md,
	},
	body: {
		flex: 1,
	},
	search: {
		flexDirection: "row",
		alignItems: "center",
		borderRadius: radius.md,
		paddingHorizontal: spacing.md,
		height: 40,
		margin: spacing.sm,
		marginBottom: spacing.xs,
	},
	searchInput: {
		flex: 1,
		marginLeft: spacing.sm,
		fontFamily: fontFamily.regular,
		fontSize: 14,
		paddingVertical: 0,
	},
	empty: {
		textAlign: "center",
		paddingVertical: spacing.lg,
		paddingHorizontal: spacing.md,
	},
});

export default Dropdown;
