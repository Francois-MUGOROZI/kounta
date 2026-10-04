import { useState } from "react";
import { LiabilityRepository } from "../../repositories/LiabilityRepository";
import { useDatabase } from "../../database";
import { Liability } from "../../types";

export const useCreateLiability = () => {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const createLiability = async (
		liability: Omit<Liability, "id">,
		/** When the loan cash reached an account, records it (and any interest) too. */
		loan?: { accountId: number; cashReceived: number; chargeCategoryId?: number | null }
	): Promise<void> => {
		try {
			setLoading(true);
			setError(null);
			if (loan) {
				await LiabilityRepository.createWithLoan(db, liability, loan);
			} else {
				await LiabilityRepository.create(db, liability);
			}
		} catch (err: any) {
			setError(err.message || "Failed to create liability");
			throw err;
		} finally {
			setLoading(false);
		}
	};

	return { createLiability, loading, error };
};
