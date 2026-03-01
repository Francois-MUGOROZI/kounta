import { useState, useCallback } from "react";
import { useDatabase, clearDatabase } from "../database";
import { BillsRepository } from "@/repositories/BillsRepository";

export const useClearDatabase = () => {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const clear = async () => {
		setLoading(true);
		setError(null);
		await clearDatabase(db);
		setLoading(false);
	};

	return { clear, loading, error };
};

export const useCheckOverdueBills = () => {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const checkOverdueBills = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			// 1. Mark past-due bills as overdue
			await BillsRepository.checkOverdueBills(db);
			// 2. Ensure all active auto_next rules have a pending bill
			await BillsRepository.ensureAllRulesBillsGenerated(db);
		} catch (e: any) {
			setError(e.message || "Failed to check overdue bills");
		} finally {
			setLoading(false);
		}
	}, [db]);

	return { checkOverdueBills, loading, error };
};
