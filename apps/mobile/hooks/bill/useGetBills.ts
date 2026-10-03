import { BillsRepository } from "../../repositories/BillsRepository";
import { Bill, BillStatus } from "../../types";
import { useQuery } from "../useQuery";

export function useGetBills(status?: BillStatus, unpaid?: boolean) {
	const { data, loading, refreshing, error, refresh, pullToRefresh } =
		useQuery<Bill[]>(
			(db) => {
				if (status) return BillsRepository.getBillsByStatus(db, status);
				if (unpaid) return BillsRepository.getUnpaidBills(db);
				return BillsRepository.getAllBills(db);
			},
			[status, unpaid],
			[],
			"Failed to load bills"
		);

	return { bills: data, loading, refreshing, error, refresh, pullToRefresh };
}
