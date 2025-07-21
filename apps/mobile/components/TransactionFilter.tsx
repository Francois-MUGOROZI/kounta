import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import {
	Button,
	Text,
	RadioButton,
	Divider,
	Chip,
	IconButton,
	useTheme,
	Portal,
	Dialog,
	TextInput,
} from "react-native-paper";
import { DatePickerModal } from "react-native-paper-dates";
import { Dropdown } from "react-native-paper-dropdown";
import { TransactionFilter as TransactionFilterType } from "../types";

interface TransactionFilterProps {
	transactionTypes: { label: string; value: number }[];
	categories: { label: string; value: number }[];
	onApply: (filters: TransactionFilterType) => void;
	onClear?: () => void;
	initialFilters?: TransactionFilterType;
}

const PERIODS = [
	{ label: "This Month", value: "month" },
	{ label: "This Year", value: "year" },
	{ label: "Custom", value: "custom" },
];

type DateRange = { startDate: Date | undefined; endDate: Date | undefined };

const getPeriodLabel = (period: string | undefined) => {
	if (period === "month") return "This Month";
	if (period === "year") return "This Year";
	if (period === "custom") return "Custom";
	return "";
};

export const TransactionFilter: React.FC<TransactionFilterProps> = ({
	transactionTypes,
	categories,
	onApply,
	onClear,
	initialFilters = {},
}) => {
	const theme = useTheme();
	const [open, setOpen] = useState(false);
	const [transactionTypeId, setTransactionTypeId] = useState<
		number | undefined
	>(initialFilters.transactionTypeId);
	const [categoryId, setCategoryId] = useState<number | undefined>(
		initialFilters.categoryId
	);
	const [period, setPeriod] = useState<string>(
		initialFilters.period || "month"
	);
	const [dateRange, setDateRange] = useState<DateRange | undefined>(
		initialFilters.startDate && initialFilters.endDate
			? {
					startDate: new Date(initialFilters.startDate),
					endDate: new Date(initialFilters.endDate),
			  }
			: undefined
	);
	const [showDatePicker, setShowDatePicker] = useState(false);

	// For displaying active filters
	const hasActiveFilters = Boolean(
		transactionTypeId ||
			categoryId ||
			(period && period !== "month") ||
			(period === "custom" && dateRange?.startDate && dateRange?.endDate)
	);

	const handleApply = () => {
		let startDate: string | undefined;
		let endDate: string | undefined;
		if (period === "custom" && dateRange?.startDate && dateRange?.endDate) {
			startDate = dateRange.startDate.toISOString().split("T")[0];
			endDate = dateRange.endDate.toISOString().split("T")[0];
		} else if (period === "month") {
			const now = new Date();
			startDate = new Date(now.getFullYear(), now.getMonth(), 1)
				.toISOString()
				.split("T")[0];
			endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
				.toISOString()
				.split("T")[0];
		} else if (period === "year") {
			const now = new Date();
			startDate = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0];
			endDate = new Date(now.getFullYear(), 11, 31).toISOString().split("T")[0];
		}
		onApply({
			transactionTypeId,
			categoryId,
			startDate,
			endDate,
			period,
		});
		setOpen(false);
	};

	const handleClear = () => {
		setTransactionTypeId(undefined);
		setCategoryId(undefined);
		setPeriod("month");
		setDateRange(undefined);
		if (onClear) onClear();
		setOpen(false);
	};

	// Helper for displaying selected filter values
	const getTypeLabel = () =>
		transactionTypes.find((t) => t.value === transactionTypeId)?.label;
	const getCategoryLabel = () =>
		categories.find((c) => c.value === categoryId)?.label;
	const getDateRangeLabel = () =>
		dateRange?.startDate && dateRange?.endDate
			? `${dateRange.startDate.toLocaleDateString()} - ${dateRange.endDate.toLocaleDateString()}`
			: "";

	return (
		<View style={{ zIndex: 100 }}>
			{/* Filter trigger button */}
			<Button
				icon="filter-variant"
				mode={hasActiveFilters ? "contained" : "outlined"}
				onPress={() => setOpen(true)}
				style={{ alignSelf: "flex-end", marginBottom: 8 }}
			>
				Filter
			</Button>

			{/* Display active filters as chips */}
			<View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 8 }}>
				{transactionTypeId && (
					<Chip
						style={{ marginRight: 4, marginBottom: 4 }}
						icon="swap-horizontal"
					>
						{getTypeLabel()}
					</Chip>
				)}
				{categoryId && (
					<Chip style={{ marginRight: 4, marginBottom: 4 }} icon="shape">
						{getCategoryLabel()}
					</Chip>
				)}
				{period && period !== "month" && (
					<Chip style={{ marginRight: 4, marginBottom: 4 }} icon="calendar">
						{getPeriodLabel(period)}
					</Chip>
				)}
				{period === "custom" && dateRange?.startDate && dateRange?.endDate && (
					<Chip
						style={{ marginRight: 4, marginBottom: 4 }}
						icon="calendar-range"
					>
						{getDateRangeLabel()}
					</Chip>
				)}
				{hasActiveFilters && (
					<IconButton
						icon="close"
						size={20}
						onPress={handleClear}
						style={{ marginLeft: 4, marginBottom: 4, alignSelf: "center" }}
						accessibilityLabel="Clear filters"
					/>
				)}
			</View>

			{/* Dialog for filter controls */}
			<Portal>
				<Dialog visible={open} onDismiss={() => setOpen(false)}>
					<Dialog.Title>Filter Transactions</Dialog.Title>
					<Dialog.Content>
						<Dropdown
							label={"Transaction Type"}
							value={
								transactionTypeId !== undefined
									? transactionTypeId.toString()
									: ""
							}
							onSelect={(v) =>
								setTransactionTypeId(v ? parseInt(v, 10) : undefined)
							}
							options={transactionTypes.map((type) => ({
								label: type.label,
								value: type.value.toString(),
							}))}
							CustomMenuHeader={() => null}
							CustomDropdownInput={(props) => (
								<TextInput
									{...props}
									value={
										transactionTypes.find(
											(type) =>
												type.value.toString() ===
												(transactionTypeId !== undefined
													? transactionTypeId.toString()
													: "")
										)?.label || ""
									}
									style={{
										backgroundColor: theme.colors.outlineVariant,
										marginBottom: 8,
									}}
									outlineColor={theme.colors.primary}
									activeOutlineColor={theme.colors.primary}
								/>
							)}
						/>
						<Dropdown
							label={"Category"}
							value={categoryId !== undefined ? categoryId.toString() : ""}
							onSelect={(v) => setCategoryId(v ? parseInt(v, 10) : undefined)}
							options={categories.map((cat) => ({
								label: cat.label,
								value: cat.value.toString(),
							}))}
							CustomMenuHeader={() => null}
							CustomDropdownInput={(props) => (
								<TextInput
									{...props}
									value={
										categories.find(
											(cat) =>
												cat.value.toString() ===
												(categoryId !== undefined ? categoryId.toString() : "")
										)?.label || ""
									}
									style={{
										backgroundColor: theme.colors.outlineVariant,
										marginBottom: 8,
									}}
									outlineColor={theme.colors.primary}
									activeOutlineColor={theme.colors.primary}
								/>
							)}
						/>
						<Divider style={{ marginVertical: 8 }} />
						<Text variant="labelLarge">Period</Text>
						<RadioButton.Group onValueChange={setPeriod} value={period}>
							{PERIODS.map((p) => (
								<RadioButton.Item
									key={p.value}
									label={p.label}
									value={p.value}
								/>
							))}
						</RadioButton.Group>
						{period === "custom" && (
							<>
								<Button
									mode="outlined"
									onPress={() => setShowDatePicker(true)}
									style={{ marginVertical: 8 }}
								>
									{dateRange?.startDate && dateRange?.endDate
										? `${dateRange.startDate.toLocaleDateString()} - ${dateRange.endDate.toLocaleDateString()}`
										: "Select Date Range"}
								</Button>
								<DatePickerModal
									locale=""
									mode="range"
									visible={showDatePicker}
									onDismiss={() => setShowDatePicker(false)}
									startDate={dateRange?.startDate}
									endDate={dateRange?.endDate}
									onConfirm={({
										startDate,
										endDate,
									}: {
										startDate: Date | undefined;
										endDate: Date | undefined;
									}) => {
										setDateRange({ startDate, endDate });
										setShowDatePicker(false);
									}}
								/>
							</>
						)}
					</Dialog.Content>
					<Dialog.Actions>
						<Button
							mode="contained"
							onPress={handleApply}
							style={styles.button}
						>
							Apply
						</Button>
						<Button mode="outlined" onPress={handleClear} style={styles.button}>
							Clear
						</Button>
					</Dialog.Actions>
				</Dialog>
			</Portal>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		// No longer used, Dialog handles its own styling
	},
	title: {
		marginBottom: 12,
	},
	input: {
		marginBottom: 8,
	},
	buttonRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginTop: 16,
	},
	button: {
		flex: 1,
		marginHorizontal: 4,
	},
});

export default TransactionFilter;
