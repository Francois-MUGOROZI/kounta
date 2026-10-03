import React, { useLayoutEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { IconButton, Text } from "react-native-paper";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import HeroCard from "../components/ui/HeroCard";
import AmountText from "../components/ui/AmountText";
import EmptyState from "../components/ui/EmptyState";
import { SkeletonList } from "../components/ui/Skeleton";
import { useToast } from "../components/ui/Toast";
import ActionRow from "../components/ui/ActionRow";
import StatGrid from "../components/ui/StatGrid";
import TransactionSectionList, { useDescribedTransactions } from "../components/TransactionSectionList";
import AccountFormSheet, { AccountFormValues } from "../components/AccountFormSheet";
import { useQuery } from "../hooks/useQuery";
import { useGetAccountTypes } from "../hooks/accountType/useGetAccountTypes";
import { useGetTransactions } from "../hooks/transaction/useGetTransactions";
import { useUpdateAccount } from "../hooks/account/useUpdateAccount";
import { useTransactionComposer } from "../contexts/TransactionComposer";
import { AccountRepository } from "../repositories/AccountRepository";
import { Account, RootStackParamList } from "../types";
import { formatAmount } from "../utils/currency";
import { maskAccountNumber } from "../utils/format";
import { isSameMonth, parseLocalDate } from "../utils/date";
import { getAccountTypeIcon } from "../constants/typeIcons";
import { spacing, useKTheme } from "../theme/theme";
import IconBadge from "../components/ui/IconBadge";

type Route = RouteProp<RootStackParamList, "AccountDetail">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const AccountDetailScreen = () => {
	const theme = useKTheme();
	const navigation = useNavigation<Nav>();
	const { accountId } = useRoute<Route>().params;
	const toast = useToast();
	const { openComposer } = useTransactionComposer();
	const { accountTypes } = useGetAccountTypes();
	const { updateAccount } = useUpdateAccount();
	const [editVisible, setEditVisible] = useState(false);

	const {
		data: account,
		loading,
		error,
		refresh,
	} = useQuery<Account | null>((db) => AccountRepository.getById(db, accountId), [accountId], null, "Failed to load account");
	const filter = useMemo(() => ({ accountId }), [accountId]);
	const { transactions, loading: loadingTx, refreshing, pullToRefresh } = useGetTransactions(filter);
	const rows = useDescribedTransactions(transactions);

	useLayoutEffect(() => {
		navigation.setOptions({
			title: account?.name ?? "Account",
			headerRight: () =>
				account ? (
					<IconButton icon="pencil-outline" onPress={() => setEditVisible(true)} accessibilityLabel="Edit account" />
				) : null,
		});
	}, [navigation, account]);

	const monthFlow = useMemo(() => {
		const now = new Date();
		let moneyIn = 0;
		let moneyOut = 0;
		transactions.forEach((tx) => {
			if (!isSameMonth(parseLocalDate(tx.date), now)) return;
			if (tx.to_account_id === accountId) moneyIn += tx.amount;
			if (tx.from_account_id === accountId) moneyOut += tx.amount;
		});
		return { moneyIn, moneyOut };
	}, [transactions, accountId]);

	if (loading) {
		return (
			<View style={[styles.fill, { backgroundColor: theme.colors.background }]}>
				<SkeletonList rows={6} />
			</View>
		);
	}

	if (!account) {
		return (
			<View style={[styles.fill, styles.center, { backgroundColor: theme.colors.background }]}>
				<EmptyState
					icon={error ? "cloud-alert" : "wallet-outline"}
					tone={error ? "error" : "default"}
					title={error ? "Couldn't load this account" : "Account not found"}
					message={error ?? "It may have been removed."}
					actionLabel={error ? "Try again" : undefined}
					onAction={error ? refresh : undefined}
				/>
			</View>
		);
	}

	const typeName = accountTypes.find((t) => t.id === account.account_type_id)?.name ?? "";
	const handleEdit = async (values: AccountFormValues) => {
		await updateAccount(account.id, values);
		setEditVisible(false);
		toast.success("Account updated");
	};

	const header = (
		<View>
			<HeroCard>
				<View style={styles.heroTop}>
					<IconBadge
						icon={getAccountTypeIcon(typeName)}
						color={theme.custom.onHero}
						background="rgba(255,255,255,0.16)"
					/>
					<View style={{ flex: 1, marginLeft: spacing.md }}>
						<Text variant="labelLarge" style={{ color: theme.custom.onHeroMuted }}>
							{[typeName, maskAccountNumber(account.account_number)].filter(Boolean).join("  ·  ")}
						</Text>
						<Text variant="bodySmall" style={{ color: theme.custom.onHeroMuted }}>
							Current balance
						</Text>
					</View>
				</View>
				<AmountText amount={account.current_balance} currency={account.currency} tone="onHero" variant="displaySmall" style={{ marginTop: spacing.md }} />
			</HeroCard>

			<ActionRow
				actions={[
					{ label: "Expense", icon: "arrow-top-right", color: theme.custom.expense, background: theme.custom.expenseContainer, onPress: () => openComposer({ type: "Expense", accountId }) },
					{ label: "Income", icon: "arrow-bottom-left", color: theme.custom.income, background: theme.custom.incomeContainer, onPress: () => openComposer({ type: "Income", accountId }) },
					{ label: "Transfer", icon: "swap-horizontal", color: theme.custom.transfer, background: theme.custom.transferContainer, onPress: () => openComposer({ type: "Transfer", accountId }) },
				]}
			/>

			<StatGrid
				items={[
					{ label: "In this month", value: formatAmount(monthFlow.moneyIn, account.currency), tone: "income" },
					{ label: "Out this month", value: formatAmount(monthFlow.moneyOut, account.currency) },
					{ label: "Opening balance", value: formatAmount(account.opening_balance, account.currency) },
					{ label: "Currency", value: account.currency },
				]}
			/>
			{account.account_number ? (
				<Text variant="bodySmall" selectable style={[styles.number, { color: theme.colors.onSurfaceVariant }]}>
					{`Account number ${account.account_number}`}
				</Text>
			) : null}
		</View>
	);

	return (
		<View style={[styles.fill, { backgroundColor: theme.colors.background }]}>
			<TransactionSectionList
				rows={rows}
				header={header}
				sectionTitle="Transactions"
				refreshing={refreshing}
				onRefresh={pullToRefresh}
				empty={
					loadingTx ? (
						<SkeletonList rows={4} />
					) : (
						<EmptyState
							compact
							icon="receipt"
							title="No transactions yet"
							message="Money in and out of this account will show up here."
							actionLabel="Add transaction"
							onAction={() => openComposer({ type: "Expense", accountId })}
						/>
					)
				}
			/>
			<AccountFormSheet
				visible={editVisible}
				onDismiss={() => setEditVisible(false)}
				accountTypes={accountTypes}
				account={account}
				onSubmit={handleEdit}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	fill: {
		flex: 1,
	},
	center: {
		justifyContent: "center",
	},
	heroTop: {
		flexDirection: "row",
		alignItems: "center",
	},
	number: {
		marginTop: spacing.md,
		marginLeft: spacing.xs,
	},
});

export default AccountDetailScreen;
