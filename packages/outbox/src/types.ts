import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export type Db = NodePgDatabase;
/** Tipo de la transacción que recibe db.transaction(async (tx) => ...). */
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];