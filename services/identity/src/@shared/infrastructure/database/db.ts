import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";

export type Db = NodePgDatabase;
/** Tipo de la transacción que recibe db.transaction(async (tx) => ...). */
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

export function createDb(connectionString: string) {
  const pool = new pg.Pool({ connectionString });
  const db: Db = drizzle({ client: pool });
  return { db, close: () => pool.end() };
}