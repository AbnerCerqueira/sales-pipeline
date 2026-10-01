import type { FastifyPluginCallbackZod } from "@fastify/type-provider-zod";
import {
  commentDealParamsSchema,
  commentDTOSchema,
  createCommentSchema,
  listCommentsResponseSchema,
} from "@sales/shared";
import { HttpStatus } from "../../../utils/http-status.ts";
import { SwaggerTag } from "../../../utils/swagger-tags.ts";
import { createCommentUseCase, listCommentsUseCase } from "../instances.ts";

export const commentRoutes: FastifyPluginCallbackZod = (app) => {
  app.post(
    "/",
    {
      preHandler: [app.authenticate],
      schema: {
        body: createCommentSchema,
        description:
          "Cria um comentário em um deal; o autor é o seller autenticado no token",
        response: {
          [HttpStatus.CREATED]: commentDTOSchema,
        },
        security: [{ bearerAuth: [] }],
        summary: "Comentar no deal",
        tags: [SwaggerTag.COMMENT],
      },
    },
    async (request, reply) => {
      const comment = await createCommentUseCase.execute(
        request.user.id,
        request.body
      );
      return reply.status(HttpStatus.CREATED).send(comment);
    }
  );

  app.get(
    "/deal/:dealId",
    {
      preHandler: [app.authenticate],
      schema: {
        description:
          "Lista os comentários de um deal em ordem cronológica, com o autor de cada um",
        params: commentDealParamsSchema,
        response: {
          [HttpStatus.OK]: listCommentsResponseSchema,
        },
        security: [{ bearerAuth: [] }],
        summary: "Listar comentários do deal",
        tags: [SwaggerTag.COMMENT],
      },
    },
    async (request, reply) => {
      const comments = await listCommentsUseCase.execute(request.params.dealId);
      return reply.status(HttpStatus.OK).send(comments);
    }
  );
};
