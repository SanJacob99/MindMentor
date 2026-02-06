import { FastifyInstance } from 'fastify';
import prisma from '../utils/db';
import { authenticate, AuthRequest } from '../middlewares/authMiddleware';
import { RateLimiter } from '../utils/rateLimiter';

const rateLimiter = new RateLimiter();

export default async function insightRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/summary', async (request, reply) => {
    try {
      const userId = (request as AuthRequest).user!.userId;

      if (!rateLimiter.check(userId, 10, 60 * 1000)) {
        return reply.status(429).send({ error: 'Too many requests, please try again later.' });
      }
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Security: Only select necessary fields to avoid memory exhaustion (DoS)
      // especially preventing large 'text' fields from being loaded into memory.
      const entries = await prisma.journalEntry.findMany({
        where: {
          userId,
          createdAt: { gte: sevenDaysAgo }
        },
        orderBy: { createdAt: 'asc' },
        select: {
          createdAt: true,
          mood: true,
          stress: true,
          energy: true
        }
      });

      // Security: Aggregate by day to prevent DoS via unbounded response size
      const dailyData = new Map<string, { mood: number[]; stress: number[]; energy: number[] }>();

      entries.forEach((e) => {
        const day = e.createdAt.toISOString().split('T')[0];
        if (!dailyData.has(day)) {
          dailyData.set(day, { mood: [], stress: [], energy: [] });
        }
        const data = dailyData.get(day)!;
        data.mood.push(e.mood);
        data.stress.push(e.stress);
        data.energy.push(e.energy);
      });

      const labels: string[] = [];
      const mood: number[] = [];
      const stress: number[] = [];
      const energy: number[] = [];

      // Map preserves insertion order, so labels will be sorted
      dailyData.forEach((values, day) => {
        labels.push(day);
        const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
        mood.push(avg(values.mood));
        stress.push(avg(values.stress));
        energy.push(avg(values.energy));
      });

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
          ? entries.reduce((a, b) => a + b.mood, 0) / entries.length
          : 0
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
}
