import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { UnauthorizedError } from "../utils/errors.ts";

export type SellerTokenPayload = {
  email: string;
  id: string;
};

declare module "@fastify/jwt" {
  export interface FastifyJWT {
    payload: SellerTokenPayload;
    user: SellerTokenPayload;
  }
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }
}

export default fp(function authPlugin(app: FastifyInstance) {
  app.decorate(
    "authenticate",
    async function authenticate(request: FastifyRequest, _reply: FastifyReply) {
      try {
        await request.jwtVerify();
      } catch (error) {
        throw new UnauthorizedError(undefined, { cause: error });
      }
    }
  );
});
