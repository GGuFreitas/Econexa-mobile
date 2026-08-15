import { env } from '@config/env.js';
import fastifyAutoload from '@fastify/autoload';
import fastifyCompress from '@fastify/compress';
import fastifyCors from '@fastify/cors';
import { errorHandler } from '@shared/errors/errorHandler.js';
import fastify from 'fastify';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

await app.register(fastifyAutoload, {
  dir: join(__dirname, 'routes'),
  options: { prefix: '/api' },
});

export { app };
