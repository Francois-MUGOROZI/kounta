import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Sheet from "../ui/Sheet";
import AppButton from "../ui/AppButton";
import {
	AmountField,
	DateField,
	FormError,
	Segment,
	SegmentedControl,
	SelectField,
	TextField,
} from "../ui/fields";
import type { Option } from "../ui/Dropdown";
import type { IconName } from "../ui/icons";
import { radius, spacing, useKTheme } from "../../theme/theme";
import { Transaction } from "../../types";
import { formatAmount } from "../../utils/currency";
import { toLocalISODate } from "../../utils/date";
import { getCategoryIcon } from "../../constants/categoryIcons";
import { haptics } from "../../utils/haptics";
import { useGetTransactionTypes } from "../../hooks/transactionType/useGetTransactionTypes";
import { useGetAccounts } from "../../hooks/account/useGetAccounts";
import { useGetCategories } from "../../hooks/category/useGetCategories";
import { useGetAssets } from "../../hooks/asset/useGetAssets";
import { useGetLiabilities } from "../../hooks/liability/useGetLiabilities";
import { useGetEnvelopes } from "../../hooks/envelope/useGetEnvelope";
import { useGetBills } from "../../hooks/bill/useGetBills";
import { useGetReceivables } from "../../hooks/receivable/useGetReceivables";
import { useGetEntities } from "../../hooks/entity/useGetEntities";

export type TransactionKindName = "Expense" | "Income" | "Transfer";

export type TransferDirection =
	| "account-to-account"
	| "account-to-asset"
	| "asset-to-account"
	| "reinvest-into-asset"
	| "account-to-receivable"
	| "receivable-to-account"
	| "account-to-liability";

export interface TransactionPreset {
	type?: TransactionKindName;
	accountId?: number;
	envelopeId?: number;
	assetId?: number;
	entityId?: number;
	liabilityId?: number;
	receivableId?: number;
	billId?: number;
	categoryId?: number;
	/** Pre-filled amount, e.g. what's left to pay on a bill. */
	amount?: number;
	transferDirection?: TransferDirection;
}

const DIRECTIONS: Option<TransferDirection>[] = [
	{ value: "account-to-account", label: "Between accounts", description: "Move money from one account to another", icon: "swap-horizontal" },
	{ value: "account-to-asset", label: "Invest in an asset", description: "Account → asset (contribution)", icon: "chart-line" },
	{ value: "asset-to-account", label: "Withdraw from an asset", description: "Asset → account", icon: "cash-fast" },
	{ value: "reinvest-into-asset", label: "Reinvest returns", description: "Earnings kept inside the asset", icon: "autorenew" },
	{ value: "account-to-receivable", label: "Lend money", description: "Account → receivable (activates it)", icon: "hand-coin-outline" },
	{ value: "receivable-to-account", label: "Receive a repayment", description: "Receivable → account", icon: "cash-check" },
	{ value: "account-to-liability", label: "Pay back a liability", description: "Account → liability (reduces what you owe)", icon: "credit-card-clock-outline" },
];

const TYPE_ICONS: Record<TransactionKindName, IconName> = {
	Expense: "arrow-top-right",
	Income: "arrow-bottom-left",
	Transfer: "swap-horizontal",
};

interface FormBodyProps {
	preset: TransactionPreset;
	onCancel: () => void;
	/** `successMessage` is a short confirmation for the toast, e.g. "Repayment recorded". */
	onSubmit: (tx: Omit<Transaction, "id">, successMessage: string) => Promise<void>;
}

type Errors = Partial<
	Record<"amount" | "category" | "account" | "from" | "to" | "asset" | "receivable" | "liability", string>
>;

const TRANSFER_MESSAGES: Record<TransferDirection, string> = {
	"account-to-account": "Transfer saved",
	"account-to-asset": "Investment recorded",
	"asset-to-account": "Withdrawal recorded",
	"reinvest-into-asset": "Reinvestment recorded",
	"account-to-receivable": "Loan recorded",
	"receivable-to-account": "Repayment recorded",
	"account-to-liability": "Payment recorded",
};

const successMessageFor = (type: TransactionKindName, direction: TransferDirection, paidBill: boolean) => {
	if (type === "Transfer") return TRANSFER_MESSAGES[direction];
	if (paidBill) return "Bill payment recorded";
	return `${type} saved`;
};

// Remembers the account last used per type so the next entry is one tap shorter.
const lastAccount: Partial<Record<TransactionKindName, number>> = {};

const toId = (v: string | number | null | undefined) =>
	v === null || v === undefined || v === "" ? undefined : Number(v);

/** Form content — mounted only while the sheet is open so lookups don't run in the background. */
const FormBody: React.FC<FormBodyProps> = ({ preset, onCancel, onSubmit }) => {
	const theme = useKTheme();
	const { transactionTypes } = useGetTransactionTypes();
	const { accounts } = useGetAccounts();
	const { categories } = useGetCategories();
	const { assets } = useGetAssets();
	const { liabilities } = useGetLiabilities();
	const { envelopes } = useGetEnvelopes();
	const { bills } = useGetBills(undefined, true);
	const { receivables } = useGetReceivables();
	const { entities } = useGetEntities();

	// Fields that came from the screen the sheet was opened on stay fixed —
	// e.g. adding from an account's page always uses that account.
	const locked = {
		account: preset.accountId != null,
		asset: preset.assetId != null,
		receivable: preset.receivableId != null,
		envelope: preset.envelopeId != null,
		liability: preset.liabilityId != null,
		bill: preset.billId != null,
		entity: preset.entityId != null,
		category: preset.categoryId != null,
		direction: preset.transferDirection != null,
	};
	const allowedTypes: TransactionKindName[] =
		locked.direction || locked.receivable
			? ["Transfer"]
			: locked.envelope || locked.liability || locked.bill
			? ["Expense"]
			: locked.category && preset.type
			? [preset.type]
			: locked.entity
			? ["Expense", "Income"]
			: ["Expense", "Income", "Transfer"];

	const [type, setType] = useState<TransactionKindName>(preset.type ?? "Expense");
	const [direction, setDirection] = useState<TransferDirection>(
		preset.transferDirection ?? "account-to-account"
	);
	const [amount, setAmount] = useState(preset.amount ? String(preset.amount) : "");
	const [categoryId, setCategoryId] = useState<number | null>(preset.categoryId ?? null);
	const initialType = preset.type ?? "Expense";
	const transferFromSide =
		["account-to-account", "account-to-asset", "account-to-receivable", "account-to-liability"].includes(
			preset.transferDirection ?? "account-to-account"
		);
	const [fromAccountId, setFromAccountId] = useState<number | null>(
		initialType === "Expense"
			? preset.accountId ?? lastAccount.Expense ?? null
			: initialType === "Transfer" && transferFromSide
			? preset.accountId ?? null
			: null
	);
	const [toAccountId, setToAccountId] = useState<number | null>(
		initialType === "Income"
			? preset.accountId ?? lastAccount.Income ?? null
			: initialType === "Transfer" && !transferFromSide
			? preset.accountId ?? null
			: null
	);
	const [assetId, setAssetId] = useState<number | null>(preset.assetId ?? null);
	const [receivableId, setReceivableId] = useState<number | null>(preset.receivableId ?? null);
	const [envelopeId, setEnvelopeId] = useState<number | null>(preset.envelopeId ?? null);
	const [liabilityId, setLiabilityId] = useState<number | null>(preset.liabilityId ?? null);
	const [billId, setBillId] = useState<number | null>(preset.billId ?? null);
	const [entityId, setEntityId] = useState<number | null>(preset.entityId ?? null);
	const [description, setDescription] = useState("");
	const [date, setDate] = useState(toLocalISODate());
	const [showMore, setShowMore] = useState(
		!!(preset.entityId || preset.liabilityId || preset.billId || (preset.assetId && preset.type !== "Transfer"))
	);
	const isLockedAccount = (id: number | null) => locked.account && id != null && id === preset.accountId;
	const [errors, setErrors] = useState<Errors>({});
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [attempted, setAttempted] = useState(false);

	const typeId = transactionTypes.find((t) => t.name === type)?.id;

	const accountOptions = useMemo<Option<number>[]>(
		() =>
			accounts.map((a) => ({
				value: a.id,
				label: a.name,
				trailing: formatAmount(a.current_balance, a.currency),
				icon: "wallet-outline",
			})),
		[accounts]
	);

	const categoryOptions = useMemo<Option<number>[]>(
		() =>
			categories
				.filter((c) => c.transaction_type_id === typeId)
				.sort((a, b) => a.name.localeCompare(b.name))
				.map((c) => ({
					value: c.id,
					label: c.name,
					icon: getCategoryIcon(c.name, type === "Income" ? "income" : "expense"),
				})),
		[categories, typeId, type]
	);

	const assetOptions = useMemo<Option<number>[]>(
		() =>
			assets.map((a) => ({
				value: a.id,
				label: a.name,
				trailing: formatAmount(a.current_valuation, a.currency),
				icon: "diamond-stone",
			})),
		[assets]
	);

	const receivableOptions = useMemo<Option<number>[]>(() => {
		// Lending applies to Pending receivables; repayments to Active ones.
		const status = direction === "account-to-receivable" ? "Pending" : "Active";
		return receivables
			.filter((r) => r.status === status)
			.map((r) => ({
				value: r.id,
				label: r.title,
				description:
					status === "Pending"
						? `Principal ${formatAmount(r.principal, r.currency)}`
						: `Outstanding ${formatAmount(r.current_balance, r.currency)}`,
				icon: "hand-coin-outline",
			}));
	}, [receivables, direction]);

	const envelopeOptions = useMemo<Option<number>[]>(
		() =>
			envelopes.map((e) => ({
				value: e.id,
				label: e.name,
				trailing: formatAmount(e.current_balance, e.currency),
				icon: "email-outline",
			})),
		[envelopes]
	);

	const liabilityOptions = useMemo<Option<number>[]>(
		() =>
			liabilities
				// Only debts with something left to pay back, plus one opened from its own page.
				.filter((l) => l.current_balance > 0 || l.id === preset.liabilityId)
				.map((l) => ({
					value: l.id,
					label: l.name,
					trailing: formatAmount(l.current_balance, l.currency),
					icon: "credit-card-clock-outline",
				})),
		[liabilities, preset.liabilityId]
	);

	const billOptions = useMemo<Option<number>[]>(
		() =>
			bills.map((b) => ({
				value: b.id,
				label: b.name,
				trailing: formatAmount(b.amount - (b.paid_amount ?? 0), b.currency),
				icon: "calendar-clock-outline",
			})),
		[bills]
	);

	const entityOptions = useMemo<Option<number>[]>(
		() =>
			entities.map((e) => ({
				value: e.id,
				label: e.name,
				icon: e.is_individual ? "account-outline" : "domain",
			})),
		[entities]
	);

	const isTransfer = type === "Transfer";
	// An expense on a liability is a charge (interest, fee, penalty): it adds to the debt, no account pays it.
	// Only possible when opened from a liability's page ("Add charge").
	const isLiabilityCharge = type === "Expense" && locked.liability && !!liabilityId;
	const showFrom =
		!isTransfer
			? type === "Expense" && !isLiabilityCharge
			: ["account-to-account", "account-to-asset", "account-to-receivable", "account-to-liability"].includes(direction);
	const showTo =
		!isTransfer
			? type === "Income"
			: ["account-to-account", "asset-to-account", "receivable-to-account"].includes(direction);
	const showAssetForTransfer =
		isTransfer &&
		["account-to-asset", "asset-to-account", "reinvest-into-asset"].includes(direction);
	const showReceivable =
		isTransfer && ["account-to-receivable", "receivable-to-account"].includes(direction);
	const showLiabilityForTransfer = isTransfer && direction === "account-to-liability";

	const currency = useMemo(() => {
		// A charge is in the liability's currency; any remembered account is ignored.
		const acc = isLiabilityCharge ? undefined : accounts.find((a) => a.id === (fromAccountId ?? toAccountId));
		if (acc) return acc.currency;
		const ast = assets.find((a) => a.id === assetId);
		if (ast) return ast.currency;
		const rcv = receivables.find((r) => r.id === receivableId);
		if (rcv) return rcv.currency;
		const lia = liabilities.find((l) => l.id === liabilityId);
		if (lia) return lia.currency;
		// Nothing chosen yet: use the currency most accounts are in.
		const counts: Record<string, number> = {};
		accounts.forEach((a) => (counts[a.currency] = (counts[a.currency] ?? 0) + 1));
		return Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] ?? "RWF";
	}, [accounts, assets, receivables, liabilities, fromAccountId, toAccountId, assetId, receivableId, liabilityId, isLiabilityCharge]);

	// With a single account there's nothing to choose (account-to-account needs two).
	useEffect(() => {
		if (accounts.length !== 1) return;
		const only = accounts[0].id;
		if (showFrom && !showTo && !fromAccountId) setFromAccountId(only);
		if (showTo && !showFrom && !toAccountId) setToAccountId(only);
	}, [accounts, showFrom, showTo, fromAccountId, toAccountId]);

	// Lending must equal the principal — prefill it so the user doesn't have to.
	useEffect(() => {
		if (direction !== "account-to-receivable" || !receivableId) return;
		const rcv = receivables.find((r) => r.id === receivableId);
		if (rcv) setAmount(String(rcv.principal));
	}, [direction, receivableId, receivables]);

	const repaymentHint = useMemo(() => {
		if (!isTransfer) return undefined;
		if (direction === "account-to-liability") {
			const lia = liabilities.find((l) => l.id === liabilityId);
			return lia ? `Still owed: ${formatAmount(lia.current_balance, lia.currency)}` : undefined;
		}
		if (direction !== "receivable-to-account") return undefined;
		const rcv = receivables.find((r) => r.id === receivableId);
		return rcv ? `Outstanding: ${formatAmount(rcv.current_balance, rcv.currency)}` : undefined;
	}, [direction, isTransfer, receivables, receivableId, liabilities, liabilityId]);

	const currencyMismatch = useMemo(() => {
		if (!isTransfer || direction !== "account-to-account") return false;
		const a = accounts.find((x) => x.id === fromAccountId);
		const b = accounts.find((x) => x.id === toAccountId);
		return !!a && !!b && a.currency !== b.currency;
	}, [isTransfer, direction, accounts, fromAccountId, toAccountId]);

	const directionHasFrom = (d: TransferDirection) =>
		["account-to-account", "account-to-asset", "account-to-receivable", "account-to-liability"].includes(d);

	/** Puts the locked account on the side the type/direction uses. */
	const placeLockedAccount = (nextType: TransactionKindName, nextDirection: TransferDirection) => {
		const acc = preset.accountId ?? null;
		const onFrom = nextType === "Expense" || (nextType === "Transfer" && directionHasFrom(nextDirection));
		setFromAccountId(onFrom ? acc : null);
		setToAccountId(onFrom ? null : acc);
	};

	const changeType = (next: TransactionKindName) => {
		setType(next);
		if (!locked.category) setCategoryId(null);
		setErrors({});
		setSubmitError(null);
		setAttempted(false);
		const nextDirection: TransferDirection = locked.direction
			? direction
			: locked.account
			? "account-to-account"
			: "account-to-account";
		if (locked.account) {
			placeLockedAccount(next, nextDirection);
		} else if (next === "Income") {
			// Keep the chosen account when switching between expense and income.
			setToAccountId(fromAccountId ?? toAccountId);
			setFromAccountId(null);
		} else if (next === "Expense") {
			setFromAccountId(fromAccountId ?? toAccountId);
			setToAccountId(null);
		}
		if (next !== "Expense") {
			if (!locked.envelope) setEnvelopeId(null);
			if (!locked.bill) setBillId(null);
		}
		// A liability picked for a transfer must not carry over into another type.
		if (!locked.liability) setLiabilityId(null);
		if (next === "Transfer") {
			setDirection(nextDirection);
			if (!locked.asset) setAssetId(null);
			if (!locked.entity) setEntityId(null);
		}
		if (!locked.receivable) setReceivableId(null);
	};

	const changeDirection = (next: TransferDirection) => {
		setDirection(next);
		if (locked.account) {
			placeLockedAccount("Transfer", next);
		} else {
			setFromAccountId(null);
			setToAccountId(null);
		}
		if (!locked.asset) setAssetId(null);
		if (!locked.receivable) setReceivableId(null);
		if (!locked.liability) setLiabilityId(null);
		setErrors({});
	};

	// Transfer types that make sense for the locked context.
	const directionOptions = useMemo(
		() =>
			DIRECTIONS.filter((d) => {
				if (locked.account && d.value === "reinvest-into-asset") return false;
				if (locked.asset && !["account-to-asset", "asset-to-account", "reinvest-into-asset"].includes(d.value)) return false;
				if (locked.receivable && !["account-to-receivable", "receivable-to-account"].includes(d.value)) return false;
				if (locked.liability && d.value !== "account-to-liability") return false;
				return true;
			}),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[]
	);

	const validate = (): Errors => {
		const e: Errors = {};
		const value = Number(amount);
		if (!amount || isNaN(value) || value <= 0) e.amount = "Enter an amount greater than zero";
		if (isTransfer) {
			if (showFrom && !fromAccountId) e.from = "Choose the account money leaves";
			if (showTo && !toAccountId) e.to = "Choose the account money goes to";
			if (direction === "account-to-account" && fromAccountId && fromAccountId === toAccountId)
				e.to = "Pick a different account";
			if (showAssetForTransfer && !assetId) e.asset = "Choose an asset";
			if (showReceivable && !receivableId) e.receivable = "Choose a receivable";
			if (showLiabilityForTransfer && !liabilityId) e.liability = "Choose a liability";
		} else {
			if (!categoryId) e.category = "Choose a category";
			if (!isLiabilityCharge && !fromAccountId && !toAccountId) e.account = "Choose an account";
		}
		return e;
	};

	// Re-validate live once the user has tried to save.
	useEffect(() => {
		if (attempted) setErrors(validate());
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [attempted, amount, categoryId, fromAccountId, toAccountId, assetId, receivableId, liabilityId, direction, type]);

	const handleSave = async () => {
		setAttempted(true);
		setSubmitError(null);
		const e = validate();
		setErrors(e);
		if (Object.keys(e).length > 0 || !typeId) {
			haptics.warning();
			return;
		}

		let from: number | undefined;
		let to: number | undefined;
		let asset: number | undefined;
		let receivable: number | undefined;

		if (isTransfer) {
			if (direction === "account-to-account") {
				from = toId(fromAccountId);
				to = toId(toAccountId);
			} else if (direction === "account-to-asset") {
				from = toId(fromAccountId);
				asset = toId(assetId);
			} else if (direction === "asset-to-account") {
				to = toId(toAccountId);
				asset = toId(assetId);
			} else if (direction === "reinvest-into-asset") {
				asset = toId(assetId);
			} else if (direction === "account-to-receivable") {
				from = toId(fromAccountId);
				receivable = toId(receivableId);
			} else if (direction === "receivable-to-account") {
				to = toId(toAccountId);
				receivable = toId(receivableId);
			} else {
				from = toId(fromAccountId);
			}
		} else if (type === "Income") {
			to = toId(toAccountId);
			asset = toId(assetId);
		} else {
			from = isLiabilityCharge ? undefined : toId(fromAccountId);
			asset = toId(assetId);
		}

		setSaving(true);
		try {
			await onSubmit(
				{
					description: description.trim(),
					amount: Number(amount),
					transaction_type_id: typeId,
					from_account_id: from,
					to_account_id: to,
					category_id: !isTransfer ? toId(categoryId) ?? null : null,
					date,
					asset_id: asset,
					receivable_id: receivable,
					liability_id: isLiabilityCharge || showLiabilityForTransfer ? toId(liabilityId) : undefined,
					envelope_id: type === "Expense" && !isLiabilityCharge ? toId(envelopeId) : undefined,
					bill_id: type === "Expense" ? toId(billId) : undefined,
					entity_id: !isTransfer ? toId(entityId) : undefined,
				},
				successMessageFor(type, direction, preset.billId === billId && !!billId)
			);
			if (type === "Expense" && from) lastAccount.Expense = from;
			if (type === "Income" && to) lastAccount.Income = to;
		} catch (err) {
			setSubmitError(err instanceof Error ? err.message : "Could not save the transaction");
		} finally {
			setSaving(false);
		}
	};

	const today = toLocalISODate();
	const yesterday = toLocalISODate(new Date(Date.now() - 86_400_000));
	const tone = type === "Income" ? "income" : type === "Transfer" ? "transfer" : "expense";
	const moreCount = [assetId && !isTransfer, entityId, liabilityId, locked.bill && billId].filter(Boolean).length;

	return (
		<>
			<SegmentedControl<TransactionKindName>
				value={type}
				onChange={changeType}
				segments={(
					[
						{ value: "Expense", label: "Expense", icon: TYPE_ICONS.Expense, color: theme.custom.expense },
						{ value: "Income", label: "Income", icon: TYPE_ICONS.Income, color: theme.custom.income },
						{ value: "Transfer", label: "Transfer", icon: TYPE_ICONS.Transfer, color: theme.custom.transfer },
					] as Segment<TransactionKindName>[]
				).map((seg) => ({ ...seg, disabled: !allowedTypes.includes(seg.value) }))}
			/>

			<AmountField
				size="hero"
				value={amount}
				onChangeText={setAmount}
				currency={currency}
				tone={tone}
				error={errors.amount}
				autoFocus={!preset.amount && preset.transferDirection !== "account-to-receivable"}
				helper={repaymentHint}
			/>

			{isTransfer ? (
				<SelectField
					label="Transfer type"
					value={direction}
					options={directionOptions}
					onChange={(v) => v && changeDirection(v)}
					icon="swap-horizontal"
					locked={locked.direction}
				/>
			) : (
				<SelectField
					label="Category"
					value={categoryId}
					options={categoryOptions}
					onChange={setCategoryId}
					icon="shape-outline"
					locked={locked.category}
					error={errors.category}
					emptyMessage="No categories for this type yet. Add one under More › Categories."
				/>
			)}

			{showFrom ? (
				<SelectField
					label={isTransfer ? "From account" : "Paid from"}
					value={fromAccountId}
					options={accountOptions}
					onChange={setFromAccountId}
					icon="wallet-outline"
					locked={isLockedAccount(fromAccountId)}
					error={errors.from ?? (type === "Expense" ? errors.account : undefined)}
					emptyMessage="Add an account first from the Accounts tab."
				/>
			) : null}

			{showReceivable ? (
				<SelectField
					label={direction === "account-to-receivable" ? "Lend to (receivable)" : "Repayment of"}
					value={receivableId}
					options={receivableOptions}
					onChange={setReceivableId}
					icon="hand-coin-outline"
					locked={locked.receivable}
					error={errors.receivable}
					helper={
						direction === "account-to-receivable"
							? "The amount must equal the receivable's principal."
							: undefined
					}
					emptyMessage={
						direction === "account-to-receivable"
							? "No pending receivables waiting to be funded."
							: "No active receivables to collect."
					}
				/>
			) : null}

			{showLiabilityForTransfer ? (
				<SelectField
					label="Paying back"
					value={liabilityId}
					options={liabilityOptions}
					onChange={setLiabilityId}
					icon="credit-card-clock-outline"
					locked={locked.liability}
					error={errors.liability}
					emptyMessage="No liabilities with a balance to pay back."
				/>
			) : null}

			{showAssetForTransfer ? (
				<SelectField
					label={direction === "asset-to-account" ? "From asset" : "Asset"}
					value={assetId}
					options={assetOptions}
					onChange={setAssetId}
					icon="diamond-stone"
					locked={locked.asset}
					error={errors.asset}
					emptyMessage="Add an asset first under More › Assets."
				/>
			) : null}

			{showTo ? (
				<SelectField
					label={isTransfer ? "To account" : "Received into"}
					value={toAccountId}
					options={accountOptions}
					onChange={setToAccountId}
					icon="wallet-plus-outline"
					locked={isLockedAccount(toAccountId)}
					error={errors.to ?? (type === "Income" ? errors.account : undefined)}
					helper={currencyMismatch ? "Heads up: these accounts use different currencies." : undefined}
					emptyMessage="Add an account first from the Accounts tab."
				/>
			) : null}

			{/* A charge isn't paid from anything, so no envelope either. */}
			{type === "Expense" && !isLiabilityCharge ? (
				<SelectField
					label="Envelope (optional)"
					value={envelopeId}
					options={envelopeOptions}
					onChange={setEnvelopeId}
					icon="email-outline"
					locked={locked.envelope}
					clearable
					emptyMessage="No envelopes yet."
				/>
			) : null}

			<TextField
				label="Description (optional)"
				value={description}
				onChangeText={setDescription}
				helper={
					description
						? undefined
						: isTransfer
						? "Left blank, we'll describe where the money moved."
						: "Left blank, we'll name it after the category."
				}
			/>

			<DateField label="Date" value={date} onChange={setDate} style={{ marginBottom: spacing.sm }} />
			<View style={styles.chips}>
				{[
					{ label: "Today", value: today },
					{ label: "Yesterday", value: yesterday },
				].map((chip) => {
					const active = date === chip.value;
					return (
						<Pressable
							key={chip.label}
							onPress={() => setDate(chip.value)}
							style={[
								styles.chip,
								{
									backgroundColor: active ? theme.colors.primaryContainer : theme.colors.surfaceVariant,
								},
							]}
							accessibilityRole="button"
							accessibilityState={{ selected: active }}
						>
							<Text
								variant="labelMedium"
								style={{ color: active ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant }}
							>
								{chip.label}
							</Text>
						</Pressable>
					);
				})}
			</View>

			{!isTransfer ? (
				<>
					<Pressable
						onPress={() => setShowMore((v) => !v)}
						style={[styles.moreToggle, { borderColor: theme.colors.outlineVariant }]}
						accessibilityRole="button"
						accessibilityState={{ expanded: showMore }}
					>
						<MaterialCommunityIcons name="link-variant" size={18} color={theme.colors.primary} />
						<Text variant="labelLarge" style={{ color: theme.colors.primary, flex: 1, marginLeft: spacing.sm }}>
							Link to an asset or entity
							{moreCount ? ` (${moreCount})` : ""}
						</Text>
						<MaterialCommunityIcons
							name={showMore ? "chevron-up" : "chevron-down"}
							size={20}
							color={theme.colors.primary}
						/>
					</Pressable>
					{showMore ? (
						<View style={styles.moreBody}>
							<SelectField
								label="Asset"
								value={assetId}
								options={assetOptions}
								onChange={setAssetId}
								icon="diamond-stone"
								locked={locked.asset}
								clearable
								emptyMessage="No assets yet."
							/>
							<SelectField
								label="Entity"
								value={entityId}
								options={entityOptions}
								onChange={setEntityId}
								icon="account-group-outline"
								locked={locked.entity}
								clearable
								emptyMessage="No entities yet. Add them under More › Entities."
							/>
							{/* Bills and liabilities are only linked when the form is opened from their
							    own screen; a liability here means a charge, which a bill can't be. */}
							{type !== "Expense" ? null : locked.bill ? (
								<SelectField
									label="Bill"
									value={billId}
									options={billOptions}
									onChange={setBillId}
									icon="calendar-clock-outline"
									locked
								/>
							) : locked.liability ? (
								<SelectField
									label="Charge on liability"
									value={liabilityId}
									options={liabilityOptions}
									onChange={setLiabilityId}
									icon="credit-card-clock-outline"
									locked
									helper="Interest, fees or penalties the lender adds — increases what you owe, pays nothing."
								/>
							) : null}
						</View>
					) : null}
				</>
			) : null}

			<FormError message={submitError} />

			<View style={styles.actions}>
				<AppButton mode="text" onPress={onCancel} style={{ flex: 1 }}>
					Cancel
				</AppButton>
				<AppButton onPress={handleSave} loading={saving} icon="check" style={{ flex: 2 }}>
					{`Save ${type.toLowerCase()}`}
				</AppButton>
			</View>
		</>
	);
};

interface TransactionFormSheetProps {
	visible: boolean;
	preset: TransactionPreset;
	onDismiss: () => void;
	onSubmit: FormBodyProps["onSubmit"];
}

const TransactionFormSheet: React.FC<TransactionFormSheetProps> = ({
	visible,
	preset,
	onDismiss,
	onSubmit,
}) => {
	// Keep the body mounted through the close animation, then unmount it.
	const [mounted, setMounted] = useState(visible);
	const [session, setSession] = useState(0);
	useEffect(() => {
		if (visible) {
			setMounted(true);
			setSession((s) => s + 1);
		}
	}, [visible]);

	return (
		<Sheet
			visible={visible}
			onDismiss={() => {
				setMounted(false);
				onDismiss();
			}}
			title={preset.billId ? "Pay bill" : "New transaction"}
		>
			{mounted ? (
				<FormBody key={session} preset={preset} onCancel={onDismiss} onSubmit={onSubmit} />
			) : null}
		</Sheet>
	);
};

const styles = StyleSheet.create({
	chips: {
		flexDirection: "row",
		gap: spacing.sm,
		marginBottom: spacing.lg,
	},
	chip: {
		paddingHorizontal: spacing.md,
		paddingVertical: 6,
		borderRadius: radius.pill,
	},
	moreToggle: {
		flexDirection: "row",
		alignItems: "center",
		borderWidth: 1,
		borderStyle: "dashed",
		borderRadius: radius.md,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.md,
		marginBottom: spacing.md,
	},
	moreBody: {
		marginBottom: spacing.sm,
	},
	actions: {
		flexDirection: "row",
		gap: spacing.md,
		marginTop: spacing.sm,
	},
});

export default TransactionFormSheet;
