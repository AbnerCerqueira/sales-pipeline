import fastifyCors from "@fastify/cors";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "@fastify/type-provider-zod";
import fastify from "fastify";
import { z } from "zod";
import { logger } from "./utils/logger.ts";

export const app = fastify({ loggerInstance: logger })
  .setValidatorCompiler(validatorCompiler)
  .setSerializerCompiler(serializerCompiler)
  .withTypeProvider<ZodTypeProvider>();

app.register(fastifyCors);

app.get(
  "/health-check",
  {
    schema: {
      response: {
        200: z.object({ message: z.string() }),
      },
    },
  },
  () => ({ message: "ok" })
);
