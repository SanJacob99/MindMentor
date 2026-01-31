import { FastifyInstance } from 'fastify';
import prisma from '../utils/db';
import { authenticate, AuthRequest } from '../middlewares/authMiddleware';
import { z } from 'zod';
import { JournalEntry } from '@prisma/client';
import { RateLimiter } from '../utils/rateLimiter';

const rateLimiter = new RateLimiter();

export default async function recommendationRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/today', async (request, reply) => {
    try {
      const userId = (request as AuthRequest).user!.userId;

      // Security: Rate limit based on User ID
      if (!rateLimiter.check(userId, 20, 60 * 1000)) {
        return reply.status(429).send({ error: 'Too many requests, please try again later.' });
      }

      // check today's recs first
      const today = new Date();
      today.setHours(0,0,0,0);
      
      const existing = await prisma.recommendation.findMany({
        where: {
          userId,
          createdAt: { gte: today }
        }
      });

      if (existing.length > 0) {
        return reply.send({ recommendations: existing });
      }

      // Check entry count
      const count = await prisma.journalEntry.count({ where: { userId } });
      if (count < 3) {
        return reply.send({ recommendations: [] });
      }

      // Generate logic
      const lastEntries = await prisma.journalEntry.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 3
      });

      const avgMood = lastEntries.reduce((sum: number, e: JournalEntry) => sum + e.mood, 0) / lastEntries.length;
      
      let type = 'GRATITUDE';
      let rationale = 'Things seem stable. Keep the momentum!';
      
      if (avgMood < 5) {
        type = 'WALK';
        rationale = 'Your mood has been lower lately. A walk might help.';
      } else if (lastEntries[0].stress > 7) {
        type = 'BREATHE';
        rationale = 'High stress detected. Try deep breathing.';
      }

      const rec = await prisma.recommendation.create({
        data: {
          userId,
          type,
          rationale,
          confidence: 0.8,
          status: 'PENDING'
        }
      });

      return reply.send({ recommendations: [rec] });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  fastify.post('/:id/feedback', async (request, reply) => {
    try {
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
      const { outcome } = z.object({ outcome: z.enum(['HELPED', 'NOT_HELPED']) }).parse(request.body);
      const userId = (request as AuthRequest).user!.userId;

      // Security: Rate limit based on User ID
      if (!rateLimiter.check(userId, 20, 60 * 1000)) {
        return reply.status(429).send({ error: 'Too many requests, please try again later.' });
      }

      const rec = await prisma.recommendation.findUnique({ where: { id } });
      if (!rec || rec.userId !== userId) {
        return reply.status(404).send({ error: 'Recommendation not found' });
      }

      await prisma.recommendationFeedback.create({
        data: {
          recommendationId: id,
          userId,
          outcome
        }
      });

      // Update status
      await prisma.recommendation.update({
        where: { id },
        data: { status: 'COMPLETED' }
      });

      return reply.send({ success: true });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: (error as any).errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
}
