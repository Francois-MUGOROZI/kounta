import { useState } from "react";
import { EntityRepository } from "../../repositories/EntityRepository";
import { useDatabase } from "../../database";
import { Entity } from "../../types";

export const useUpdateEntity = () => {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const updateEntity = async (
		id: number,
		updates: Partial<Entity>,
	): Promise<void> => {
		try {
			setLoading(true);
			setError(null);
			await EntityRepository.update(db, id, updates);
		} catch (err: any) {
			setError(err.message || "Failed to update entity");
			throw err;
		} finally {
			setLoading(false);
		}
	};

	return { updateEntity, loading, error };
};
