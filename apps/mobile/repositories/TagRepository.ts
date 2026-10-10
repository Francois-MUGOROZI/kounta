import { SQLiteDatabase } from "expo-sqlite";
import { Tag } from "../types";

export type TagUsage = Tag & { usage: number };

/** Trims a tag name and collapses inner whitespace. */
export const normalizeTagName = (name: string) => name.trim().replace(/\s+/g, " ");

// Links tags to a new transaction, creating tags that don't exist yet. Must run
// inside the caller's open SQL transaction.
export async function attachTags(
	db: SQLiteDatabase,
	transactionId: number,
	names: string[]
): Promise<void> {
	// One entry per name, ignoring case; the first spelling wins.
	const unique = new Map<string, string>();
	for (const raw of names) {
		const name = normalizeTagName(raw);
		if (name && !unique.has(name.toLowerCase())) unique.set(name.toLowerCase(), name);
	}
	for (const name of unique.values()) {
		const existing = await db.getFirstAsync<{ id: number }>("SELECT id FROM tags WHERE name = ?", [name]);
		const tagId =
			existing?.id ??
			(
				await db.runAsync("INSERT INTO tags (name, created_at) VALUES (?, ?)", [
					name,
					new Date().toISOString(),
				])
			).lastInsertRowId;
		await db.runAsync(
			"INSERT OR IGNORE INTO transaction_tags (transaction_id, tag_id) VALUES (?, ?)",
			[transactionId, tagId]
		);
	}
}

export const TagRepository = {
	/** Every tag with how many transactions use it, most used first. */
	async getAll(db: SQLiteDatabase): Promise<TagUsage[]> {
		return await db.getAllAsync<TagUsage>(
			`SELECT t.*, COUNT(tt.transaction_id) AS usage
			 FROM tags t LEFT JOIN transaction_tags tt ON tt.tag_id = t.id
			 GROUP BY t.id
			 ORDER BY usage DESC, t.name COLLATE NOCASE`
		);
	},

	async getByTransactionId(db: SQLiteDatabase, transactionId: number): Promise<Tag[]> {
		return await db.getAllAsync<Tag>(
			`SELECT t.* FROM tags t JOIN transaction_tags tt ON tt.tag_id = t.id
			 WHERE tt.transaction_id = ?
			 ORDER BY t.name COLLATE NOCASE`,
			[transactionId]
		);
	},
};
