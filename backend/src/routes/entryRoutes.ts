import { FastifyInstance } from 'fastify';
import prisma from '../utils/db';
import { authenticate, AuthRequest } from '../middlewares/authMiddleware';
import { createEntrySchema, entryQuerySchema } from '../schemas/entrySchemas';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { RateLimiter } from '../utils/rateLimiter';

const rateLimiter = new RateLimiter();

export default async function entryRoutes(fastify: FastifyInstance) {
  // Global auth hook for these routes could be done here or per-route
  // For simplicity, we apply it to all routes in this plugin
  fastify.addHook('preHandler', authenticate);

  fastify.post('/', async (request, reply) => {
    try {
      const userId = (request as AuthRequest).user!.userId;

      // Security: Rate limit based on User ID to prevent spam/DoS
      if (!rateLimiter.check(userId, 10, 60 * 1000)) {
        return reply.status(429).send({ error: 'Too many requests, please try again later.' });
      }

      const { mood, stress, energy, text, tags } = createEntrySchema.parse(request.body);

      const entry = await prisma.journalEntry.create({
        data: {
          userId,
          mood,
          stress,
          energy,
          text,
          tags,
        },
      });

      return reply.status(201).send(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: (error as any).errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  fastify.get('/', async (request, reply) => {
    try {
      // @ts-ignore - query parsing check
      const { from, to } = entryQuerySchema.parse(request.query || {});
      const userId = (request as AuthRequest).user!.userId;

      // Security: Rate limit based on User ID
      if (!rateLimiter.check(userId, 20, 60 * 1000)) {
        return reply.status(429).send({ error: 'Too many requests, please try again later.' });
      }

      const whereClause: Prisma.JournalEntryWhereInput = { userId };
      if (from || to) {
        whereClause.createdAt = {};
        if (from) whereClause.createdAt.gte = new Date(from);
        if (to) whereClause.createdAt.lte = new Date(to);
      }

      const entries = await prisma.journalEntry.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: 50, // Limit for safety
      });

      return reply.send(entries);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: (error as any).errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
}
