import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { buildApp } from '../src/buildApp';
import prisma from '../src/utils/db';
import jwt from 'jsonwebtoken';

describe('Insight Routes', () => {
    // Mock prisma
    const originalFindMany = prisma.journalEntry.findMany;

    before(() => {
        // @ts-ignore
        prisma.journalEntry.findMany = async () => {
            return [
                { createdAt: new Date('2023-10-20'), mood: 8, stress: 3, energy: 7 },
                { createdAt: new Date('2023-10-21'), mood: 6, stress: 5, energy: 6 },
            ];
        };
    });

    after(() => {
        prisma.journalEntry.findMany = originalFindMany;
    });

    test('GET /insights/summary returns mood, stress, and energy', async () => {
        // Set env secret if missing
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

        if (response.statusCode !== 200) {
            console.error(response.body);
        }

        assert.strictEqual(response.statusCode, 200);
        const body = JSON.parse(response.body);

        assert.ok(body.dataset);
        assert.ok(Array.isArray(body.dataset.mood));
        assert.ok(Array.isArray(body.dataset.stress));
        assert.ok(Array.isArray(body.dataset.energy));
        assert.strictEqual(body.dataset.mood[0], 8);
        assert.strictEqual(body.dataset.stress[0], 3);
        assert.strictEqual(body.dataset.energy[0], 7);
    });
});
