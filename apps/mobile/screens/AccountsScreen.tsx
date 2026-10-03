import React, { useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { AnimatedFAB, Text } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Card from "../components/ui/Card";
import ListItem from "../components/ui/ListItem";
import IconBadge from "../components/ui/IconBadge";
import AmountText from "../components/ui/AmountText";
import EmptyState from "../components/ui/EmptyState";
import HeroCard from "../components/ui/HeroCard";
import { SkeletonList } from "../components/ui/Skeleton";
import { useToast } from "../components/ui/Toast";
import AccountFormSheet, { AccountFormValues } from "../components/AccountFormSheet";
import { useGetAccounts } from "../hooks/account/useGetAccounts";
import { useCreateAccount } from "../hooks/account/useCreateAccount";
import { useUpdateAccount } from "../hooks/account/useUpdateAccount";
import { useGetAccountTypes } from "../hooks/accountType/useGetAccountTypes";
import { getAccountTypeIcon } from "../constants/typeIcons";
import { Account, RootStackParamList } from "../types";
import { formatAmount, formatCompactAmount } from "../utils/currency";
import { maskAccountNumber } from "../utils/format";
import { radius, spacing, useKTheme } from "../theme/theme";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const AccountsScreen = () => {
	const theme = useKTheme();
	const navigation = useNavigation<Nav>();
	const toast = useToast();
	const { accounts, loading, error, refresh, refreshing, pullToRefresh } = useGetAccounts();
	const { accountTypes } = useGetAccountTypes();
	const { createAccount } = useCreateAccount();
	const { updateAccount } = useUpdateAccount();
	const [formVisible, setFormVisible] = useState(false);
	const [editing, setEditing] = useState<Account | null>(null);
	const [fabExtended, setFabExtended] = useState(true);

	const typeName = (id: number) => accountTypes.find((t) => t.id === id)?.name ?? "Other";

	const totals = useMemo(() => {
		const map: Record<string, { total: number; count: number }> = {};
		accounts.forEach((a) => {
			const t = (map[a.currency] ??= { total: 0, count: 0 });
			t.total += a.current_balance || 0;
			t.count += 1;
		});
		return Object.entries(map).sort((a, b) => b[1].count - a[1].count);
	}, [accounts]);

	const groups = useMemo(() => {
		const map = new Map<number, Account[]>();
		accounts.forEach((a) => {
			const list = map.get(a.account_type_id) ?? [];
			list.push(a);
			map.set(a.account_type_id, list);
		});
		return Array.from(map.entries())
			.map(([typeId, list]) => ({
				typeId,
				name: typeName(typeId),
				accounts: [...list].sort((a, b) => b.current_balance - a.current_balance),
			}))
			.sort((a, b) => a.name.localeCompare(b.name));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [accounts, accountTypes]);

	const openCreate = () => {
		setEditing(null);
		setFormVisible(true);
	};

	const handleSubmit = async (values: AccountFormValues) => {
		if (editing) {
			await updateAccount(editing.id, values);
			toast.success("Account updated");
		} else {
			await createAccount({
				...values,
				current_balance: values.opening_balance,
				created_at: new Date().toISOString(),
			});
			toast.success(`${values.name} added`);
		}
		setFormVisible(false);
	};

	const renderBody = () => {
		if (loading) return <SkeletonList rows={6} />;
		if (error && accounts.length === 0) {
			return (
				<EmptyState icon="cloud-alert" tone="error" title="Couldn't load accounts" message={error} actionLabel="Try again" onAction={refresh} />
			);
		}
		if (accounts.length === 0) {
			return (
				<EmptyState
					icon="wallet-plus-outline"
					title="No accounts yet"
					message="Add the places you keep money — bank, mobile money, cash — to start tracking balances."
					actionLabel="Add account"
					onAction={openCreate}
				/>
			);
		}
		const [main, ...others] = totals;
		return (
			<>
				<HeroCard>
					<Text variant="labelLarge" style={{ color: theme.custom.onHeroMuted }}>
						Total balance
					</Text>
					<AmountText amount={main[1].total} currency={main[0]} tone="onHero" variant="displaySmall" />
					<Text variant="bodySmall" style={{ color: theme.custom.onHeroMuted, marginTop: spacing.xs }}>
						{`${accounts.length} account${accounts.length === 1 ? "" : "s"}`}
						{others.map(([cur, t]) => `  ·  ${formatCompactAmount(t.total, cur)}`).join("")}
					</Text>
				</HeroCard>

				{groups.map((group) => {
					const groupTotals = group.accounts.reduce<Record<string, number>>((acc, a) => {
						acc[a.currency] = (acc[a.currency] ?? 0) + a.current_balance;
						return acc;
					}, {});
					return (
						<View key={group.typeId}>
							<View style={styles.groupHeader}>
								<Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
									{group.name}
								</Text>
								<Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
									{Object.entries(groupTotals)
										.map(([cur, v]) => formatCompactAmount(v, cur))
										.join("  ·  ")}
								</Text>
							</View>
							<Card padded={false}>
								{group.accounts.map((a, i) => (
									<ListItem
										key={a.id}
										title={a.name}
										subtitle={[maskAccountNumber(a.account_number), a.currency].filter(Boolean).join("  ·  ")}
										left={<IconBadge icon={getAccountTypeIcon(group.name)} />}
										right={<AmountText amount={a.current_balance} currency={a.currency} tone="auto" />}
										chevron
										onPress={() => navigation.navigate("AccountDetail", { accountId: a.id })}
										onLongPress={() => {
											setEditing(a);
											setFormVisible(true);
										}}
										accessibilityLabel={`${a.name}, ${formatAmount(a.current_balance, a.currency)}`}
										style={i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.outlineVariant }}
									/>
								))}
							</Card>
						</View>
					);
				})}
				<Text variant="bodySmall" style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
					Tip: long-press an account to edit it.
				</Text>
			</>
		);
	};

	return (
		<View style={[styles.container, { backgroundColor: theme.colors.background }]}>
			<ScrollView
				contentContainerStyle={styles.content}
				onScroll={(e) => setFabExtended(e.nativeEvent.contentOffset.y <= 8)}
				scrollEventThrottle={64}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={pullToRefresh}
						colors={[theme.colors.primary]}
						progressBackgroundColor={theme.colors.surface}
					/>
				}
			>
				{renderBody()}
			</ScrollView>
			{accounts.length > 0 ? (
				<AnimatedFAB
					icon="plus"
					label="Add account"
					extended={fabExtended}
					onPress={openCreate}
					style={styles.fab}
					color={theme.colors.onPrimary}
					theme={{ colors: { primaryContainer: theme.colors.primary } }}
					accessibilityLabel="Add account"
				/>
			) : null}
			<AccountFormSheet
				visible={formVisible}
				onDismiss={() => setFormVisible(false)}
				accountTypes={accountTypes}
				account={editing}
				onSubmit={handleSubmit}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		paddingHorizontal: spacing.lg,
		paddingBottom: 120,
	},
	groupHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginTop: spacing.xxl,
		marginBottom: spacing.sm,
		paddingHorizontal: spacing.xs,
	},
	hint: {
		textAlign: "center",
		marginTop: spacing.xl,
	},
	fab: {
		position: "absolute",
		right: spacing.lg,
		bottom: spacing.lg,
		borderRadius: radius.lg,
	},
});

export default AccountsScreen;
