import { EntityRepository } from "../../repositories/EntityRepository";
import { Entity } from "../../types";
import { useQuery } from "../useQuery";

export const useGetEntities = () => {
	const { data, loading, refreshing, error, refresh, pullToRefresh } =
		useQuery<Entity[]>(
			(db) => EntityRepository.getAll(db),
			[],
			[],
			"Failed to load entities"
		);

	return {
		entities: data,
		loading,
		refreshing,
		error,
		refresh,
		pullToRefresh,
	};
};
