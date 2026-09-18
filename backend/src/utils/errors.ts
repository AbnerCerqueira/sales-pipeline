export class ApplicationError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "ApplicationError";
    this.statusCode = statusCode;
  }
}
