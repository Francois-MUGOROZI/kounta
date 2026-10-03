import { ReceivableRepository } from "../../repositories/ReceivableRepository";
import { Receivable } from "../../types";
import { useQuery } from "../useQuery";

export const useGetReceivablesByEntityId = (entityId: number) => {
	const { data, loading, refreshing, error, refresh, pullToRefresh } =
		useQuery<Receivable[]>(
			(db) => ReceivableRepository.getByEntityId(db, entityId),
			[entityId],
			[],
			"Failed to load receivables"
		);

	return {
		receivables: data,
		loading,
		refreshing,
		error,
		refresh,
		pullToRefresh,
	};
};
