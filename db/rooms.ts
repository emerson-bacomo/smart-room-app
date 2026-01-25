import * as SQLite from "expo-sqlite";

export interface Room {
    id: number;
    name: string;
}

const TABLE_NAME = "Rooms";

const RoomS_SCHEMA = {
    id: "INTEGER PRIMARY KEY AUTOINCREMENT",
    name: "TEXT NOT NULL",
};

// Helper: Generates "id INTEGER PRIMARY KEY..., title TEXT, ..."
const SCHEMA_SQL = Object.entries(RoomS_SCHEMA)
    .map(([col, type]) => `${col} ${type}`)
    .join(", ");

// Helper: Get all columns except 'id' for insertions
const INSERT_COLUMNS = Object.keys(RoomS_SCHEMA).filter((col) => col !== "id");
const INSERT_COLUMNS_SQL = INSERT_COLUMNS.join(", ");
const INSERT_PLACEHOLDERS_SQL = INSERT_COLUMNS.map(() => "?").join(", ");

export const migrateDbRoomsIfNeeded = async (db: SQLite.SQLiteDatabase) => {
    try {
        const tableExists = await db.getAllAsync<{ name: string }>(
            `SELECT name FROM sqlite_master WHERE type='table' AND name='${TABLE_NAME}';`,
        );

        // 1. If table doesn't exist, create it and return
        if (tableExists.length === 0) {
            await db.execAsync(`CREATE TABLE ${TABLE_NAME} (${SCHEMA_SQL});`);
            console.log(`${TABLE_NAME} table created.`);
            return;
        }

        // 2. Table exists - Get current columns from DB
        const pragma = (await db.getAllAsync(`PRAGMA table_info(${TABLE_NAME});`)) as any[];
        const existingColumns = pragma.map((c) => c.name);

        // 3. Check for missing columns and add them
        for (const [columnName, columnDefinition] of Object.entries(RoomS_SCHEMA)) {
            if (!existingColumns.includes(columnName)) {
                console.log(`Adding missing column: ${columnName}`);
                // SQLite ALTER TABLE syntax: ALTER TABLE table ADD COLUMN col_name definition
                await db.execAsync(`ALTER TABLE ${TABLE_NAME} ADD COLUMN ${columnName} ${columnDefinition};`);
            }
        }

        console.log("Database schema sync complete.");
    } catch (err) {
        console.error("Failed to migrate database:", err);
    }
};

export const dbCreateRoom = (db: SQLite.SQLiteDatabase, Room: Omit<Room, "id">): Room | null => {
    const now = Date.now();

    // Ensure we have the data in the right order based on INSERT_COLUMNS
    const values = INSERT_COLUMNS.map((col) => {
        if (col === "createdAt" || col === "updatedAt") return now;
        return (Room as any)[col] ?? null;
    });

    return db.getFirstSync<Room>(
        `INSERT INTO ${TABLE_NAME} (${INSERT_COLUMNS_SQL}) 
         VALUES (${INSERT_PLACEHOLDERS_SQL})
         RETURNING *`,
        values,
    );
};

export const dbRenameRoom = (db: SQLite.SQLiteDatabase, id: number, newTitle: string) => {
    db.runSync(`UPDATE Rooms SET title = ?, RoomFilePath = ?, updatedAt = ? WHERE id = ?`, [newTitle, Date.now(), id]);
};

export const dbGetRooms = (db: SQLite.SQLiteDatabase, callback: (Rooms: Room[]) => void) => {
    // Use getAllSync to fetch all rows at once
    const allRows = db.getAllSync(`SELECT * FROM Rooms ORDER BY createdAt DESC`) as Room[];
    callback(allRows);
};

export function dbDeleteRoom(db: SQLite.SQLiteDatabase, RoomId: number) {
    try {
        db.runSync(`DELETE FROM Rooms WHERE id = ?`, [RoomId]);
    } catch (err) {
        console.error("Failed to delete Room from DB", err);
        throw err;
    }
}

/**
 * Dynamically updates a record and returns the updated row.
 */
export const dbUpdateRoom = (
    db: SQLite.SQLiteDatabase,
    id: number,
    updates: Partial<Omit<Room, "id" | "createdAt">>,
): Room | null => {
    const keys = Object.keys(updates);

    // If no updates are provided, we should still return the current Room
    if (keys.length === 0) {
        return db.getFirstSync<Room>(`SELECT * FROM ${TABLE_NAME} WHERE id = ?`, [id]);
    }

    // 1. Build the SET clause
    const setClause = keys.map((key) => `${key} = ?`).join(", ");

    // 2. Add updatedAt and RETURNING *
    const sql = `
        UPDATE ${TABLE_NAME} 
        SET ${setClause}, updatedAt = ? 
        WHERE id = ? 
        RETURNING *
    `;

    // 3. Prepare the values array
    const values = keys.map((key) => (updates as any)[key]);
    values.push(Date.now()); // For updatedAt
    values.push(id); // For the WHERE clause

    try {
        // Use getFirstSync to capture the result of the RETURNING clause
        return db.getFirstSync<Room>(sql, values);
    } catch (err) {
        console.error("Dynamic update + return failed:", err);
        return null;
    }
};
