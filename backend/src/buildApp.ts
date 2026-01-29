import Fastify from 'fastify';
import cors from '@fastify/cors';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import entryRoutes from './routes/entryRoutes';
import recommendationRoutes from './routes/recommendationRoutes';
import insightRoutes from './routes/insightRoutes';

export function buildApp() {
  // Trust proxy is required for correct IP rate limiting when behind a load balancer
  const fastify = Fastify({
    logger: true,
    trustProxy: true
  });

  fastify.register(cors, {
    origin: true
  });

  // Security Headers
  fastify.addHook('onRequest', async (request, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('X-XSS-Protection', '1; mode=block');
    reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    reply.header('Content-Security-Policy', "default-src 'self'");
  });

  // Register custom routes
  fastify.register(authRoutes, { prefix: '/auth' });
  fastify.register(userRoutes, { prefix: '/users' });
  fastify.register(entryRoutes, { prefix: '/entries' });
  fastify.register(recommendationRoutes, { prefix: '/recommendations' });
  fastify.register(insightRoutes, { prefix: '/insights' });

  fastify.get('/health', async () => {
    return { status: 'ok' };
  });

  return fastify;
}
