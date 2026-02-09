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

  fastify.get('/correlations', async (request, reply) => {
    try {
      const userId = (request as AuthRequest).user!.userId;

      if (!rateLimiter.check(userId, 10, 60 * 1000)) {
        return reply.status(429).send({ error: 'Too many requests, please try again later.' });
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Security: Only select necessary fields, exclude large 'text' field
      const entries = await prisma.journalEntry.findMany({
        where: {
          userId,
          createdAt: { gte: thirtyDaysAgo }
        },
        orderBy: { createdAt: 'asc' },
        select: {
          mood: true,
          stress: true,
          energy: true,
          tags: true
        }
      });

      if (entries.length === 0) {
        return reply.send({
          range: '30d',
          baseline: { mood: 0, stress: 0, energy: 0 },
          tagCorrelations: [],
          insights: [],
          entryCount: 0
        });
      }

      // Calculate 30-day baseline averages
      const baseline = {
        mood: entries.reduce((sum, e) => sum + e.mood, 0) / entries.length,
        stress: entries.reduce((sum, e) => sum + e.stress, 0) / entries.length,
        energy: entries.reduce((sum, e) => sum + e.energy, 0) / entries.length
      };

      // Aggregate metrics per tag
      // Security: Cap at 100 unique tags to prevent memory exhaustion
      const tagMetrics = new Map<string, { mood: number[]; stress: number[]; energy: number[]; count: number }>();
      const MAX_TAGS = 100;

      for (const entry of entries) {
        for (const tag of entry.tags) {
          if (!tagMetrics.has(tag) && tagMetrics.size >= MAX_TAGS) continue;

          if (!tagMetrics.has(tag)) {
            tagMetrics.set(tag, { mood: [], stress: [], energy: [], count: 0 });
          }
          const data = tagMetrics.get(tag)!;
          data.mood.push(entry.mood);
          data.stress.push(entry.stress);
          data.energy.push(entry.energy);
          data.count++;
        }
      }

      const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

      // Build per-tag correlation data
      const tagCorrelations = Array.from(tagMetrics.entries()).map(([tag, data]) => {
        const tagAvg = {
          mood: avg(data.mood),
          stress: avg(data.stress),
          energy: avg(data.energy)
        };

        const deviations = {
          mood: baseline.mood !== 0 ? ((tagAvg.mood - baseline.mood) / baseline.mood) * 100 : 0,
          stress: baseline.stress !== 0 ? ((tagAvg.stress - baseline.stress) / baseline.stress) * 100 : 0,
          energy: baseline.energy !== 0 ? ((tagAvg.energy - baseline.energy) / baseline.energy) * 100 : 0
        };

        return {
          tag,
          entryCount: data.count,
          averages: {
            mood: Math.round(tagAvg.mood * 100) / 100,
            stress: Math.round(tagAvg.stress * 100) / 100,
            energy: Math.round(tagAvg.energy * 100) / 100
          },
          deviations: {
            mood: Math.round(deviations.mood * 10) / 10,
            stress: Math.round(deviations.stress * 10) / 10,
            energy: Math.round(deviations.energy * 10) / 10
          }
        };
      });

      // Generate human-readable insights for significant deviations (>= 15%)
      const DEVIATION_THRESHOLD = 15;
      const insights: string[] = [];

      for (const tc of tagCorrelations) {
        // Require at least 2 entries for a tag to be meaningful
        if (tc.entryCount < 2) continue;

        const parts: string[] = [];

        for (const metric of ['mood', 'stress', 'energy'] as const) {
          const dev = tc.deviations[metric];
          if (Math.abs(dev) >= DEVIATION_THRESHOLD) {
            const direction = dev > 0 ? 'higher' : 'lower';
            parts.push(`your ${metric} is ${Math.abs(dev)}% ${direction} than your baseline`);
          }
        }

        if (parts.length > 0) {
          insights.push(`When you tag '${tc.tag}', ${parts.join(', but ')}.`);
        }
      }

      return reply.send({
        range: '30d',
        baseline: {
          mood: Math.round(baseline.mood * 100) / 100,
          stress: Math.round(baseline.stress * 100) / 100,
          energy: Math.round(baseline.energy * 100) / 100
        },
        tagCorrelations,
        insights,
        entryCount: entries.length
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
}
