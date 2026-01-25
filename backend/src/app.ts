import { env } from './config/env';
import { buildApp } from './buildApp';

const start = async () => {
  const fastify = buildApp();
  try {
    await fastify.listen({ port: env.PORT, host: '0.0.0.0' });
    console.log(`Server listening on ${env.PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
