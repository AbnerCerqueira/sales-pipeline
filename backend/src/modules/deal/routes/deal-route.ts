import type { FastifyPluginCallbackZod } from "@fastify/type-provider-zod";
import { createDealSchema, dealDTOSchema } from "@sales/shared";
import { HttpStatus } from "../../../utils/http-status.ts";
import { SwaggerTag } from "../../../utils/swagger-tags.ts";
import { createDealUseCase } from "../instances.ts";

export const dealRoutes: FastifyPluginCallbackZod = (app) => {
  app.post(
    "/",
    {
      preHandler: [app.authenticate],
      schema: {
        body: createDealSchema,
        description:
          "Cadastra um novo negócio vinculado a uma lead, com responsável padrão do lead ou override",
        response: {
          [HttpStatus.CREATED]: dealDTOSchema,
        },
        security: [{ bearerAuth: [] }],
        summary: "Cadastrar deal",
        tags: [SwaggerTag.DEAL],
      },
    },
    async (request, reply) => {
      const deal = await createDealUseCase.execute(request.body);
      return reply.status(HttpStatus.CREATED).send(deal);
    }
  );
};
