import {
  BusinessRuleException,
  ValidationException,
} from "../../../../@shared/domain/exceptions/DomainException.js";
import { DateValue } from "../../../../@shared/domain/value-objects/DateValue.vo.js";
import { Id } from "../../../../@shared/domain/value-objects/Id.vo.js";
import type { ProductDomainEvent } from "../events/ProductEvents.js";
import { Price } from "../value-objects/Price.vo.js";
import { type ProductCondition, parseProductCondition } from "../value-objects/ProductCondition.vo.js";
import { ProductName } from "../value-objects/ProductName.vo.js";
import { type PublicationStatus, parsePublicationStatus } from "../value-objects/PublicationStatus.vo.js";
import { Stock } from "../value-objects/Stock.vo.js";
import type { ProductPrimitives, ProductSnapshot } from "./ProductPrimitives.js";
import { ProductNotOwnedException } from "../exceptions/ProductNotOwnedException.js";

interface ProductProps {
  id: Id;
  sellerId: Id;
  name: ProductName;
  description: string;
  categoryId: string;
  price: Price;
  stock: Stock;
  condition: ProductCondition;
  status: PublicationStatus;
  archivedAt: DateValue | null;
  createdAt: DateValue;
  updatedAt: DateValue;
  /** 0 = todavía no persistido. Se usa para bloqueo optimista. */
  version: number;
}

export interface CreateProductProps {
  sellerId: string;
  name: string;
  description?: string;
  categoryId: string;
  price: { amount: number; currency: string };
  stock: number;
  condition: string;
}

const nowIso = () => DateValue.now().toISOString();

export class Product {
  private events: ProductDomainEvent[] = [];

  private constructor(private readonly props: ProductProps) {}

  static create(input: CreateProductProps): Product {
    const categoryId = input.categoryId.trim();
    if (!categoryId) throw new ValidationException("La categoría es obligatoria");

    const now = DateValue.now();
    const product = new Product({
      id: Id.generate(),
      sellerId: Id.from(input.sellerId),
      name: ProductName.from(input.name),
      description: input.description?.trim() ?? "",
      categoryId,
      price: Price.from(input.price.amount, input.price.currency),
      stock: Stock.from(input.stock),
      condition: parseProductCondition(input.condition),
      status: "DRAFT",
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
      version: 0,
    });
    product.events.push({ type: "ProductCreated", occurredAt: nowIso(), snapshot: product.snapshot() });
    return product;
  }

  /** Reconstruye el agregado desde persistencia. No emite eventos. */
  static reconstitute(p: ProductPrimitives): Product {
    return new Product({
      id: Id.from(p.productId),
      sellerId: Id.from(p.sellerId),
      name: ProductName.from(p.name),
      description: p.description,
      categoryId: p.categoryId,
      price: Price.from(p.price.amount, p.price.currency),
      stock: Stock.from(p.stock),
      condition: parseProductCondition(p.condition),
      status: parsePublicationStatus(p.status),
      archivedAt: p.archivedAt ? DateValue.from(p.archivedAt) : null,
      createdAt: DateValue.from(p.createdAt),
      updatedAt: DateValue.from(p.updatedAt),
      version: p.version,
    });
  }

  get id(): string {
    return this.props.id.value;
  }

  get version(): number {
    return this.props.version;
  }

  /** Regla de dominio: solo el vendedor que publicó el producto puede modificarlo. */
  assertOwnedBy(userId: string): void {
    if (!this.props.sellerId.equals(Id.from(userId))) throw new ProductNotOwnedException(this.id);
  }

  publish(): void {
    this.assertNotArchived();
    const { status, stock } = this.props;
    if (status === "ACTIVE") throw new BusinessRuleException("El producto ya está publicado");
    if (status === "SUSPENDED") throw new BusinessRuleException("Un producto suspendido no puede publicarse");
    if (stock.isEmpty()) throw new BusinessRuleException("No se puede publicar un producto sin stock");

    this.props.status = "ACTIVE";
    this.touch();
    this.events.push({ type: "ProductPublished", occurredAt: nowIso(), snapshot: this.snapshot() });
  }

  updatePrice(price: Price): void {
    this.assertNotArchived();
    if (this.props.price.equals(price)) return; // sin cambios, sin evento

    this.props.price = price;
    this.touch();
    this.events.push({
      type: "ProductPriceUpdated",
      occurredAt: nowIso(),
      productId: this.id,
      price: { amount: price.amount, currency: price.currency },
    });
  }

  updateStock(stock: Stock): void {
    this.assertNotArchived();
    if (this.props.stock.equals(stock)) return;

    this.props.stock = stock;
    this.touch();
    this.events.push({ type: "ProductStockUpdated", occurredAt: nowIso(), productId: this.id, stock: stock.value });
  }

  archive(): void {
    this.assertNotArchived();
    this.props.archivedAt = DateValue.now();
    this.touch();
    this.events.push({ type: "ProductArchived", occurredAt: nowIso(), productId: this.id });
  }

  pullEvents(): ProductDomainEvent[] {
    const pending = this.events;
    this.events = [];
    return pending;
  }

  toPrimitives(): ProductPrimitives {
    const p = this.props;
    return {
      ...this.snapshot(),
      archivedAt: p.archivedAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      version: p.version,
    };
  }

  private snapshot(): ProductSnapshot {
    const p = this.props;
    return {
      productId: p.id.value,
      sellerId: p.sellerId.value,
      name: p.name.value,
      description: p.description,
      categoryId: p.categoryId,
      price: { amount: p.price.amount, currency: p.price.currency },
      stock: p.stock.value,
      condition: p.condition,
      status: p.status,
    };
  }

  private assertNotArchived(): void {
    if (this.props.archivedAt) throw new BusinessRuleException("El producto está archivado y no admite cambios");
  }

  private touch(): void {
    this.props.updatedAt = DateValue.now();
  }
}