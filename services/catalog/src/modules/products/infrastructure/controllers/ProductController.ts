import { readAuthUser } from "@marketplace/contracts";
import type { FastifyReply, FastifyRequest } from "fastify";
import { UnauthorizedException } from "@marketplace/common";
import type { ArchiveProductUseCase } from "../../application/use-cases/ArchiveProductUseCase.js";
import type { CreateProductUseCase } from "../../application/use-cases/CreateProductUseCase.js";
import type { GetProductUseCase } from "../../application/use-cases/GetProductUseCase.js";
import type { PublishProductUseCase } from "../../application/use-cases/PublishProductUseCase.js";
import type { UpdateProductPriceUseCase } from "../../application/use-cases/UpdateProductPriceUseCase.js";
import type { UpdateProductStockUseCase } from "../../application/use-cases/UpdateProductStockUseCase.js";
import { createProductSchema, idParamsSchema, updatePriceSchema, updateStockSchema } from "./product.schemas.js";

export interface ProductUseCases {
  create: CreateProductUseCase;
  get: GetProductUseCase;
  publish: PublishProductUseCase;
  updatePrice: UpdateProductPriceUseCase;
  updateStock: UpdateProductStockUseCase;
  archive: ArchiveProductUseCase;
}

/** La identidad la deja el Gateway; sin ella no se puede operar. */
const currentUser = (req: FastifyRequest) => {
  const user = readAuthUser(req.headers);
  if (!user) throw new UnauthorizedException("Identidad no provista: accede a través del gateway");
  return user;
};

export class ProductController {
  constructor(private readonly useCases: ProductUseCases) {}

  create = async (req: FastifyRequest, reply: FastifyReply) => {
    const user = currentUser(req);
    const body = createProductSchema.parse(req.body);
    const product = await this.useCases.create.execute({ ...body, sellerId: user.userId });
    return reply.status(201).send(product);
  };

  get = async (req: FastifyRequest) => {
    const { id } = idParamsSchema.parse(req.params);
    return this.useCases.get.execute(id);
  };

  publish = async (req: FastifyRequest) => {
    const user = currentUser(req);
    const { id } = idParamsSchema.parse(req.params);
    return this.useCases.publish.execute(id, user.userId);
  };

  updatePrice = async (req: FastifyRequest) => {
    const user = currentUser(req);
    const { id } = idParamsSchema.parse(req.params);
    return this.useCases.updatePrice.execute(id, user.userId, updatePriceSchema.parse(req.body));
  };

  updateStock = async (req: FastifyRequest) => {
    const user = currentUser(req);
    const { id } = idParamsSchema.parse(req.params);
    const { stock } = updateStockSchema.parse(req.body);
    return this.useCases.updateStock.execute(id, user.userId, stock);
  };

  archive = async (req: FastifyRequest, reply: FastifyReply) => {
    const user = currentUser(req);
    const { id } = idParamsSchema.parse(req.params);
    await this.useCases.archive.execute(id, user.userId);
    return reply.status(204).send();
  };
}