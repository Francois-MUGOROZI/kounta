import { useCallback, useEffect, useRef, useState } from "react";
import { SQLiteDatabase } from "expo-sqlite";
import { useDatabase } from "../database";
import { addEventListener, EVENTS } from "../utils/events";

export const errorMessage = (e: unknown, fallback: string): string =>
	e instanceof Error && e.message ? e.message : fallback;

/**
 * Reads data from the local database and keeps it fresh.
 *
 * - `loading` is only true until the first result arrives; later refreshes
 *   (data changes, pull-to-refresh, changed deps) keep the current data on
 *   screen instead of flashing a spinner.
 * - Bursts of DATA_CHANGED events collapse into a single re-query.
 * - Results from superseded requests are discarded.
 */
export function useQuery<T>(
	fetcher: (db: SQLiteDatabase) => Promise<T>,
	deps: readonly unknown[],
	initialData: T,
	fallbackError = "Failed to load data"
) {
	const db = useDatabase();
	const [data, setData] = useState<T>(initialData);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetcherRef = useRef(fetcher);
	fetcherRef.current = fetcher;
	const requestId = useRef(0);
	const mounted = useRef(true);
	const pending = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		mounted.current = true;
		return () => {
			mounted.current = false;
			if (pending.current) clearTimeout(pending.current);
		};
	}, []);

	const run = useCallback(async () => {
		const id = ++requestId.current;
		try {
			const result = await fetcherRef.current(db);
			if (!mounted.current || id !== requestId.current) return;
			setData(result);
			setError(null);
		} catch (e) {
			if (!mounted.current || id !== requestId.current) return;
			setError(errorMessage(e, fallbackError));
		} finally {
			if (mounted.current && id === requestId.current) {
				setLoading(false);
				setRefreshing(false);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [db, ...deps]);

	useEffect(() => {
		run();
		const subscription = addEventListener(EVENTS.DATA_CHANGED, () => {
			if (pending.current) clearTimeout(pending.current);
			pending.current = setTimeout(() => {
				pending.current = null;
				run();
			}, 16);
		});
		return () => subscription.remove();
	}, [run]);

	/** Re-query in the background (no spinner). */
	const refresh = useCallback(() => run(), [run]);

	/** Re-query driven by a pull-to-refresh gesture. */
	const pullToRefresh = useCallback(() => {
		setRefreshing(true);
		return run();
	}, [run]);

	return { data, loading, refreshing, error, refresh, pullToRefresh };
}

/**
 * Wraps a write so the caller can show a pending state; errors are rethrown
 * so screens can keep a form open and report what went wrong.
 */
export function useMutation<A extends unknown[], R>(
	mutate: (db: SQLiteDatabase, ...args: A) => Promise<R>,
	fallbackError = "Something went wrong"
) {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const mutateRef = useRef(mutate);
	mutateRef.current = mutate;

	const execute = useCallback(
		async (...args: A): Promise<R> => {
			setLoading(true);
			setError(null);
			try {
				return await mutateRef.current(db, ...args);
			} catch (e) {
				const message = errorMessage(e, fallbackError);
				setError(message);
				throw new Error(message);
			} finally {
				setLoading(false);
			}
		},
		[db, fallbackError]
	);

	return { execute, loading, error };
}
