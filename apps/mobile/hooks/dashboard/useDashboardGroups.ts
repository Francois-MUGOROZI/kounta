import { useEffect, useState } from "react";
import { useDatabase } from "../../database";
import { DashboardRepository } from "../../repositories/DashboardRepository";

export interface GroupedTypeMap {
	[currency: string]: Array<{ label: string; value: number; currency: string }>;
}

export function useDashboardGroups(refreshKey?: any) {
	const db = useDatabase();
	const [accountsByType, setAccountsByType] = useState<GroupedTypeMap>({});
	const [assetsByType, setAssetsByType] = useState<GroupedTypeMap>({});
	const [liabilitiesByType, setLiabilitiesByType] = useState<GroupedTypeMap>(
		{}
	);
	const [expensesByCategory, setExpensesByCategory] = useState<GroupedTypeMap>(
		{}
	);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let mounted = true;
		setLoading(true);
		setError(null);
		Promise.all([
			DashboardRepository.getAccountsByTypeAndCurrency(db),
			DashboardRepository.getAssetsByTypeAndCurrency(db),
			DashboardRepository.getLiabilitiesByTypeAndCurrency(db),
			DashboardRepository.getExpensesByCategoryAndCurrency(db),
		])
			.then(async ([acc, ast, liab, exp]) => {
				if (!mounted) return;
				const accMap: GroupedTypeMap = {};
				const astMap: GroupedTypeMap = {};
				const liabMap: GroupedTypeMap = {};
				const expMap: GroupedTypeMap = {};
				acc.forEach((a) => {
					if (!accMap[a.currency]) accMap[a.currency] = [];
					accMap[a.currency].push({
						label: a.type,
						value: Number(a.total) ?? 0,
						currency: a.currency,
					});
				});
				ast.forEach((a) => {
					if (!astMap[a.currency]) astMap[a.currency] = [];
					astMap[a.currency].push({
						label: a.type,
						value: Number(a.total) ?? 0,
						currency: a.currency,
					});
				});
				liab.forEach((a) => {
					if (!liabMap[a.currency]) liabMap[a.currency] = [];
					liabMap[a.currency].push({
						label: a.type,
						value: Number(a.total) ?? 0,
						currency: a.currency,
					});
				});

				exp.forEach((e) => {
					if (!expMap[e.currency]) expMap[e.currency] = [];
					expMap[e.currency].push({
						label: e.category,
						value: Number(e.total) ?? 0,
						currency: e.currency,
					});
				});
				setAccountsByType(accMap);
				setAssetsByType(astMap);
				setLiabilitiesByType(liabMap);
				setExpensesByCategory(expMap);
				setLoading(false);
			})
			.catch((err) => {
				if (!mounted) return;
				setError(err?.message || "Failed to load group data");
				setLoading(false);
			});
		return () => {
			mounted = false;
		};
	}, [db, refreshKey]);

	return {
		accountsByType,
		assetsByType,
		liabilitiesByType,
		expensesByCategory,
		loading,
		error,
	};
}
