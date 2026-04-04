import { useState } from "react";
import { ReceivableRepository } from "../../repositories/ReceivableRepository";
import { useDatabase } from "../../database";

export const useWriteOffReceivable = () => {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const writeOffReceivable = async (id: number): Promise<void> => {
		try {
			setLoading(true);
			setError(null);
			await ReceivableRepository.writeOff(db, id);
		} catch (err: any) {
			setError(err.message || "Failed to write off receivable");
			throw err;
		} finally {
			setLoading(false);
		}
	};

	return { writeOffReceivable, loading, error };
};
