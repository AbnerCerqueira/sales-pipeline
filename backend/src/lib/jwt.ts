import fastifyJwt from "@fastify/jwt";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { env } from "../config/envs.ts";

export default fp(function jwtPlugin(app: FastifyInstance) {
  app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: env.JWT_EXPIRATION,
    },
  });
});
