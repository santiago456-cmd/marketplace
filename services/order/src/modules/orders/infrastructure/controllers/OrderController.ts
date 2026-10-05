import { UnauthorizedException } from "@marketplace/common";
import { readAuthUser } from "@marketplace/contracts";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { GetOrderUseCase } from "../../application/use-cases/GetOrderUseCase.js";
import type { PlaceOrderUseCase } from "../../application/use-cases/PlaceOrderUseCase.js";
import { idParamsSchema, placeOrderSchema } from "./order.schemas.js";

export interface OrderUseCases {
  place: PlaceOrderUseCase;
  get: GetOrderUseCase;
}

/** La identidad la deja el Gateway; sin ella no se puede operar. */
const currentUser = (req: FastifyRequest) => {
  const user = readAuthUser(req.headers);
  if (!user) throw new UnauthorizedException("Identidad no provista: accede a través del gateway");
  return user;
};

export class OrderController {
  constructor(private readonly useCases: OrderUseCases) {}

  place = async (req: FastifyRequest, reply: FastifyReply) => {
    const user = currentUser(req);
    const order = await this.useCases.place.execute(user.userId, placeOrderSchema.parse(req.body));
    return reply.status(201).send(order);
  };

  get = async (req: FastifyRequest) => {
    const user = currentUser(req);
    const { id } = idParamsSchema.parse(req.params);
    return this.useCases.get.execute(id, user.userId);
  };
}