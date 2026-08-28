import { env } from '@config/env.js';
import fastifyCompress from '@fastify/compress';
import fastifyCors from '@fastify/cors';
import { errorHandler } from '@shared/errors.js';
import { registerRoutes } from '@routes/index.js';
import fastify from 'fastify';

const app = fastify({
  trustProxy: true,
  logger: { transport: { target: 'pino-pretty', options: { colorize: true } } },
  bodyLimit: 1048576,
});

app.setErrorHandler(errorHandler);

await app.register(fastifyCompress);

const origins = env.CORS_ORIGINS.split(',').map((origin) => origin.trim());
await app.register(fastifyCors, {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = origins.includes(origin) || /^https?:\/\/localhost(:\d+)?$/.test(origin);
    callback(null, allowed);
  },
});

await app.register(
  async (api) => {
    await registerRoutes(api);
  },
  { prefix: '/api' },
);

export { app };
