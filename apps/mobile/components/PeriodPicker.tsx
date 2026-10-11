import React, { useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Dropdown from "./ui/Dropdown";
import type { TransactionListRow } from "./TransactionSectionList";
import { Period, PERIOD_OPTIONS, periodLabel, periodRange } from "../constants/periods";
import { toDayKey } from "../utils/date";
import { radius, spacing, useKTheme } from "../theme/theme";

/** Pill that opens the period menu (This month / Last month / This year / All time). */
const PeriodPicker: React.FC<{ value: Period; onChange: (period: Period) => void }> = ({ value, onChange }) => {
	const theme = useKTheme();
	const anchor = useRef<View>(null);
	const [open, setOpen] = useState(false);
	const label = periodLabel(value);
	return (
		<>
			<Pressable
				ref={anchor}
				onPress={() => setOpen(true)}
				hitSlop={8}
				accessibilityRole="button"
				accessibilityLabel={`Period: ${label}. Change period`}
				style={[styles.pill, { borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surface }]}
			>
				<Text variant="labelLarge" style={{ color: theme.colors.onSurface }}>
					{label}
				</Text>
				<MaterialCommunityIcons name="chevron-down" size={16} color={theme.colors.onSurface} />
			</Pressable>
			<Dropdown
				visible={open}
				onDismiss={() => setOpen(false)}
				anchor={anchor}
				variant="menu"
				alignRight
				minWidth={190}
				options={PERIOD_OPTIONS}
				onSelect={(p) => {
					setOpen(false);
					if (p) onChange(p);
				}}
			/>
		</>
	);
};

/** Period state for a transaction list, plus the rows that fall inside it. */
export const usePeriodRows = (rows: TransactionListRow[], initial: Period = "all") => {
	const [period, setPeriod] = useState<Period>(initial);
	const periodRows = useMemo(() => {
		const { startDate, endDate } = periodRange(period);
		return rows.filter((r) => {
			const day = toDayKey(r.tx.date);
			return day >= startDate && day <= endDate;
		});
	}, [rows, period]);
	return { period, setPeriod, periodRows };
};

const styles = StyleSheet.create({
	pill: {
		flexDirection: "row",
		alignItems: "center",
		gap: 2,
		height: 32,
		paddingHorizontal: spacing.md,
		borderRadius: radius.pill,
		borderWidth: StyleSheet.hairlineWidth,
	},
});

export default PeriodPicker;
