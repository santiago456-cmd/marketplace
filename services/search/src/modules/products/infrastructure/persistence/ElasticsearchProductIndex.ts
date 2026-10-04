import type { Client, estypes } from "@elastic/elasticsearch";
import type { ProductSearchDocument } from "../../domain/models/ProductSearchDocument.js";
import type { FacetBucket, SearchCriteria, SearchResult } from "../../domain/models/SearchCriteria.js";
import type { ProductSearchIndex } from "../../domain/repositories/ProductSearchIndex.js";
import { productsMappings, productsSettings } from "./productsIndex.mapping.js";

interface BucketAgg {
  buckets: { key: string; doc_count: number }[];
}
interface Aggs {
  categories: BucketAgg;
  conditions: BucketAgg;
  price: { min: number | null; max: number | null };
}

const IGNORE_404 = { ignore: [404] };

export class ElasticsearchProductIndex implements ProductSearchIndex {
  constructor(
    private readonly es: Client,
    private readonly index: string,
  ) {}

  /** Crea el índice con su mapping si todavía no existe. */
  async ensureIndex(): Promise<void> {
    if (await this.es.indices.exists({ index: this.index })) return;
    await this.es.indices.create({
      index: this.index,
      settings: productsSettings,
      mappings: productsMappings,
    });
  }

  async upsert(doc: ProductSearchDocument): Promise<void> {
    await this.es.index({ index: this.index, id: doc.productId, document: doc });
  }

  async updatePrice(productId: string, price: { amount: number; currency: string }): Promise<void> {
    await this.es.update({ index: this.index, id: productId, doc: { price } }, IGNORE_404);
  }

  async updateStock(productId: string, stock: number): Promise<void> {
    await this.es.update({ index: this.index, id: productId, doc: { stock } }, IGNORE_404);
  }

  async remove(productId: string): Promise<void> {
    await this.es.delete({ index: this.index, id: productId }, IGNORE_404);
  }

  async search(c: SearchCriteria): Promise<SearchResult> {
    const filter: estypes.QueryDslQueryContainer[] = [];
    if (c.categoryId) filter.push({ term: { categoryId: c.categoryId } });
    if (c.condition) filter.push({ term: { condition: c.condition } });
    if (c.currency) filter.push({ term: { "price.currency": c.currency } });
    if (c.minPrice !== undefined || c.maxPrice !== undefined) {
      filter.push({ range: { "price.amount": { gte: c.minPrice, lte: c.maxPrice } } });
    }
    if (c.inStock) filter.push({ range: { stock: { gt: 0 } } });

    const must: estypes.QueryDslQueryContainer[] = c.text
      ? [{ multi_match: { query: c.text, fields: ["name^3", "description"], fuzziness: "AUTO" } }]
      : [{ match_all: {} }];

    const res = await this.es.search({
      index: this.index,
      query: { bool: { must, filter } },
      sort: this.sortFor(c.sort),
      from: (c.page - 1) * c.pageSize,
      size: c.pageSize,
      track_total_hits: true,
      aggs: {
        categories: { terms: { field: "categoryId", size: 20 } },
        conditions: { terms: { field: "condition" } },
        price: { stats: { field: "price.amount" } },
      },
    });

    const aggs = res.aggregations as unknown as Aggs;
    const total = typeof res.hits.total === "number" ? res.hits.total : (res.hits.total?.value ?? 0);
    const toBuckets = (agg: BucketAgg): FacetBucket[] =>
      agg.buckets.map((b) => ({ key: String(b.key), count: b.doc_count }));

    return {
      total,
      page: c.page,
      pageSize: c.pageSize,
      items: res.hits.hits.map((h) => h._source as ProductSearchDocument),
      facets: {
        categories: toBuckets(aggs.categories),
        conditions: toBuckets(aggs.conditions),
        price: { min: aggs.price.min, max: aggs.price.max },
      },
    };
  }

  /** El desempate por productId mantiene estable la paginación. */
  private sortFor(sort: SearchCriteria["sort"]): estypes.Sort {
    switch (sort) {
      case "price_asc":
        return [{ "price.amount": "asc" }, { productId: "asc" }];
      case "price_desc":
        return [{ "price.amount": "desc" }, { productId: "asc" }];
      case "newest":
        return [{ publishedAt: "desc" }, { productId: "asc" }];
      default: {
        const byRelevance: estypes.Sort = [
          { _score: { order: "desc" } },
          { publishedAt: "desc" },
          { productId: "asc" },
        ];
        return byRelevance;
      }
    }
    }
}