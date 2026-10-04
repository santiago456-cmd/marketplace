import { Kafka, logLevel } from "kafkajs";

export const createKafka = (clientId: string, brokers?: string[]) =>
  new Kafka({
    clientId,
    brokers: brokers ?? (process.env.KAFKA_BROKERS ?? "localhost:9094").split(","),
    logLevel: logLevel.WARN,
  });