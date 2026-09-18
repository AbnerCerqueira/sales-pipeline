import type { FastifyPluginCallbackZod } from "@fastify/type-provider-zod";
import { createLeadSchema, leadDTOSchema } from "@sales/shared";
import { HttpStatus } from "../../../utils/http-status.ts";
import { SwaggerTag } from "../../../utils/swagger-tags.ts";
import { createLeadUseCase } from "../instances.ts";

export const leadRoutes: FastifyPluginCallbackZod = (app) => {
  app.post(
    "/",
    {
      schema: {
        body: createLeadSchema,
        description: "Cadastra um novo lead vinculado a um seller responsável",
        response: {
          [HttpStatus.CREATED]: leadDTOSchema,
        },
        summary: "Cadastrar lead",
        tags: [SwaggerTag.LEAD],
      },
    },
    async (request, reply) => {
      const lead = await createLeadUseCase.execute(request.body);

      return reply.status(HttpStatus.CREATED).send(lead);
    }
  );
};
