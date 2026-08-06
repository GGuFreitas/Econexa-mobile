import { env } from "@config/env.js";
import { FastifyError, FastifyReply, FastifyRequest } from "fastify";

export class AppError extends Error {
  constructor (public readonly message: string, public readonly statusCode: number = 400) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export function errorHandler(error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      notification: { status: 'warn', msg: error.message }
    });
  }

  // Erros inesperados do sistema (Log estruturado automático)
  request.log.error({
    msg: `HTTP 500 - ${request.url} - ${error.message}`,
    method: request.method,
    url: request.url,
    body: request.body,
    error: error.stack
  });

  return reply.status(500).send({
    notification: {
      status: 'error',
      msg: 'Ocorreu um erro inesperado no Mutira. Tente novamente mais tarde.'
    },
    debug: env.NODE_ENV === 'development' ? { message: error.message, stack: error.stack } : undefined
  });
}