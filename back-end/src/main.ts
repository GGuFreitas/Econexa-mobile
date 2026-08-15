import { env } from '@config/env.js';
import { app } from './app.js';

async function bootstrap() {
  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    console.log(`Servidor Mutira rodando em http://localhost:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

void bootstrap();
