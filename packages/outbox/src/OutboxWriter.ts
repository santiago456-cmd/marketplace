import type { Tx } from "./types.js";
import { outbox } from "./outbox.schema.js";

interface EnvelopeLike {
  eventId: string;
  type: string;
  aggregateId: string;
}

/** Debe llamarse DENTRO de la misma transacción que modifica el agregado. */
export async function enqueueOutbox(tx: Tx, topic: string, events: EnvelopeLike[]): Promise<void> {
  if (events.length === 0) return;
  await tx.insert(outbox).values(
    events.map((e) => ({
      id: e.eventId,
      topic,
      key: e.aggregateId,
      type: e.type,
      payload: e,
    })),
  );
}