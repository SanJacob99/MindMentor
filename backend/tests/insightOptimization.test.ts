import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { buildApp } from '../src/buildApp';
import prisma from '../src/utils/db';
import jwt from 'jsonwebtoken';

describe('Insight Optimization - Security', () => {
    let originalFindMany: any;
    let findManyArgs: any = null;

    before(() => {
        originalFindMany = prisma.journalEntry.findMany;
        // @ts-ignore
        prisma.journalEntry.findMany = async (args) => {
            findManyArgs = args;
            // Return empty list as we only care about args
            return [];
        };
    });

    after(() => {
        prisma.journalEntry.findMany = originalFindMany;
    });

    test('GET /insights/summary selects only necessary fields', async () => {
        process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
        const app = buildApp();
        const token = jwt.sign({ userId: 'test-user' }, process.env.JWT_SECRET);

        await app.inject({
            method: 'GET',
            url: '/insights/summary',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        assert.ok(findManyArgs, 'findMany should have been called');

        // Security Check: verify 'select' is used to avoid fetching 'text' field
        assert.ok(findManyArgs.select, 'findMany call should use "select" to limit fields');

        // Check specifically that we are NOT selecting 'text' (implicitly or explicitly)
        // If select is present, only true fields are selected.
        assert.strictEqual(findManyArgs.select.mood, true);
        assert.strictEqual(findManyArgs.select.stress, true);
        assert.strictEqual(findManyArgs.select.energy, true);
        assert.strictEqual(findManyArgs.select.createdAt, true);

        // Ensure text is NOT selected
        assert.strictEqual(findManyArgs.select.text, undefined, 'Should not select text field');
        assert.strictEqual(findManyArgs.select.tags, undefined, 'Should not select tags field');
    });
});
