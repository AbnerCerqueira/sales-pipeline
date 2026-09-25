import type { FastifyPluginCallbackZod } from "@fastify/type-provider-zod";
import {
  createDealSchema,
  dealDTOSchema,
  dealIdParamsSchema,
  listDealsQuerySchema,
  listDealsResponseSchema,
  updateDealSchema,
} from "@sales/shared";
import { HttpStatus } from "../../../utils/http-status.ts";
import { SwaggerTag } from "../../../utils/swagger-tags.ts";
import {
  createDealUseCase,
  listDealsUseCase,
  updateDealUseCase,
} from "../instances.ts";

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

  app.get(
    "/search",
    {
      preHandler: [app.authenticate],
      schema: {
        description:
          "Busca deals com filtros opcionais de responsável e status",
        querystring: listDealsQuerySchema,
        response: {
          [HttpStatus.OK]: listDealsResponseSchema,
        },
        security: [{ bearerAuth: [] }],
        summary: "Buscar deals",
        tags: [SwaggerTag.DEAL],
      },
    },
    async (request, reply) => {
      const deals = await listDealsUseCase.execute(request.query);
      return reply.status(HttpStatus.OK).send(deals);
    }
  );

  app.patch(
    "/:id",
    {
      preHandler: [app.authenticate],
      schema: {
        body: updateDealSchema,
        description: "Atualiza campos de um deal, incluindo status do kanban",
        params: dealIdParamsSchema,
        response: {
          [HttpStatus.OK]: dealDTOSchema,
        },
        security: [{ bearerAuth: [] }],
        summary: "Atualizar deal",
        tags: [SwaggerTag.DEAL],
      },
    },
    async (request, reply) => {
      const deal = await updateDealUseCase.execute(
        request.params.id,
        request.body
      );
      return reply.status(HttpStatus.OK).send(deal);
    }
  );
};
