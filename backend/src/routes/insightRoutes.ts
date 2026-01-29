import { FastifyInstance } from 'fastify';
import prisma from '../utils/db';
import { authenticate, AuthRequest } from '../middlewares/authMiddleware';
import { JournalEntry } from '@prisma/client';

export default async function insightRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/summary', async (request, reply) => {
    try {
      const userId = (request as AuthRequest).user!.userId;
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const entries = await prisma.journalEntry.findMany({
        where: {
          userId,
          createdAt: { gte: sevenDaysAgo }
        },
        orderBy: { createdAt: 'asc' }
      });

      // Simple aggregation
      const labels = entries.map((e: JournalEntry) => e.createdAt.toISOString().split('T')[0]);
      const mood = entries.map((e: JournalEntry) => e.mood);
      const stress = entries.map((e: JournalEntry) => e.stress);
      const energy = entries.map((e: JournalEntry) => e.energy);

      return reply.send({
        range: '7d',
        labels,
        data: mood, // Keep for backward compatibility or simple access
        dataset: {
          mood,
          stress,
          energy
        },
        count: entries.length,
        averageMood: entries.length > 0 
          ? entries.reduce((a: number, b: JournalEntry) => a + b.mood, 0) / entries.length 
          : 0
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
}
