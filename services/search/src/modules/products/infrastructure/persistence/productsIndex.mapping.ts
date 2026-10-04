import type { estypes } from "@elastic/elasticsearch";

export const productsSettings: estypes.IndicesIndexSettings = {
  number_of_shards: 1,
  number_of_replicas: 0,
};

export const productsMappings: estypes.MappingTypeMapping = {
  dynamic: "strict", // un campo no declarado falla en vez de mapearse solo y mal
  properties: {
    productId: { type: "keyword" },
    sellerId: { type: "keyword" },
    name: {
      type: "text",
      analyzer: "spanish", // stemming: "bicicletas" encuentra "bicicleta"
      fields: { keyword: { type: "keyword", ignore_above: 256 } },
    },
    description: { type: "text", analyzer: "spanish" },
    categoryId: { type: "keyword" },
    price: {
      properties: {
        amount: { type: "long" },
        currency: { type: "keyword" },
      },
    },
    stock: { type: "integer" },
    condition: { type: "keyword" },
    publishedAt: { type: "date" },
  },
};