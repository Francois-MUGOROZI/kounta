import { ReceivableRepository } from "../../repositories/ReceivableRepository";
import { Receivable, ReceivableStatus } from "../../types";
import { useQuery } from "../useQuery";

export const useGetReceivables = (filter?: {
	status?: ReceivableStatus;
	entityId?: number;
}) => {
	const { data, loading, refreshing, error, refresh, pullToRefresh } =
		useQuery<Receivable[]>(
			(db) => ReceivableRepository.getAll(db, filter),
			[JSON.stringify(filter ?? null)],
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
