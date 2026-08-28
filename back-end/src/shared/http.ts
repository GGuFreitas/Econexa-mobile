import type { FastifyReply } from 'fastify';

export function ok(reply: FastifyReply, data: unknown) {
  return reply.send(data);
}

export function created(reply: FastifyReply, data: unknown) {
  return reply.status(201).send(data);
}
