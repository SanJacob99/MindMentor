import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { buildApp } from '../src/buildApp';
import prisma from '../src/utils/db';
import jwt from 'jsonwebtoken';

describe('Insight Routes - DoS Protection', () => {
    const originalFindMany = prisma.journalEntry.findMany;

    before(() => {
        // @ts-ignore
        prisma.journalEntry.findMany = async () => {
            // Return 10 entries for the same day to simulate potential overload/spam
            const spamEntries = Array(10).fill(null).map(() => ({
                createdAt: new Date('2023-10-20T10:00:00Z'),
                mood: 8,
                stress: 4,
                energy: 6
            }));

            return [
                ...spamEntries,
                { createdAt: new Date('2023-10-21T10:00:00Z'), mood: 6, stress: 5, energy: 6 }
            ];
        };
    });

    after(() => {
        prisma.journalEntry.findMany = originalFindMany;
    });

    test('GET /insights/summary aggregates multiple entries per day', async () => {
        process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

        const app = buildApp();
        const token = jwt.sign({ userId: 'test-user' }, process.env.JWT_SECRET);

        const response = await app.inject({
            method: 'GET',
            url: '/insights/summary?range=7d',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        assert.strictEqual(response.statusCode, 200);
        const body = JSON.parse(response.body);

        // Should have exactly 2 days of data, not 11
        assert.strictEqual(body.labels.length, 2, `Expected 2 labels, got ${body.labels.length}`);
        assert.strictEqual(body.dataset.mood.length, 2, `Expected 2 mood points, got ${body.dataset.mood.length}`);

        // Verify values
        // Day 1: 10 entries of mood 8 -> avg 8
        assert.strictEqual(body.labels[0], '2023-10-20');
        assert.strictEqual(body.dataset.mood[0], 8);

        // Day 2: 1 entry of mood 6 -> avg 6
        assert.strictEqual(body.labels[1], '2023-10-21');
        assert.strictEqual(body.dataset.mood[1], 6);
    });
});
