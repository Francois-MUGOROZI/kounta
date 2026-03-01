import React from "react";
import { View } from "react-native";
import AppDropdown from "./AppDropdown";

export type TransferDirection =
	| "account-to-account"
	| "account-to-asset"
	| "asset-to-account"
	| "reinvest-into-asset";

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
	error: string;
}

const DIRECTION_OPTIONS = [
	{ label: "Account → Account", value: "account-to-account" },
	{ label: "Account → Asset (Contribute)", value: "account-to-asset" },
	{ label: "Asset → Account (Withdraw)", value: "asset-to-account" },
	{ label: "Reinvest into Asset", value: "reinvest-into-asset" },
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
	accounts,
	assets,
	error,
}) => {
	const showFromAccount =
		transferDirection === "account-to-account" ||
		transferDirection === "account-to-asset";

	const showToAccount =
		transferDirection === "account-to-account" ||
		transferDirection === "asset-to-account";

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
