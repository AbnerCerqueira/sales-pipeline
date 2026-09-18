export const HttpStatus = {
  BAD_REQUEST: 400,
  CONFLICT: 409,
  CREATED: 201,
  FORBIDDEN: 403,
  INTERNAL_SERVER_ERROR: 500,
  NO_CONTENT: 204,
  NOT_FOUND: 404,
  OK: 200,
  UNAUTHORIZED: 401,
  UNPROCESSABLE_ENTITY: 422,
} as const;

export type HttpStatus = (typeof HttpStatus)[keyof typeof HttpStatus];
