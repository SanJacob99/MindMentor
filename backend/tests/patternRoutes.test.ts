import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { buildApp } from '../src/buildApp';
import prisma from '../src/utils/db';
import jwt from 'jsonwebtoken';

describe('Pattern Analysis Routes', () => {
  const originalFindMany = prisma.journalEntry.findMany;
  const originalFindUnique = prisma.user.findUnique;

  const mockEntries = [
    { createdAt: new Date('2026-01-15T08:00:00Z'), mood: 8, stress: 3, energy: 7, tags: ['exercise', 'outdoors'], text: 'Went for a great morning run, feeling happy and energized' },
    { createdAt: new Date('2026-01-16T09:00:00Z'), mood: 7, stress: 4, energy: 6, tags: ['exercise'], text: 'Good workout today, calm and peaceful' },
    { createdAt: new Date('2026-01-17T14:00:00Z'), mood: 5, stress: 6, energy: 5, tags: ['work', 'deadline'], text: 'Stressed about the deadline, feeling anxious' },
    { createdAt: new Date('2026-01-18T20:00:00Z'), mood: 4, stress: 7, energy: 4, tags: ['work'], text: 'Long day at work, exhausted and frustrated' },
    { createdAt: new Date('2026-01-19T10:00:00Z'), mood: 6, stress: 5, energy: 6, tags: ['social'], text: 'Met friends for coffee, enjoyed the conversation' },
    { createdAt: new Date('2026-01-20T11:00:00Z'), mood: 7, stress: 3, energy: 7, tags: ['exercise', 'outdoors'], text: 'Beautiful hike in the park, wonderful day' },
    { createdAt: new Date('2026-01-21T15:00:00Z'), mood: 6, stress: 4, energy: 5, tags: ['work'], text: 'Productive day, made good progress' },
    { createdAt: new Date('2026-01-22T09:00:00Z'), mood: 8, stress: 2, energy: 8, tags: ['exercise'], text: 'Amazing morning, feeling grateful and excited' },
    { createdAt: new Date('2026-01-23T16:00:00Z'), mood: 5, stress: 6, energy: 4, tags: ['work', 'deadline'], text: 'Another stressful deadline approaching' },
    { createdAt: new Date('2026-01-24T12:00:00Z'), mood: 7, stress: 3, energy: 7, tags: ['social', 'outdoors'], text: 'Relaxed weekend with family' },
  ];

  before(() => {
    // @ts-ignore
    prisma.journalEntry.findMany = async () => mockEntries;
    // @ts-ignore
    prisma.user.findUnique = async () => ({ preferences: { timezoneOffset: 0 } });
  });

  after(() => {
    prisma.journalEntry.findMany = originalFindMany;
    prisma.user.findUnique = originalFindUnique;
  });

  // Use unique userIds per endpoint group to avoid rate limit collisions
  function getToken(userId = 'test-user-patterns') {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    return jwt.sign({ userId }, process.env.JWT_SECRET);
  }

  // --- /insights/patterns ---

  test('GET /insights/patterns returns time-of-day and weekday patterns', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/insights/patterns?range=30d',
      headers: { Authorization: `Bearer ${getToken()}` },
    });

    assert.strictEqual(response.statusCode, 200);
    const body = JSON.parse(response.body);

    assert.strictEqual(body.range, '30d');
    assert.ok(body.entryCount > 0);
    assert.ok(body.timeOfDay);
    assert.ok(Array.isArray(body.timeOfDay.buckets));
    assert.strictEqual(body.timeOfDay.buckets.length, 4);
    assert.ok(body.timeOfDay.bestBucket);
    assert.ok(body.timeOfDay.worstBucket);
    assert.ok(body.weekday);
    assert.ok(Array.isArray(body.weekday.days));
    assert.strictEqual(body.weekday.days.length, 7);
    assert.ok(body.trends);
    assert.ok(Array.isArray(body.trends.weeks));
    assert.ok(body.trends.direction);
    assert.ok(body.streaks);
    assert.ok(Array.isArray(body.streaks.current));
    assert.ok(Array.isArray(body.streaks.best));
    assert.ok(body.streaks.volatility);
    assert.ok(body.recovery);
    assert.ok(Array.isArray(body.insights));
  });

  test('GET /insights/patterns defaults to 30d range', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/insights/patterns',
      headers: { Authorization: `Bearer ${getToken()}` },
    });

    assert.strictEqual(response.statusCode, 200);
    const body = JSON.parse(response.body);
    assert.strictEqual(body.range, '30d');
  });

  test('GET /insights/patterns requires auth', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/insights/patterns',
    });

    assert.strictEqual(response.statusCode, 401);
  });

  test('GET /insights/patterns returns minimum data message when insufficient entries', async () => {
    const originalMock = prisma.journalEntry.findMany;
    // @ts-ignore
    prisma.journalEntry.findMany = async () => [
      { createdAt: new Date('2026-01-15T08:00:00Z'), mood: 7, stress: 3, energy: 6 },
    ];

    const app = buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/insights/patterns',
      headers: { Authorization: `Bearer ${getToken()}` },
    });

    assert.strictEqual(response.statusCode, 200);
    const body = JSON.parse(response.body);
    assert.ok(body.message);
    assert.strictEqual(body.minimumDataRequired, 7);

    prisma.journalEntry.findMany = originalMock;
  });

  // --- /insights/tags ---

  test('GET /insights/tags returns tag analysis and combinations', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/insights/tags?range=30d',
      headers: { Authorization: `Bearer ${getToken('test-user-tags')}` },
    });

    assert.strictEqual(response.statusCode, 200);
    const body = JSON.parse(response.body);

    assert.strictEqual(body.range, '30d');
    assert.ok(body.entryCount > 0);
    assert.ok(body.baseline);
    assert.ok(typeof body.baseline.mood === 'number');
    assert.ok(Array.isArray(body.tagAnalysis));
    assert.ok(body.tagAnalysis.length > 0);
    assert.ok(Array.isArray(body.combinations));
    assert.ok(Array.isArray(body.negativeCorrelations));
    assert.ok(Array.isArray(body.insights));

    // Verify tag analysis structure
    const tag = body.tagAnalysis[0];
    assert.ok(tag.tag);
    assert.ok(typeof tag.entryCount === 'number');
    assert.ok(tag.averages);
    assert.ok(tag.deviations);
    assert.ok(typeof tag.frequencyInLowMood === 'number');
    assert.ok(typeof tag.frequencyInHighMood === 'number');
    assert.ok(['positive', 'negative', 'neutral'].includes(tag.impact));
  });

  test('GET /insights/tags returns empty for no entries', async () => {
    const originalMock = prisma.journalEntry.findMany;
    // @ts-ignore
    prisma.journalEntry.findMany = async () => [];

    const app = buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/insights/tags',
      headers: { Authorization: `Bearer ${getToken('test-user-tags2')}` },
    });

    assert.strictEqual(response.statusCode, 200);
    const body = JSON.parse(response.body);
    assert.strictEqual(body.entryCount, 0);
    assert.deepStrictEqual(body.tagAnalysis, []);

    prisma.journalEntry.findMany = originalMock;
  });

  test('GET /insights/tags requires auth', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/insights/tags',
    });

    assert.strictEqual(response.statusCode, 401);
  });

  // --- /insights/text-analysis ---

  test('GET /insights/text-analysis returns sentiment, keywords, and emotions', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/insights/text-analysis?range=30d',
      headers: { Authorization: `Bearer ${getToken('test-user-text')}` },
    });

    assert.strictEqual(response.statusCode, 200);
    const body = JSON.parse(response.body);

    assert.strictEqual(body.range, '30d');
    assert.ok(body.totalEntries > 0);
    assert.ok(body.entriesWithText > 0);
    assert.ok(body.sentiment);
    assert.ok(typeof body.sentiment.overall === 'number');
    assert.ok(Array.isArray(body.sentiment.trend));
    assert.ok(['improving', 'declining', 'stable'].includes(body.sentiment.direction));
    assert.ok(Array.isArray(body.keywords));
    assert.ok(body.emotions);
    assert.ok(Array.isArray(body.emotions.breakdown));
    assert.ok(body.emotions.primary);
    assert.ok(Array.isArray(body.insights));
  });

  test('GET /insights/text-analysis returns minimum data message when insufficient text entries', async () => {
    const originalMock = prisma.journalEntry.findMany;
    // @ts-ignore
    prisma.journalEntry.findMany = async () => [
      { createdAt: new Date('2026-01-15T08:00:00Z'), mood: 7, text: 'Hello' },
      { createdAt: new Date('2026-01-16T08:00:00Z'), mood: 6, text: null },
    ];

    const app = buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/insights/text-analysis',
      headers: { Authorization: `Bearer ${getToken('test-user-text2')}` },
    });

    assert.strictEqual(response.statusCode, 200);
    const body = JSON.parse(response.body);
    assert.ok(body.message);
    assert.strictEqual(body.minimumDataRequired, 5);

    prisma.journalEntry.findMany = originalMock;
  });

  test('GET /insights/text-analysis requires auth', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/insights/text-analysis',
    });

    assert.strictEqual(response.statusCode, 401);
  });
});
