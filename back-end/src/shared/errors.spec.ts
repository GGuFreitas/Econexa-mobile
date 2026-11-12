import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AppError, errorHandler } from './errors.js';

function respostaFalsa() {
  const reply = { status: vi.fn(), send: vi.fn() };
  reply.status.mockReturnValue(reply);
  reply.send.mockReturnValue(reply);
  return reply;
}

function requisicaoFalsa() {
  return { url: '/api/teste', method: 'POST', body: {}, log: { error: vi.fn() } };
}

function tratar(erro: Error) {
  const reply = respostaFalsa();
  const request = requisicaoFalsa();
  errorHandler(erro, request as unknown as FastifyRequest, reply as unknown as FastifyReply);
  return { reply, request, corpo: reply.send.mock.calls[0][0] };
}

describe('errorHandler', () => {
  it('AppError com código devolve o código para o app decidir', () => {
    const { reply, corpo } = tratar(new AppError('Esta conta está bloqueada.', 403, 'CONTA_BLOQUEADA'));

    expect(reply.status).toHaveBeenCalledWith(403);
    expect(corpo).toEqual({
      notification: { status: 'warn', msg: 'Esta conta está bloqueada.', code: 'CONTA_BLOQUEADA' },
    });
  });

  it('AppError sem código mantém o formato de sempre', () => {
    const { corpo } = tratar(new AppError('Problema não encontrado.', 404));

    expect(corpo).toEqual({ notification: { status: 'warn', msg: 'Problema não encontrado.' } });
  });

  it('erro de validação do zod é 400 com a primeira mensagem, não 500', () => {
    const resultado = z
      .object({ email: z.email('Informe um e-mail válido.'), senha: z.string().min(8, 'curta') })
      .safeParse({ email: 'x', senha: '1' });

    const { reply, request, corpo } = tratar(resultado.error!);

    expect(reply.status).toHaveBeenCalledWith(400);
    expect(corpo).toEqual({ notification: { status: 'warn', msg: 'Informe um e-mail válido.' } });
    expect(request.log.error).not.toHaveBeenCalled();
  });

  it('erro de cliente do próprio Fastify mantém o status, com mensagem em português', () => {
    const jsonQuebrado = Object.assign(new Error('Body is not valid JSON'), {
      code: 'FST_ERR_CTP_INVALID_JSON_BODY',
      statusCode: 400,
    });
    const grandeDemais = Object.assign(new Error('Request body is too large'), {
      code: 'FST_ERR_CTP_BODY_TOO_LARGE',
      statusCode: 413,
    });

    expect(tratar(jsonQuebrado).reply.status).toHaveBeenCalledWith(400);
    expect(tratar(jsonQuebrado).corpo.notification.msg).toBe('Requisição inválida.');
    expect(tratar(grandeDemais).reply.status).toHaveBeenCalledWith(413);
  });

  it('qualquer outro erro continua sendo 500 registrado', () => {
    const { reply, request } = tratar(new Error('conexão recusada'));

    expect(reply.status).toHaveBeenCalledWith(500);
    expect(request.log.error).toHaveBeenCalledTimes(1);
  });
});
