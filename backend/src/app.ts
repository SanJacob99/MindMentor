import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { env } from './config/env';

// Trust proxy is required for correct IP rate limiting when behind a load balancer
//TODO: Remember to set the variables of trusted ip when in production, evaluate if environment variables are the best way to do this
const fastify = Fastify({
  logger: true,
  trustProxy: true
});
const prisma = new PrismaClient();

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import entryRoutes from './routes/entryRoutes';
import recommendationRoutes from './routes/recommendationRoutes';
import insightRoutes from './routes/insightRoutes';

const start = async () => {
  try {
    // Register custom routes
    await fastify.register(authRoutes, { prefix: '/auth' });
    await fastify.register(userRoutes, { prefix: '/users' });
    await fastify.register(entryRoutes, { prefix: '/entries' });
    await fastify.register(recommendationRoutes, { prefix: '/recommendations' });
    await fastify.register(insightRoutes, { prefix: '/insights' });
    
    fastify.get('/health', async () => {
      return { status: 'ok' };
    });

    await fastify.listen({ port: env.PORT, host: '0.0.0.0' });
    console.log(`Server listening on ${env.PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
