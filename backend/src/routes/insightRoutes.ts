import { FastifyInstance } from 'fastify';
import prisma from '../utils/db';
import { authenticate, AuthRequest } from '../middlewares/authMiddleware';
import { RateLimiter } from '../utils/rateLimiter';
import { patternQuerySchema } from '../schemas/insightSchemas';
import {
  computeHourlyPatterns,
  computeWeekdayPatterns,
  computeMonthlyTrend,
  computeStreaks,
  computeRecoveryPatterns,
  computeTagCombinations,
} from '../utils/patternAnalysis';
import {
  analyzeSentiment,
  extractKeywords,
  computeEmotionBreakdown,
} from '../utils/textAnalysis';
import {
  generateTimeInsights,
  generateStreakInsights,
  generateTagInsights,
  generateTextInsights,
} from '../utils/insightGenerator';

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

  // --- Emotional Pattern Analysis Endpoints ---

  fastify.get('/patterns', async (request, reply) => {
    try {
      const userId = (request as AuthRequest).user!.userId;

      if (!rateLimiter.check(userId, 5, 60 * 1000)) {
        return reply.status(429).send({ error: 'Too many requests, please try again later.' });
      }

      const parsed = patternQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Invalid query parameters.' });
      }

      const { range } = parsed.data;
      const days = range === '90d' ? 90 : 30;
      const since = new Date();
      since.setDate(since.getDate() - days);

      // Fetch newest entries first (desc) to avoid dropping recent data when capped,
      // then re-sort ascending for chronological analysis
      const entriesDesc = await prisma.journalEntry.findMany({
        where: { userId, createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true, mood: true, stress: true, energy: true },
        take: 500,
      });
      const entries = entriesDesc.reverse();

      if (entries.length < 7) {
        return reply.send({
          range,
          entryCount: entries.length,
          minimumDataRequired: 7,
          message: `Keep journaling! We need ${7 - entries.length} more entries to show patterns.`,
        });
      }

      // Read user timezone preference (supports both IANA string and legacy numeric offset)
      let tzOffsetMinutes = 0;
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { preferences: true },
        });
        if (user?.preferences && typeof user.preferences === 'object') {
          const prefs = user.preferences as Record<string, unknown>;
          if (typeof prefs.timezone === 'string') {
            // IANA timezone string (e.g. "America/New_York") - compute current offset
            try {
              const now = new Date();
              const utcStr = now.toLocaleString('en-US', { timeZone: 'UTC' });
              const tzStr = now.toLocaleString('en-US', { timeZone: prefs.timezone });
              tzOffsetMinutes = (new Date(tzStr).getTime() - new Date(utcStr).getTime()) / 60000;
            } catch { /* invalid timezone, fall back to UTC */ }
          } else if (typeof prefs.timezoneOffset === 'number') {
            // Legacy numeric offset in minutes
            tzOffsetMinutes = prefs.timezoneOffset;
          }
        }
      } catch { /* default to UTC */ }

      const timeOfDay = computeHourlyPatterns(entries, tzOffsetMinutes);
      const weekday = computeWeekdayPatterns(entries, tzOffsetMinutes);
      const trends = computeMonthlyTrend(entries);
      const streaks = computeStreaks(entries);
      const recovery = computeRecoveryPatterns(entries);

      const timeInsights = generateTimeInsights(
        timeOfDay.buckets, timeOfDay.bestBucket, timeOfDay.worstBucket,
        weekday.days, weekday.bestDay, weekday.worstDay,
        trends.direction
      );
      const streakInsights = generateStreakInsights(
        streaks.current, streaks.best, streaks.volatility, recovery
      );
      const insights = [...timeInsights, ...streakInsights].slice(0, 10);

      return reply.send({
        range,
        entryCount: entries.length,
        timeOfDay,
        weekday,
        trends: {
          weeks: trends.weeks,
          direction: trends.direction,
          slopes: trends.slopes,
        },
        streaks: {
          current: streaks.current,
          best: streaks.best,
          volatility: streaks.volatility,
        },
        recovery,
        insights,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  fastify.get('/tags', async (request, reply) => {
    try {
      const userId = (request as AuthRequest).user!.userId;

      if (!rateLimiter.check(userId, 5, 60 * 1000)) {
        return reply.status(429).send({ error: 'Too many requests, please try again later.' });
      }

      const parsed = patternQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Invalid query parameters.' });
      }

      const { range } = parsed.data;
      const days = range === '90d' ? 90 : 30;
      const since = new Date();
      since.setDate(since.getDate() - days);

      const entriesDesc = await prisma.journalEntry.findMany({
        where: { userId, createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true, mood: true, stress: true, energy: true, tags: true },
        take: 500,
      });
      const entries = entriesDesc.reverse();

      if (entries.length === 0) {
        return reply.send({
          range,
          entryCount: 0,
          baseline: { mood: 0, stress: 0, energy: 0 },
          tagAnalysis: [],
          combinations: [],
          negativeCorrelations: [],
          insights: [],
          message: `Keep adding tags to your entries! We need more tagged entries to show analysis.`,
        });
      }

      const baseline = {
        mood: entries.reduce((s, e) => s + e.mood, 0) / entries.length,
        stress: entries.reduce((s, e) => s + e.stress, 0) / entries.length,
        energy: entries.reduce((s, e) => s + e.energy, 0) / entries.length,
      };

      const result = computeTagCombinations(entries, baseline);
      const insights = generateTagInsights(
        result.tagAnalysis, result.combinations, result.negativeCorrelations
      );

      return reply.send({
        range,
        entryCount: entries.length,
        baseline: {
          mood: Math.round(baseline.mood * 100) / 100,
          stress: Math.round(baseline.stress * 100) / 100,
          energy: Math.round(baseline.energy * 100) / 100,
        },
        tagAnalysis: result.tagAnalysis,
        combinations: result.combinations,
        negativeCorrelations: result.negativeCorrelations,
        insights,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  fastify.get('/text-analysis', async (request, reply) => {
    try {
      const userId = (request as AuthRequest).user!.userId;

      if (!rateLimiter.check(userId, 3, 60 * 1000)) {
        return reply.status(429).send({ error: 'Too many requests, please try again later.' });
      }

      const parsed = patternQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Invalid query parameters.' });
      }

      const { range } = parsed.data;
      const days = range === '90d' ? 90 : 30;
      const since = new Date();
      since.setDate(since.getDate() - days);

      const entriesDesc = await prisma.journalEntry.findMany({
        where: { userId, createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        select: { text: true, mood: true, createdAt: true },
        take: 200,
      });
      const entries = entriesDesc.reverse();

      const entriesWithText = entries.filter((e) => e.text && e.text.trim().length > 0);

      if (entriesWithText.length < 5) {
        return reply.send({
          range,
          totalEntries: entries.length,
          entriesWithText: entriesWithText.length,
          minimumDataRequired: 5,
          message: `Keep adding notes to your entries! We need ${5 - entriesWithText.length} more entries with text to show analysis.`,
        });
      }

      // Sentiment analysis - overall and weekly trend
      const sentimentScores = entriesWithText.map((e) => ({
        ...analyzeSentiment(e.text!.slice(0, 1000)),
        createdAt: e.createdAt,
      }));

      const overallSentiment = sentimentScores.length > 0
        ? Math.round((sentimentScores.reduce((s, r) => s + r.score, 0) / sentimentScores.length) * 100) / 100
        : 0;

      // Weekly sentiment trend
      const weekMap = new Map<string, number[]>();
      for (const s of sentimentScores) {
        const d = s.createdAt;
        const weekStart = new Date(d);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekLabel = weekStart.toISOString().split('T')[0];
        if (!weekMap.has(weekLabel)) weekMap.set(weekLabel, []);
        weekMap.get(weekLabel)!.push(s.score);
      }

      const sentimentTrend = Array.from(weekMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([weekLabel, scores]) => ({
          weekLabel,
          avgSentiment: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100,
        }));

      // Determine sentiment direction via simple slope
      let sentimentDirection: 'improving' | 'declining' | 'stable' = 'stable';
      if (sentimentTrend.length >= 2) {
        const vals = sentimentTrend.map((t) => t.avgSentiment);
        const firstHalf = vals.slice(0, Math.floor(vals.length / 2));
        const secondHalf = vals.slice(Math.floor(vals.length / 2));
        const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        if (avgSecond - avgFirst > 0.1) sentimentDirection = 'improving';
        else if (avgFirst - avgSecond > 0.1) sentimentDirection = 'declining';
      }

      // Keywords
      const keywordEntries = entriesWithText.map((e) => ({
        text: e.text!,
        mood: e.mood,
      }));
      const keywords = extractKeywords(keywordEntries, 30);

      // Emotion breakdown
      const emotions = computeEmotionBreakdown(keywordEntries);

      // Baseline mood for insight generation
      const baselineMood = entries.length > 0
        ? entries.reduce((s, e) => s + e.mood, 0) / entries.length
        : 5;

      const insights = generateTextInsights(
        keywords, sentimentDirection, emotions, baselineMood
      );

      return reply.send({
        range,
        totalEntries: entries.length,
        entriesWithText: entriesWithText.length,
        sentiment: {
          overall: overallSentiment,
          trend: sentimentTrend,
          direction: sentimentDirection,
        },
        keywords,
        emotions: {
          breakdown: emotions,
          primary: emotions.length > 0 ? emotions[0].emotion : 'neutral',
        },
        insights,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
}
