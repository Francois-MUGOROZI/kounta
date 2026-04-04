import React from "react";
import { View } from "react-native";
import AppDropdown from "./AppDropdown";

export type TransferDirection =
	| "account-to-account"
	| "account-to-asset"
	| "asset-to-account"
	| "reinvest-into-asset"
	| "account-to-receivable"
	| "receivable-to-account";

interface TransferFieldsProps {
	transferDirection: TransferDirection;
	onDirectionChange: (direction: TransferDirection) => void;
	fromAccountId: string;
	onFromAccountChange: (value: string) => void;
	toAccountId: string;
	onToAccountChange: (value: string) => void;
	assetId: string;
	onAssetChange: (value: string) => void;
	accounts: { id: number; name: string }[];
	assets: { id: number; name: string }[];
	receivables: { id: number; name: string; status: string }[];
	receivableId: string;
	onReceivableChange: (value: string) => void;
	error: string;
}

const DIRECTION_OPTIONS = [
	{ label: "Account → Account", value: "account-to-account" },
	{ label: "Account → Asset (Contribute)", value: "account-to-asset" },
	{ label: "Asset → Account (Withdraw)", value: "asset-to-account" },
	{ label: "Reinvest into Asset", value: "reinvest-into-asset" },
	{ label: "Account → Receivable (Lend)", value: "account-to-receivable" },
	{ label: "Receivable → Account (Payment)", value: "receivable-to-account" },
];

const TransferFields: React.FC<TransferFieldsProps> = ({
	transferDirection,
	onDirectionChange,
	fromAccountId,
	onFromAccountChange,
	toAccountId,
	onToAccountChange,
	assetId,
	onAssetChange,
	receivableId,
	onReceivableChange,
	accounts,
	assets,
	receivables,
	error,
}) => {
	const showFromAccount =
		transferDirection === "account-to-account" ||
		transferDirection === "account-to-asset" ||
		transferDirection === "account-to-receivable";

	const showToAccount =
		transferDirection === "account-to-account" ||
		transferDirection === "asset-to-account" ||
		transferDirection === "receivable-to-account";

	const showReceivable =
		transferDirection === "account-to-receivable" ||
		transferDirection === "receivable-to-account";

	const showAsset =
		transferDirection === "account-to-asset" ||
		transferDirection === "asset-to-account" ||
		transferDirection === "reinvest-into-asset";

	const assetLabel =
		transferDirection === "asset-to-account"
			? "From Asset"
			: transferDirection === "reinvest-into-asset"
			? "Asset"
			: "To Asset";

	const receivableLabel =
		transferDirection === "receivable-to-account"
			? "From Receivable"
			: "To Receivable";

	// Lend: show Pending only. Payment: show Active only.
	const filteredReceivables =
		transferDirection === "account-to-receivable"
			? receivables.filter((r) => r.status === "Pending")
			: receivables.filter((r) => r.status === "Active");

	return (
		<View>
			{/* Transfer Direction */}
			<AppDropdown
				label="Transfer Direction"
				value={transferDirection}
				onSelect={(v) =>
					onDirectionChange((v as TransferDirection) ?? "account-to-account")
				}
				options={DIRECTION_OPTIONS}
			/>

			{/* Source: From Account */}
			{showFromAccount && (
				<AppDropdown
					label="From Account"
					value={fromAccountId}
					onSelect={(v) => onFromAccountChange(v ?? "")}
					options={accounts.map((a) => ({
						label: a.name,
						value: a.id.toString(),
					}))}
					error={
						error && !fromAccountId ? "From account is required" : undefined
					}
				/>
			)}

			{/* Asset */}
			{showAsset && (
				<AppDropdown
					label={assetLabel}
					value={assetId}
					onSelect={(v) => onAssetChange(v ?? "")}
					options={assets.map((a) => ({
						label: a.name,
						value: a.id.toString(),
					}))}
					error={error && !assetId ? "Asset is required" : undefined}
				/>
			)}

			{/* Receivable */}
			{showReceivable && (
				<AppDropdown
					label={receivableLabel}
					value={receivableId}
					onSelect={(v) => onReceivableChange(v ?? "")}
					options={filteredReceivables.map((r) => ({
						label: r.name,
						value: r.id.toString(),
					}))}
					error={error && !receivableId ? "Receivable is required" : undefined}
				/>
			)}

			{/* Destination: To Account */}
			{showToAccount && (
				<AppDropdown
					label="To Account"
					value={toAccountId}
					onSelect={(v) => onToAccountChange(v ?? "")}
					options={accounts.map((a) => ({
						label: a.name,
						value: a.id.toString(),
					}))}
					error={error && !toAccountId ? "To account is required" : undefined}
				/>
			)}
		</View>
	);
};

export default TransferFields;
