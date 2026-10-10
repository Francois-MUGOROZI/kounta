import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import TransactionFormSheet, {
	TransactionPreset,
} from "../components/transaction/TransactionFormSheet";
import { useCreateTransaction } from "../hooks/transaction/useCreateTransaction";
import { useToast } from "../components/ui/Toast";

interface ComposerValue {
	/** Opens the new-transaction sheet, optionally pre-filled. */
	openComposer: (preset?: TransactionPreset) => void;
}

const ComposerContext = createContext<ComposerValue>({ openComposer: () => {} });

export const useTransactionComposer = () => useContext(ComposerContext);

export const TransactionComposerProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const toast = useToast();
	const { createTransaction } = useCreateTransaction();
	const [visible, setVisible] = useState(false);
	const [preset, setPreset] = useState<TransactionPreset>({});

	const openComposer = useCallback((next: TransactionPreset = {}) => {
		setPreset(next);
		setVisible(true);
	}, []);

	const value = useMemo(() => ({ openComposer }), [openComposer]);

	return (
		<ComposerContext.Provider value={value}>
			{children}
			<TransactionFormSheet
				visible={visible}
				preset={preset}
				onDismiss={() => setVisible(false)}
				onSubmit={async (tx, successMessage, tags) => {
					// Errors propagate to the form, which keeps the user's input.
					await createTransaction(tx, tags);
					setVisible(false);
					toast.success(successMessage);
				}}
			/>
		</ComposerContext.Provider>
	);
};
