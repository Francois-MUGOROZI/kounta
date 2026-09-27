import React from "react";
import { View } from "react-native";
import AppDropdown from "./AppDropdown";
import CollapsibleSection from "./CollapsibleSection";
import { formatAmount } from "../utils/currency";

interface AssociationFieldsProps {
	transactionType: string;
	assetId: string;
	onAssetChange: (value: string) => void;
	liabilityId: string;
	onLiabilityChange: (value: string) => void;
	billId: string;
	onBillChange: (value: string) => void;
	entityId: string;
	onEntityChange: (value: string) => void;
	assets: { id: number; name: string; current_valuation: number; currency: string }[];
	liabilities: { id: number; name: string; current_balance: number; currency: string }[];
	bills: { id: number; name: string; amount: number }[];
	entities: { id: number; name: string }[];
}

const AssociationFields: React.FC<AssociationFieldsProps> = ({
	transactionType,
	assetId,
	onAssetChange,
	liabilityId,
	onLiabilityChange,
	billId,
	onBillChange,
	entityId,
	onEntityChange,
	assets,
	liabilities,
	bills,
	entities,
}) => {
	// Count selected associations for badge
	let count = 0;
	if (assetId && assetId !== "") count++;
	if (liabilityId && liabilityId !== "") count++;
	if (billId && billId !== "") count++;
	if (entityId && entityId !== "") count++;

	return (
		<CollapsibleSection title="Associations (Optional)" showCount={count}>
			<View style={{ gap: 2 }}>
				{/* Asset - available for Income and Expense */}
				<AppDropdown
					label="Asset (optional)"
					value={assetId}
					onSelect={(v) => onAssetChange(v ?? "")}
					options={[
						{ label: "None", value: "" },
						...assets.map((a) => ({
							label: `${a.name} (${formatAmount(a.current_valuation, a.currency)})`,
							value: a.id.toString(),
						})),
					]}
					placeholder="None"
				/>

				{/* Entity - who this transaction was given to / received from */}
				<AppDropdown
					label="Entity (optional)"
					value={entityId}
					onSelect={(v) => onEntityChange(v ?? "")}
					options={[
						{ label: "None", value: "" },
						...entities.map((e) => ({
							label: e.name,
							value: e.id.toString(),
						})),
					]}
					placeholder="None"
				/>

				{/* Liability, Bill - only for Expense */}
				{transactionType === "Expense" && (
					<>
						<AppDropdown
							label="Liability (optional)"
							value={liabilityId}
							onSelect={(v) => onLiabilityChange(v ?? "")}
							options={[
								{ label: "None", value: "" },
								...liabilities.map((l) => ({
									label: `${l.name} (${formatAmount(l.current_balance, l.currency)})`,
									value: l.id.toString(),
								})),
							]}
							placeholder="None"
						/>
						{bills.length > 0 && (
							<AppDropdown
								label="Bill (optional)"
								value={billId}
								onSelect={(v) => onBillChange(v ?? "")}
								options={[
									{ label: "None", value: "" },
									...bills.map((b) => ({
										label: `${b.name} (${b.amount.toLocaleString()})`,
										value: b.id.toString(),
									})),
								]}
								placeholder="None"
							/>
						)}
					</>
				)}
			</View>
		</CollapsibleSection>
	);
};

export default AssociationFields;
