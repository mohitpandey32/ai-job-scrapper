import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (request: Request, _response: Response, next: NextFunction) => {
    request.query = schema.parse(request.query) as Request["query"];
    next();
  };
}

