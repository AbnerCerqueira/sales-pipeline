import { HttpStatus } from "./http-status.ts";

export class ApplicationError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ApplicationError";
    this.statusCode = statusCode;
  }
}

export class UnauthorizedError extends ApplicationError {
  constructor(
    message = "Token de autenticação ausente ou inválido",
    options?: ErrorOptions
  ) {
    super(HttpStatus.UNAUTHORIZED, message, options);
    this.name = "UnauthorizedError";
  }
}
