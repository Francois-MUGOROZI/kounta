import React from "react";
import { View } from "react-native";
import AppDropdown from "./AppDropdown";
import CollapsibleSection from "./CollapsibleSection";

interface AssociationFieldsProps {
	transactionType: string;
	assetId: string;
	onAssetChange: (value: string) => void;
	envelopeId: string;
	onEnvelopeChange: (value: string) => void;
	liabilityId: string;
	onLiabilityChange: (value: string) => void;
	billId: string;
	onBillChange: (value: string) => void;
	assets: { id: number; name: string }[];
	envelopes: { id: number; name: string }[];
	liabilities: { id: number; name: string }[];
	bills: { id: number; name: string; amount: number }[];
}

const AssociationFields: React.FC<AssociationFieldsProps> = ({
	transactionType,
	assetId,
	onAssetChange,
	envelopeId,
	onEnvelopeChange,
	liabilityId,
	onLiabilityChange,
	billId,
	onBillChange,
	assets,
	envelopes,
	liabilities,
	bills,
}) => {
	// Count selected associations for badge
	let count = 0;
	if (assetId && assetId !== "") count++;
	if (envelopeId && envelopeId !== "") count++;
	if (liabilityId && liabilityId !== "") count++;
	if (billId && billId !== "") count++;

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
							label: a.name,
							value: a.id.toString(),
						})),
					]}
					placeholder="None"
				/>

				{/* Envelope, Liability, Bill - only for Expense */}
				{transactionType === "Expense" && (
					<>
						<AppDropdown
							label="Envelope (optional)"
							value={envelopeId}
							onSelect={(v) => onEnvelopeChange(v ?? "")}
							options={[
								{ label: "None", value: "" },
								...envelopes.map((e) => ({
									label: e.name,
									value: e.id.toString(),
								})),
							]}
							placeholder="None"
						/>
						<AppDropdown
							label="Liability (optional)"
							value={liabilityId}
							onSelect={(v) => onLiabilityChange(v ?? "")}
							options={[
								{ label: "None", value: "" },
								...liabilities.map((l) => ({
									label: l.name,
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
