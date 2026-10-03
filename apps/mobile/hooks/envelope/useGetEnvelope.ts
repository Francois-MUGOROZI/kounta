import { EnvelopeRepository } from "../../repositories/EnvelopeRepository";
import { Envelope } from "../../types";
import { useQuery } from "../useQuery";

export function useGetEnvelopes() {
	const { data, loading, refreshing, error, refresh, pullToRefresh } =
		useQuery<Envelope[]>(
			(db) => EnvelopeRepository.getAll(db),
			[],
			[],
			"Failed to load envelopes"
		);

	return {
		envelopes: data,
		loading,
		refreshing,
		error,
		refresh,
		pullToRefresh,
	};
}
