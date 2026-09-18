import type { FastifyPluginCallbackZod } from "@fastify/type-provider-zod";
import {
  loginResponseSchema,
  loginSchema,
  registerSchema,
  sellerDTOSchema,
} from "@sales/shared";
import { HttpStatus } from "../../../utils/http-status.ts";
import { loginUseCase, registerUseCase } from "../instances.ts";

export const sellerRoutes: FastifyPluginCallbackZod = (app) => {
  app.post(
    "/login",
    {
      schema: {
        body: loginSchema,
        response: {
          [HttpStatus.OK]: loginResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body;

      const seller = await loginUseCase.execute({ email, password });

      const token = app.jwt.sign({
        email: seller.email,
        id: seller.id,
      });

      return reply.status(HttpStatus.OK).send({ seller, token });
    }
  );

  app.post(
    "/register",
    {
      schema: {
        body: registerSchema,
        response: {
          [HttpStatus.CREATED]: sellerDTOSchema,
        },
      },
    },
    async (request, reply) => {
      const seller = await registerUseCase.execute(request.body);

      return reply.status(HttpStatus.CREATED).send(seller);
    }
  );
};
