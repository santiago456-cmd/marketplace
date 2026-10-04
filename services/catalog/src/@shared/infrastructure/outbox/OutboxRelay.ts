import { setTimeout as sleep } from "node:timers/promises";
import { asc, inArray, isNull } from "drizzle-orm";
import type { Producer } from "kafkajs";
import type { Db } from "../database/db.js";
import type { Logger } from "@marketplace/common";
import { outbox } from "./outbox.schema.js";

interface RelayOptions {
  pollMs: number;
  batchSize?: number;
}

/**
 * Lee eventos pendientes de la tabla outbox y los publica en Kafka.
 * Entrega at-least-once: si Kafka confirma pero el COMMIT falla, el evento se
 * reenvía. Por eso los consumidores deben ser idempotentes (usando eventId).
 * Ejecutar UNA instancia del relay por servicio para preservar el orden.
 */
export class OutboxRelay {
  private stopped = true;
  private loop?: Promise<void>;

  constructor(
    private readonly db: Db,
    private readonly producer: Producer,
    private readonly logger: Logger,
    private readonly options: RelayOptions,
  ) {}

  async start(): Promise<void> {
    await this.producer.connect();
    this.stopped = false;
    this.loop = this.run();
    this.logger.info("Outbox relay iniciado");
  }

  async stop(): Promise<void> {
    this.stopped = true;
    await this.loop;
    await this.producer.disconnect();
  }

  private async run(): Promise<void> {
    const batchSize = this.options.batchSize ?? 50;
    while (!this.stopped) {
      try {
        const sent = await this.publishBatch(batchSize);
        if (sent < batchSize) await sleep(this.options.pollMs);
      } catch (err) {
        this.logger.error({ err }, "Outbox relay falló, reintentando en 2s");
        await sleep(2000);
      }
    }
  }

  private publishBatch(batchSize: number): Promise<number> {
    return this.db.transaction(async (tx) => {
      const rows = await tx
        .select()
        .from(outbox)
        .where(isNull(outbox.publishedAt))
        .orderBy(asc(outbox.seq))
        .limit(batchSize)
        .for("update", { skipLocked: true });

      if (rows.length === 0) return 0;

      const byTopic = new Map<string, { key: string; value: string }[]>();
      for (const row of rows) {
        const list = byTopic.get(row.topic) ?? [];
        list.push({ key: row.key, value: JSON.stringify(row.payload) });
        byTopic.set(row.topic, list);
      }

      await this.producer.sendBatch({
        topicMessages: [...byTopic].map(([topic, messages]) => ({ topic, messages })),
      });

      await tx
        .update(outbox)
        .set({ publishedAt: new Date() })
        .where(
          inArray(
            outbox.id,
            rows.map((r) => r.id),
          ),
        );

      this.logger.info({ count: rows.length }, "Outbox: eventos publicados en Kafka");
      return rows.length;
    });
  }
}