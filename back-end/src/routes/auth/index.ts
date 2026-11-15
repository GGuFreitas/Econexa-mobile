import type { FastifyInstance } from 'fastify';
import { parse } from '@shared/validate.js';
import { created, ok } from '@shared/http.js';
import { requireAuth } from '@shared/auth.js';
import { responderHtml } from '@shared/html.js';
import {
  confirmacaoEmailLimiter,
  esqueciSenhaLimiter,
  esqueciSenhaPorEmailLimiter,
  exigirCota,
  loginLimiter,
  porEmail,
  porOrigem,
  porUsuario,
  rateLimitGuard,
  redefinicaoSenhaLimiter,
  reenvioVerificacaoLimiter,
  registroLimiter,
  renovacaoSessaoLimiter,
} from '@shared/ratelimit.js';
import {
  cadastroSchema,
  confirmarEmailQuerySchema,
  esqueciSenhaSchema,
  loginSchema,
  redefinirSenhaSchema,
  refreshTokenSchema,
} from '@common/auth/auth.schemas.js';
import {
  cadastrarUsuario,
  confirmarEmail,
  entrarComSenha,
  obterUsuarioAtual,
  redefinirSenha,
  reenviarVerificacao,
  solicitarRedefinicaoDeSenha,
} from '@common/auth/auth.handler.js';
import { renovarSessao, revogarRefreshToken } from '@common/auth/sessao.js';
import { paginaDaConfirmacao, paginaDeMuitasTentativas } from '@common/auth/auth.paginas.js';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/register',
    { preHandler: rateLimitGuard(registroLimiter, porOrigem) },
    async (request, reply) => {
      const body = parse(cadastroSchema, request.body);
      const sessao = await cadastrarUsuario(body);
      return created(reply, { message: 'Usuário cadastrado com sucesso.', ...sessao });
    },
  );

  app.post(
    '/login',
    { preHandler: rateLimitGuard(loginLimiter, porOrigem) },
    async (request, reply) => {
      const body = parse(loginSchema, request.body);
      const sessao = await entrarComSenha(body);
      return ok(reply, { message: 'Login realizado com sucesso.', ...sessao });
    },
  );

  app.post(
    '/refresh',
    { preHandler: rateLimitGuard(renovacaoSessaoLimiter, porOrigem) },
    async (request, reply) => {
      const { refreshToken } = parse(refreshTokenSchema, request.body);
      return ok(reply, await renovarSessao(refreshToken));
    },
  );

  app.post('/logout', async (request, reply) => {
    const { refreshToken } = parse(refreshTokenSchema, request.body);
    await revogarRefreshToken(refreshToken);
    return reply.status(204).send();
  });

  app.get('/me', { preHandler: requireAuth }, async (request, reply) => {
    const result = await obterUsuarioAtual(request.user!.id);
    return ok(reply, { user: result.user });
  });

  app.post(
    '/resend-verification',
    { preHandler: [requireAuth, rateLimitGuard(reenvioVerificacaoLimiter, porUsuario)] },
    async (request, reply) => {
      await reenviarVerificacao(request.user!.id);
      return reply.status(202).send({
        message: 'Se o seu e-mail ainda não estiver confirmado, enviamos um novo link de confirmação.',
      });
    },
  );

  app.get('/verify-email', { logLevel: 'warn' }, async (request, reply) => {
    if (!confirmacaoEmailLimiter.tryConsume(porOrigem(request))) {
      return responderHtml(reply, paginaDeMuitasTentativas(), 429);
    }

    const consulta = confirmarEmailQuerySchema.safeParse(request.query);
    const resultado = consulta.success ? await confirmarEmail(consulta.data.token) : 'invalido';
    return responderHtml(reply, paginaDaConfirmacao(resultado));
  });

  app.post(
    '/forgot-password',
    { preHandler: rateLimitGuard(esqueciSenhaLimiter, porOrigem) },
    async (request, reply) => {
      const { email } = parse(esqueciSenhaSchema, request.body);
      exigirCota(esqueciSenhaPorEmailLimiter, porEmail(email));

      void solicitarRedefinicaoDeSenha(email).catch((erro: unknown) => {
        request.log.error({ err: erro }, 'Falha ao processar o pedido de código de redefinição.');
      });

      return reply.status(202).send({
        message: 'Se existir uma conta com este e-mail, enviamos um código para redefinir a senha.',
      });
    },
  );

  app.post(
    '/reset-password',
    { preHandler: rateLimitGuard(redefinicaoSenhaLimiter, porOrigem) },
    async (request, reply) => {
      const body = parse(redefinirSenhaSchema, request.body);
      return ok(reply, await redefinirSenha(body));
    },
  );
}
