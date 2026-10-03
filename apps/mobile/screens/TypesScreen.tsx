import React, { useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { AnimatedFAB, Text } from "react-native-paper";
import Card from "../components/ui/Card";
import ListItem from "../components/ui/ListItem";
import IconBadge from "../components/ui/IconBadge";
import EmptyState from "../components/ui/EmptyState";
import { SegmentedControl } from "../components/ui/fields";
import { SkeletonList } from "../components/ui/Skeleton";
import { useToast } from "../components/ui/Toast";
import type { IconName } from "../components/ui/icons";
import TypeFormSheet from "../components/TypeFormSheet";
import { useGetAccountTypes } from "../hooks/accountType/useGetAccountTypes";
import { useCreateAccountType } from "../hooks/accountType/useCreateAccountType";
import { useUpdateAccountType } from "../hooks/accountType/useUpdateAccountType";
import { useGetAssetTypes } from "../hooks/assetType/useGetAssetTypes";
import { useCreateAssetType } from "../hooks/assetType/useCreateAssetType";
import { useUpdateAssetType } from "../hooks/assetType/useUpdateAssetType";
import { useGetLiabilityTypes } from "../hooks/liabilityType/useGetLiabilityTypes";
import { useCreateLiabilityType } from "../hooks/liabilityType/useCreateLiabilityType";
import { useUpdateLiabilityType } from "../hooks/liabilityType/useUpdateLiabilityType";
import { getAccountTypeIcon, getAssetTypeIcon, getLiabilityTypeIcon } from "../constants/typeIcons";
import { radius, spacing, useKTheme } from "../theme/theme";

type Tab = "account" | "asset" | "liability";

interface NamedType {
	id: number;
	name: string;
}

const TAB_META: Record<Tab, { label: string; noun: string; icon: (name: string) => IconName; blurb: string }> = {
	account: {
		label: "Accounts",
		noun: "account type",
		icon: getAccountTypeIcon,
		blurb: "Where money is kept — bank, mobile money, cash.",
	},
	asset: {
		label: "Assets",
		noun: "asset type",
		icon: getAssetTypeIcon,
		blurb: "Things you own that hold value — property, funds, vehicles.",
	},
	liability: {
		label: "Liabilities",
		noun: "liability type",
		icon: getLiabilityTypeIcon,
		blurb: "Kinds of debt — loans, mortgages, credit cards.",
	},
};

const TypesScreen = () => {
	const theme = useKTheme();
	const toast = useToast();
	const [tab, setTab] = useState<Tab>("account");
	const [formVisible, setFormVisible] = useState(false);
	const [editing, setEditing] = useState<NamedType | null>(null);
	const [fabExtended, setFabExtended] = useState(true);

	const account = useGetAccountTypes();
	const asset = useGetAssetTypes();
	const liability = useGetLiabilityTypes();
	const { createAccountType } = useCreateAccountType();
	const { updateAccountType } = useUpdateAccountType();
	const { createAssetType } = useCreateAssetType();
	const { updateAssetType } = useUpdateAssetType();
	const { createLiabilityType } = useCreateLiabilityType();
	const { updateLiabilityType } = useUpdateLiabilityType();

	const sources = {
		account: { items: account.accountTypes, ...account },
		asset: { items: asset.assetTypes, ...asset },
		liability: { items: liability.liabilityTypes, ...liability },
	};
	const current = sources[tab];
	const meta = TAB_META[tab];

	const openCreate = () => {
		setEditing(null);
		setFormVisible(true);
	};

	const handleSubmit = async (name: string) => {
		if (editing) {
			if (tab === "account") await updateAccountType(editing.id, name);
			else if (tab === "asset") await updateAssetType(editing.id, { name });
			else await updateLiabilityType(editing.id, { name });
			toast.success("Type renamed");
		} else {
			if (tab === "account") await createAccountType(name);
			else if (tab === "asset") await createAssetType({ name });
			else await createLiabilityType({ name });
			toast.success(`${name} added`);
		}
		setFormVisible(false);
	};

	const renderBody = () => {
		if (current.loading) return <SkeletonList rows={6} />;
		if (current.error && current.items.length === 0) {
			return (
				<EmptyState
					icon="cloud-alert"
					tone="error"
					title="Couldn't load types"
					message={current.error}
					actionLabel="Try again"
					onAction={current.refresh}
				/>
			);
		}
		if (current.items.length === 0) {
			return (
				<EmptyState
					icon="tune-variant"
					title={`No ${meta.noun}s yet`}
					message={meta.blurb}
					actionLabel={`Add ${meta.noun}`}
					onAction={openCreate}
				/>
			);
		}
		return (
			<>
				<Text variant="bodyMedium" style={[styles.blurb, { color: theme.colors.onSurfaceVariant }]}>
					{meta.blurb}
				</Text>
				<Card padded={false}>
					{current.items.map((t: NamedType, i: number) => (
						<ListItem
							key={t.id}
							title={t.name}
							left={<IconBadge icon={meta.icon(t.name)} />}
							chevron
							onPress={() => {
								setEditing(t);
								setFormVisible(true);
							}}
							accessibilityLabel={`Rename ${t.name}`}
							style={i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.outlineVariant }}
						/>
					))}
				</Card>
				<Text variant="bodySmall" style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
					Tap a type to rename it.
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
						refreshing={current.refreshing}
						onRefresh={current.pullToRefresh}
						colors={[theme.colors.primary]}
						progressBackgroundColor={theme.colors.surface}
					/>
				}
			>
				<SegmentedControl<Tab>
					value={tab}
					onChange={setTab}
					segments={(Object.keys(TAB_META) as Tab[]).map((k) => ({ value: k, label: TAB_META[k].label }))}
				/>
				{renderBody()}
			</ScrollView>
			<AnimatedFAB
				icon="plus"
				label="Add type"
				extended={fabExtended}
				onPress={openCreate}
				style={styles.fab}
				color={theme.colors.onPrimary}
				theme={{ colors: { primaryContainer: theme.colors.primary } }}
				accessibilityLabel={`Add ${meta.noun}`}
			/>
			<TypeFormSheet
				visible={formVisible}
				onDismiss={() => setFormVisible(false)}
				typeLabel={meta.noun}
				initialName={editing?.name}
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
		paddingTop: spacing.sm,
		paddingBottom: 120,
	},
	blurb: {
		marginBottom: spacing.md,
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

export default TypesScreen;
