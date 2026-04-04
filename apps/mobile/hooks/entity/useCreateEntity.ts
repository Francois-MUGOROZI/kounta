import { useState } from "react";
import { EntityRepository } from "../../repositories/EntityRepository";
import { useDatabase } from "../../database";
import { Entity } from "../../types";

export const useCreateEntity = () => {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const createEntity = async (entity: Omit<Entity, "id">): Promise<void> => {
		try {
			setLoading(true);
			setError(null);
			await EntityRepository.create(db, entity);
		} catch (err: any) {
			setError(err.message || "Failed to create entity");
			throw err;
		} finally {
			setLoading(false);
		}
	};

	return { createEntity, loading, error };
};
