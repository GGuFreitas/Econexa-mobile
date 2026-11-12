import { env } from '@config/env.js';
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

export type CodigoDeErro =
  | 'CONTA_BLOQUEADA'
  | 'SESSAO_INVALIDA'
  | 'SESSAO_COMPROMETIDA';

export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 400,
    public readonly code?: CodigoDeErro,
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

function erroDeClienteDoFastify(error: FastifyError | Error): error is FastifyError {
  const { code, statusCode } = error as FastifyError;
  return (
    typeof code === 'string' &&
    code.startsWith('FST_') &&
    typeof statusCode === 'number' &&
    statusCode >= 400 &&
    statusCode < 500
  );
}

export function errorHandler(error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      notification: {
        status: 'warn',
        msg: error.message,
        ...(error.code ? { code: error.code } : {}),
      },
    });
  }

  if (error instanceof ZodError) {
    return reply.status(400).send({
      notification: { status: 'warn', msg: error.issues[0]?.message ?? 'Dados inválidos.' },
    });
  }

  if (erroDeClienteDoFastify(error)) {
    return reply.status(error.statusCode as number).send({
      notification: { status: 'warn', msg: 'Requisição inválida.' },
    });
  }

  request.log.error({
    msg: `HTTP 500 - ${request.url} - ${error.message}`,
    method: request.method,
    url: request.url,
    body: request.body,
    error: error.stack,
  });

  return reply.status(500).send({
    notification: {
      status: 'error',
      msg: 'Ocorreu um erro inesperado no Mutira. Tente novamente mais tarde.',
    },
    debug: env.NODE_ENV === 'development' ? { message: error.message, stack: error.stack } : undefined,
  });
}
