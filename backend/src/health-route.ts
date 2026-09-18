import type { FastifyPluginCallbackZod } from "@fastify/type-provider-zod";
import { z } from "zod";
import { SwaggerTag } from "./utils/swagger-tags.ts";

export const healthRoutes: FastifyPluginCallbackZod = (app) => {
  app.get(
    "/",
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
};
