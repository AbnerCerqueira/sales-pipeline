import fastifyCors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "@fastify/type-provider-zod";
import fastify from "fastify";
import { healthRoutes } from "./health-route.ts";
import authPlugin from "./lib/auth.ts";
import jwtPlugin from "./lib/jwt.ts";
import { leadRoutes } from "./modules/lead/routes/lead-route.ts";
import { sellerRoutes } from "./modules/seller/routes/seller-route.ts";
import { logger } from "./utils/logger.ts";

export const app = fastify({ loggerInstance: logger })
  .setValidatorCompiler(validatorCompiler)
  .setSerializerCompiler(serializerCompiler)
  .withTypeProvider<ZodTypeProvider>();

app.register(fastifyCors);
app.register(jwtPlugin);
app.register(authPlugin);

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
  transform: jsonSchemaTransform,
});

app.register(swaggerUi, {
  routePrefix: "/docs",
  uiConfig: {
    deepLinking: false,
  },
});

app.register(sellerRoutes, { prefix: "/seller" });
app.register(leadRoutes, { prefix: "/lead" });
app.register(healthRoutes, { prefix: "/health-check" });
