import { Client } from "@elastic/elasticsearch";

export const createEsClient = (node: string) => new Client({ node });