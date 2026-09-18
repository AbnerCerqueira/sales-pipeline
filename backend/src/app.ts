import fastifyCors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "@fastify/type-provider-zod";
import fastify from "fastify";
import { z } from "zod";
import jwtPlugin from "./lib/jwt.ts";
import { sellerRoutes } from "./modules/seller/routes/seller-route.ts";
import { logger } from "./utils/logger.ts";
import { SwaggerTag } from "./utils/swagger-tags.ts";

export const app = fastify({ loggerInstance: logger })
  .setValidatorCompiler(validatorCompiler)
  .setSerializerCompiler(serializerCompiler)
  .withTypeProvider<ZodTypeProvider>();

app.register(swagger, {
  openapi: {
    components: {
      securitySchemes: {
        bearerAuth: {
          bearerFormat: "JWT",
          scheme: "bearer",
          type: "http",
        },
      },
    },
    info: {
      description: "API para gerenciamento de leads e negócios de vendas",
      title: "Sales Pipeline API",
      version: "1.0.0",
    },
  },
});

app.register(swaggerUi, {
  routePrefix: "/docs",
});

app.register(fastifyCors);
app.register(jwtPlugin);

app.register(sellerRoutes, { prefix: "/seller" });

app.get(
  "/health-check",
  {
    schema: {
      description: "Verifica se a API está funcionando",
      response: {
        200: z.object({ message: z.string() }),
      },
      summary: "Health check",
      tags: [SwaggerTag.HEALTH],
    },
  },
  () => ({ message: "ok" })
);
