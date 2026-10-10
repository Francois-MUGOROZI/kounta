import React, { forwardRef, useMemo, useRef, useState } from "react";
import {
	Keyboard,
	KeyboardTypeOptions,
	Pressable,
	StyleProp,
	StyleSheet,
	TextInput as NativeTextInput,
	View,
	ViewStyle,
} from "react-native";
import { HelperText, Text, TextInput } from "react-native-paper";
import { BottomSheetTextInput, useBottomSheetInternal } from "@gorhom/bottom-sheet";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { DatePickerModal } from "react-native-paper-dates";
import { fontFamily, radius, spacing, useKTheme } from "../../theme/theme";
import { currencyLabel, getCurrencyDecimals } from "../../utils/currency";
import { formatMediumDate, parseLocalDate, toLocalISODate } from "../../utils/date";
import Dropdown, { Option } from "./Dropdown";
import type { IconName } from "./icons";
import { haptics } from "../../utils/haptics";

const INPUT_ROUNDNESS = 14;
const HERO_ROW_HEIGHT = 56;

/* ───────────────────────────── Text ───────────────────────────── */

interface TextFieldProps {
	label: string;
	value: string;
	onChangeText: (text: string) => void;
	error?: string | null;
	helper?: string;
	placeholder?: string;
	multiline?: boolean;
	keyboardType?: KeyboardTypeOptions;
	autoCapitalize?: "none" | "sentences" | "words" | "characters";
	maxLength?: number;
	left?: IconName;
	style?: StyleProp<ViewStyle>;
	autoFocus?: boolean;
	/** Called on the keyboard's return key; the field keeps focus. */
	onSubmitEditing?: () => void;
}

export const TextField: React.FC<TextFieldProps> = ({
	label,
	value,
	onChangeText,
	error,
	helper,
	placeholder,
	multiline,
	keyboardType,
	autoCapitalize = "sentences",
	maxLength,
	left,
	style,
	autoFocus,
	onSubmitEditing,
}) => {
	const theme = useKTheme();
	const inSheet = useBottomSheetInternal(true) !== null;
	return (
		<View style={[styles.field, style]}>
			<TextInput
				mode="outlined"
				label={label}
				value={value}
				onChangeText={onChangeText}
				error={!!error}
				placeholder={placeholder}
				multiline={multiline}
				keyboardType={keyboardType}
				autoCapitalize={autoCapitalize}
				maxLength={maxLength}
				autoFocus={autoFocus}
				onSubmitEditing={onSubmitEditing}
				submitBehavior={onSubmitEditing ? "submit" : undefined}
				returnKeyType={onSubmitEditing ? "done" : undefined}
				left={left ? <TextInput.Icon icon={left} /> : undefined}
				outlineColor={theme.colors.outlineVariant}
				theme={{ roundness: INPUT_ROUNDNESS }}
				style={[
					{ backgroundColor: theme.colors.surface },
					multiline && styles.multiline,
				]}
				render={
					inSheet
						? (props) => <BottomSheetTextInput {...(props as any)} />
						: undefined
				}
			/>
			<FieldHelper error={error} helper={helper} />
		</View>
	);
};

const FieldHelper: React.FC<{ error?: string | null; helper?: string }> = ({
	error,
	helper,
}) => {
	if (error) {
		return (
			<HelperText type="error" visible style={styles.helper}>
				{error}
			</HelperText>
		);
	}
	if (helper) {
		return (
			<HelperText type="info" visible style={styles.helper}>
				{helper}
			</HelperText>
		);
	}
	return null;
};

/* ──────────────────────────── Amount ──────────────────────────── */

/** Keeps digits and at most one decimal separator, capped at `decimals`. */
export const sanitizeAmount = (text: string, decimals: number): string => {
	let cleaned = text.replace(/[^0-9.]/g, "");
	const firstDot = cleaned.indexOf(".");
	if (firstDot !== -1) {
		cleaned =
			cleaned.slice(0, firstDot + 1) +
			cleaned.slice(firstDot + 1).replace(/\./g, "");
		if (decimals === 0) {
			cleaned = cleaned.slice(0, firstDot);
		} else {
			const [int, frac] = cleaned.split(".");
			cleaned = `${int}.${frac.slice(0, decimals)}`;
		}
	}
	// Drop leading zeros ("007" -> "7") but keep "0." while typing decimals.
	cleaned = cleaned.replace(/^0+(?=\d)/, "");
	return cleaned.slice(0, 15);
};

const groupDigits = (raw: string) => {
	if (!raw) return "";
	const [int, frac] = raw.split(".");
	const grouped = (int || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	return frac !== undefined ? `${grouped}.${frac}` : grouped;
};

interface AmountFieldProps {
	value: string;
	onChangeText: (raw: string) => void;
	currency?: string;
	label?: string;
	error?: string | null;
	helper?: string;
	/** Large centred hero input (transaction form) vs. regular field. */
	size?: "hero" | "regular";
	tone?: "default" | "income" | "expense" | "transfer";
	autoFocus?: boolean;
}

export const AmountField: React.FC<AmountFieldProps> = ({
	value,
	onChangeText,
	currency = "RWF",
	label = "Amount",
	error,
	helper,
	size = "regular",
	tone = "default",
	autoFocus,
}) => {
	const theme = useKTheme();
	const inSheet = useBottomSheetInternal(true) !== null;
	const decimals = getCurrencyDecimals(currency);
	const display = groupDigits(value);
	const InputComponent = (inSheet ? BottomSheetTextInput : NativeTextInput) as typeof NativeTextInput;

	const handleChange = (text: string) => onChangeText(sanitizeAmount(text, decimals));

	if (size === "hero") {
		const color =
			tone === "income"
				? theme.custom.income
				: tone === "expense"
				? theme.custom.expense
				: tone === "transfer"
				? theme.custom.transfer
				: theme.colors.onSurface;
		return (
			<View style={styles.heroAmount}>
				<Text
					variant="labelMedium"
					style={{ color: theme.colors.onSurfaceVariant, textTransform: "uppercase" }}
				>
					{label}
				</Text>
				<View style={styles.heroRow}>
					<Text style={[styles.heroCurrency, { color: theme.colors.onSurfaceVariant }]}>
						{currencyLabel(currency)}
					</Text>
					<InputComponent
						value={display}
						onChangeText={handleChange}
						keyboardType="decimal-pad"
						placeholder="0"
						placeholderTextColor={theme.colors.outline}
						autoFocus={autoFocus}
						selectionColor={theme.colors.primary}
						style={[styles.heroInput, { color }]}
						accessibilityLabel={label}
					/>
				</View>
				{error ? (
					<Text variant="bodySmall" style={{ color: theme.colors.error }}>
						{error}
					</Text>
				) : helper ? (
					<Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
						{helper}
					</Text>
				) : null}
			</View>
		);
	}

	return (
		<View style={styles.field}>
			<TextInput
				mode="outlined"
				label={label}
				value={display}
				onChangeText={handleChange}
				keyboardType="decimal-pad"
				error={!!error}
				autoFocus={autoFocus}
				outlineColor={theme.colors.outlineVariant}
				theme={{ roundness: INPUT_ROUNDNESS }}
				style={{ backgroundColor: theme.colors.surface }}
				right={<TextInput.Affix text={currencyLabel(currency)} />}
				render={
					inSheet
						? (props) => <BottomSheetTextInput {...(props as any)} />
						: undefined
				}
			/>
			<FieldHelper error={error} helper={helper} />
		</View>
	);
};

/* ──────────────────────────── Pressable field shell ──────────────────────────── */

interface FieldShellProps {
	label: string;
	value?: string;
	icon?: IconName;
	trailingIcon?: IconName;
	onPress: () => void;
	error?: string | null;
	helper?: string;
	disabled?: boolean;
	/** Fixed by context: shows a lock and can't be changed, without looking disabled. */
	locked?: boolean;
	style?: StyleProp<ViewStyle>;
}

/** Looks like an input; opens a picker when tapped. The ref is the dropdown anchor. */
const FieldShell = forwardRef<View, FieldShellProps>(function FieldShell(
	{ label, value, icon, trailingIcon = "chevron-down", onPress, error, helper, disabled, locked, style },
	ref
) {
	const theme = useKTheme();
	const hasValue = !!value;
	return (
		<View style={[styles.field, style]}>
			<View ref={ref} collapsable={false}>
			<Pressable
				onPress={() => {
					Keyboard.dismiss();
					onPress();
				}}
				disabled={disabled || locked}
				android_ripple={{ color: theme.colors.surfaceDisabled }}
				accessibilityRole="button"
				accessibilityLabel={`${label}${hasValue ? `: ${value}` : ""}${locked ? ", fixed" : ""}`}
				style={[
					styles.shell,
					{
						borderColor: error ? theme.colors.error : theme.colors.outlineVariant,
						backgroundColor: locked ? theme.colors.surfaceVariant : theme.colors.surface,
						opacity: disabled ? 0.5 : 1,
					},
				]}
			>
				{icon ? (
					<MaterialCommunityIcons
						name={icon}
						size={20}
						color={theme.colors.onSurfaceVariant}
						style={styles.shellIcon}
					/>
				) : null}
				<View style={styles.shellBody}>
					<Text
						variant={hasValue ? "labelSmall" : "bodyLarge"}
						style={{
							color: error ? theme.colors.error : theme.colors.onSurfaceVariant,
						}}
					>
						{label}
					</Text>
					{hasValue ? (
						<Text
							variant="bodyLarge"
							numberOfLines={1}
							style={{ color: theme.colors.onSurface }}
						>
							{value}
						</Text>
					) : null}
				</View>
				<MaterialCommunityIcons
					name={locked ? "lock-outline" : trailingIcon}
					size={locked ? 18 : 22}
					color={theme.colors.onSurfaceVariant}
				/>
			</Pressable>
			</View>
			<FieldHelper error={error} helper={helper} />
		</View>
	);
});

/* ──────────────────────────── Select ──────────────────────────── */

interface SelectFieldProps<V extends string | number> {
	label: string;
	value: V | null | undefined;
	options: Option<V>[];
	onChange: (value: V | null) => void;
	icon?: IconName;
	error?: string | null;
	helper?: string;
	/** Adds a "None" choice that clears the value. */
	clearable?: boolean;
	disabled?: boolean;
	locked?: boolean;
	emptyMessage?: string;
	style?: StyleProp<ViewStyle>;
}

export function SelectField<V extends string | number>({
	label,
	value,
	options,
	onChange,
	icon,
	error,
	helper,
	clearable,
	disabled,
	locked,
	emptyMessage,
	style,
}: SelectFieldProps<V>) {
	const [open, setOpen] = useState(false);
	const anchor = useRef<View>(null);
	const selected = useMemo(
		() => options.find((o) => o.value === value),
		[options, value]
	);
	return (
		<>
			<FieldShell
				ref={anchor}
				label={label}
				value={selected?.label}
				icon={selected?.icon ?? icon}
				onPress={() => setOpen(true)}
				error={error}
				helper={helper}
				disabled={disabled}
				locked={locked}
				style={style}
			/>
			<Dropdown
				visible={open}
				onDismiss={() => setOpen(false)}
				anchor={anchor}
				options={options}
				selected={value ?? null}
				clearable={clearable}
				emptyMessage={emptyMessage}
				onSelect={(v) => {
					onChange(v);
					setOpen(false);
				}}
			/>
		</>
	);
}

/* ──────────────────────────── Date ──────────────────────────── */

interface DateFieldProps {
	label: string;
	/** Local "YYYY-MM-DD". */
	value: string;
	onChange: (value: string) => void;
	error?: string | null;
	style?: StyleProp<ViewStyle>;
}

export const DateField: React.FC<DateFieldProps> = ({
	label,
	value,
	onChange,
	error,
	style,
}) => {
	const [open, setOpen] = useState(false);
	const date = value ? parseLocalDate(value) : undefined;
	return (
		<>
			<FieldShell
				label={label}
				value={date ? formatMediumDate(date) : undefined}
				icon="calendar-blank-outline"
				trailingIcon="calendar"
				onPress={() => setOpen(true)}
				error={error}
				style={style}
			/>
			<DatePickerModal
				locale="en-GB"
				mode="single"
				visible={open}
				date={date}
				onDismiss={() => setOpen(false)}
				onConfirm={({ date: picked }) => {
					setOpen(false);
					if (picked) onChange(toLocalISODate(picked));
				}}
			/>
		</>
	);
};

/* ──────────────────────────── Segmented ──────────────────────────── */

export interface Segment<V extends string> {
	value: V;
	label: string;
	icon?: IconName;
	/** Colour of the selected segment (defaults to primary). */
	color?: string;
	disabled?: boolean;
}

interface SegmentedControlProps<V extends string> {
	segments: Segment<V>[];
	value: V;
	onChange: (value: V) => void;
	style?: StyleProp<ViewStyle>;
}

export function SegmentedControl<V extends string>({
	segments,
	value,
	onChange,
	style,
}: SegmentedControlProps<V>) {
	const theme = useKTheme();
	return (
		<View
			style={[styles.segmented, { backgroundColor: theme.colors.surfaceVariant }, style]}
			accessibilityRole="tablist"
		>
			{segments.map((segment) => {
				const active = segment.value === value;
				const activeColor = segment.color ?? theme.colors.primary;
				return (
					<Pressable
						key={segment.value}
						disabled={segment.disabled}
						onPress={() => {
							if (!active) haptics.selection();
							onChange(segment.value);
						}}
						accessibilityRole="tab"
						accessibilityState={{ selected: active, disabled: segment.disabled }}
						style={[
							styles.segment,
							segment.disabled && !active && { opacity: 0.35 },
							active && {
								backgroundColor: theme.colors.surface,
								shadowColor: "#000",
								shadowOpacity: 0.08,
								shadowRadius: 4,
								shadowOffset: { width: 0, height: 1 },
								elevation: 2,
							},
						]}
					>
						{segment.icon ? (
							<MaterialCommunityIcons
								name={segment.icon}
								size={16}
								color={active ? activeColor : theme.colors.onSurfaceVariant}
								style={{ marginRight: 6 }}
							/>
						) : null}
						<Text
							variant="labelLarge"
							numberOfLines={1}
							style={{ color: active ? activeColor : theme.colors.onSurfaceVariant }}
						>
							{segment.label}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
}

/* ──────────────────────────── Form error banner ──────────────────────────── */

export const FormError: React.FC<{ message?: string | null }> = ({ message }) => {
	const theme = useKTheme();
	if (!message) return null;
	return (
		<View
			style={[styles.formError, { backgroundColor: theme.colors.errorContainer }]}
			accessibilityRole="alert"
			accessibilityLiveRegion="polite"
		>
			<MaterialCommunityIcons
				name="alert-circle-outline"
				size={18}
				color={theme.colors.onErrorContainer}
			/>
			<Text
				variant="bodyMedium"
				style={{ color: theme.colors.onErrorContainer, flex: 1, marginLeft: spacing.sm }}
			>
				{message}
			</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	field: {
		marginBottom: spacing.md,
	},
	helper: {
		paddingHorizontal: spacing.xs,
	},
	multiline: {
		minHeight: 88,
	},
	shell: {
		flexDirection: "row",
		alignItems: "center",
		minHeight: 56,
		borderWidth: 1,
		borderRadius: INPUT_ROUNDNESS,
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.sm,
		overflow: "hidden",
	},
	shellIcon: {
		marginRight: spacing.md,
	},
	shellBody: {
		flex: 1,
		justifyContent: "center",
	},
	heroAmount: {
		alignItems: "center",
		paddingVertical: spacing.md,
		marginBottom: spacing.sm,
	},
	heroRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		maxWidth: "100%",
		marginTop: spacing.xs,
	},
	// Currency and amount share one fixed-height row with font padding removed,
	// so their glyphs centre on the same line regardless of font size.
	heroCurrency: {
		fontFamily: fontFamily.displayMedium,
		fontSize: 22,
		height: HERO_ROW_HEIGHT,
		lineHeight: HERO_ROW_HEIGHT,
		includeFontPadding: false,
		textAlignVertical: "center",
		marginRight: spacing.sm,
	},
	heroInput: {
		fontFamily: fontFamily.display,
		fontSize: 40,
		height: HERO_ROW_HEIGHT,
		minWidth: 40,
		paddingVertical: 0,
		paddingHorizontal: 0,
		includeFontPadding: false,
		textAlign: "center",
		textAlignVertical: "center",
	},
	segmented: {
		flexDirection: "row",
		borderRadius: radius.lg,
		padding: 4,
		marginBottom: spacing.lg,
	},
	segment: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 10,
		borderRadius: radius.md,
	},
	formError: {
		flexDirection: "row",
		alignItems: "flex-start",
		padding: spacing.md,
		borderRadius: radius.md,
		marginBottom: spacing.md,
	},
});
